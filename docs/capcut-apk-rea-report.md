# CapCut Android (APK) — Análise com REA

**Alvo:** `cc_website_download.apk` (build pública distribuída pela própria página de download do capcut.com)
**SHA-256:** `f2d5cf017bc4bf5a2d3e500a1a8c13cf0c83e3fa1bc707c6603e91af9b77612a`
**Tamanho:** 319.992.455 bytes (305 MiB)
**Data da análise:** 02/11/2026
**Método:** REA 6.8.0 — `inspect-artifact` (inventário do ZIP), `inspect-apk-signature`, decodificação de manifesto com androguard 4.1.4, mineração de strings dos 24 DEX, extração e leitura dos bundles Lynx offline.
**Escopo:** superfície estática, sem execução do app, sem login, sem burlar paywall/DRM, sem extração de assets proprietários.
**Modelo:** `opencode/big-pickle` (custo 0).

> Limitação de método declarada desde já: a decompilação Java completa (JADX) **não rodou** nesta máquina. O host tem 3,6 GiB de RAM e o JADX foi morto pelo OOM killer durante o carregamento do APK inteiro (`java` com 2,1 GiB de RSS). Tudo abaixo vem de inventário estrutural, manifesto decodificado, assinatura, strings de DEX e bundles JS — não de código Java decompilado. Isso muda o que é "fato" e o que é "inferência" (seção 12).

---

## 1. Resumo executivo

O CapCut Android **não é um app nativo com telas nativas**. É um **shell nativo (VEGA) que hospeda UI em Lynx** — a engine de UI declarativa da ByteDance, prima do React Native — com **47 canais de página já embarcados no APK** (`assets/offline/*`). O editor de vídeo é nativo (C++/JNI, `libmiddle-bridge.so` com 77,8 MB), mas **feed, templates, perfil, busca, assinatura, carteira do criador e modais são JavaScript**.

Cinco conclusões que importam para construir um app mobile:

1. **O produto é uma plataforma de páginas, não um app de telas.** 47 canais Lynx + 97 bundles JS (33,3 MB) dentro do APK significam que a maior parte da UI pode ser atualizada sem publicar nova versão. O análogo moderno seria "React Native/Expo Updates" ou WebView híbrida — mas aqui é uma engine própria com bundle versionado por canal.
2. **A camada de dados é REST/JSON sobre três hosts** (`feed-api`, `editor-api`, `commerce-api` em `*.capcutapi.com`), com um padrão de nomes `/lv/v1/<domínio>/<ação>` extremamente consistente. É praticamente um "design system de API".
3. **O editor é o fosso.** 235,7 MB de bibliotecas arm64, sendo 77,8 MB em um único `.so` de bridge, mais `libeffect`, `libttvesdk`, `libttffmpeg`, `libbytenn` (inferência neural), `libtt_c2pa_sdk` (proveniência de conteúdo). Reimplementar isso é projeto de anos; consumir é o caminho realista.
4. **Monetização é multicamada e agressiva**: 10+ SDKs de anúncio mediados, Play Billing 6.0.1, carteira própria (Pipo), assinatura com 6 modais Lynx dedicados (`image_lynx_subscription*`) e um canal de "ad intercept modal".
5. **A superfície exportada é pequena e convencional** — 22 activities exportadas, quase todas `SEND`/`VIEW`. Não há `exported=true` em provider de dados sensíveis nem receiver sem permissão além dos SDKs de push/instalação.

---

## 2. Identidade e integridade

| Campo | Valor |
|---|---|
| Package | `com.lemon.lvoverseas` |
| Nome exibido | CapCut |
| versionName | `13.6.0` |
| versionCode | `13601600` |
| minSdk / targetSdk | `21` / `34` |
| Application class | `com.vega.launcher.ScaffoldApplication` |
| Launcher | `com.vega.main.MainActivity` |
| ABIs | `arm64-v8a`, `armeabi-v7a` (**sem x86/x86_64**) |
| Permissões declaradas | 58 |
| `largeHeap` | `true` |
| `allowBackup` | `false` |
| `requestLegacyExternalStorage` | `true` |
| `allowNativeHeapPointerTagging` | `false` |
| `appComponentFactory` | `androidx.core.app.CoreComponentFactory` |

Assinatura (`inspect-apk-signature`): **v1 + v2 + v3 presentes**. Certificado `O=bytedance, CN=lemon`, serial `1AE72B8C`, válido de 2019-05-07 a 2044-04-30, RSA. Fingerprint SHA-256 `6f33fd446f6e83a767d4fff9c19cecf76059814ea6a7ea71df1d0def2d75db31` — **o mesmo publicado em `https://www.capcut.com/.well-known/assetlinks.json`**, o que confirma que este APK é a build oficial usada pelo App Links do site.

Arquivos de assinatura fora do padrão: `META-INF/BYTESIGN.SF` e `META-INF/BYTESIGN.RSA` (em vez de `CERT.SF`/`CERT.RSA`). É o esquema interno da ByteDance, não um erro.

`billing.properties` → `billing_client=6.0.1`; `integrity.properties` → `integrity_client=1.1.0` (Play Integrity).

---

## 3. Estrutura do pacote

27.633 entradas, 738,7 MB descomprimidos (razão ~2,3×).

| Grupo | Entradas | Peso descomprimido |
|---|---|---|
| `classes*.dex` | 24 | 185 MB |
| `lib/` | 292 (147 por ABI) | 235,7 MB (arm64) |
| `assets/` | 1.920 | 50,1 MB |
| `r/` | 25.031 | recursos (diretório `res/` renomeado) |
| `org/` | 133 | dados do Apache Commons Codec (metafone/BM) |
| `META-INF/` | 103 | assinatura + serviços |
| `gatewayprotocol/` | 36 | `.proto` do gateway de anúncios (Pangle) |

**DEX:** 24 arquivos, 177.234 classes, 1.426.817 métodos, 947.797 strings. Cada DEX fica em exatamente ~60.000 métodos — ou seja, o build é **particionado artificialmente** para caber no limite de 64K referências por DEX. Isso é típico de app gigante com multidex forçado.

**Recursos renomeados:** o diretório de recursos é `r/` e não `res/`, com caminhos como `r/_/j.xml`. É obfuscação de caminho de recurso (R8 + renomeação de diretório), não apenas ofuscação de código. O `networkSecurityConfig` do manifesto (`@7F16000B`) resolve para `r/_/j.xml`.

---

## 4. Arquitetura: VEGA + Lynx

```
ScaffoldApplication (com.vega.launcher)
        │
        ├── MainActivity (com.vega.main) ── shell nativo, tabbar, permissões
        │        │
        │        ├── LynxActivity / lynxview ──► 47 canais offline + bundles remotos
        │        │        └── Gecko (assets/offline) ── pacotes versionados
        │        │
        │        ├── Editor nativo ──► libmiddle-bridge.so (77,8 MB)
        │        │        ├── libttvesdk.so (VESDK: composição/render)
        │        │        ├── libeffect.so + libres_pool.so (efeitos, recursos)
        │        │        ├── libttffmpeg.so (decode/encode)
        │        │        ├── libbytenn.so (inferência neural on-device)
        │        │        ├── liblens.so, libretouch_sdk.so (visão/retouch)
        │        │        └── libtt_c2pa_sdk.so (proveniência C2PA)
        │        │
        │        └── Ponte JS ◄──► com.bytedance.sdk.xbridge (XBridge)
        │
        └── Serviços de plataforma: push, conta, ads, billing, APM, rede
```

**A navegação é por URI, não por Intent de tela.** O padrão dominante nos DEX é:

```
capcut://lynxview?channel=<canal>&bundle=template.js&dynamic=3
capcut://main/lynx?channel=<canal>&bundle=pages/...
```

`dynamic=3` é o modo de atualização do bundle (offline → remoto). Isso é a chave: **o app carrega a página do disco e a substitui pela versão do servidor quando disponível**. O `assets/offline` é o cache inicial; o Gecko é o mecanismo de update.

---

## 5. Os 47 canais Lynx embarcados

Extraídos de `assets/offline/` (cada canal tem `template.js` + `locales/` com **30 idiomas**: ar, cs-CZ, de-DE, el-GR, en, es-LA, fi-FI, fil-PH, fr-FR, he-IL, hu-HU, id-ID, it-IT, ja-JP, km-KH, ko-KR, ms-MY, my-MM, nl-NL, pl-PL, pt-BR, ro-RO, ru-RU, sv-SE, th-TH, tr-TR, uk-UA, ur-PK, vi-VN, zh-Hant-TW).

**Descoberta / feed**
`image_lynx_discover`, `image_lynx_main_template`, `image_lynx_template_portal`, `image_lynx_all_search`, `image_lynx_adtemplate_home`, `image_lynx_inspiration_detail`, `image_lynx_tutorial_portal_feed_new`, `cc_landing_lynx`

**Templates**
`image_lynx_favorite_templates`, `image_lynx_group_templates`, `image_lynx_unlocked_templates`, `image_lynx_template_history_list`, `image_lynx_template_guide_modal`

**Perfil / criador**
`image_lynx_profile_home`, `image_lynx_user_portrait`, `image_lynx_creator_center`, `image_lynx_creator_wallet`, `image_lynx_creator_work_release_entrance`, `image_lynx_asset`, `image_lynx_graphic_portal`

**Assinatura / pagamento**
`image_lynx_subscription`, `image_lynx_subscription_full_screen`, `image_lynx_subscription_manage`, `image_lynx_subscription_material`, `image_lynx_subscription_modal`, `image_lynx_subscription_pay_modal`, `image_lynx_subscription_startup_modal`, `image_lynx_subscription_open_screen`, `image_lynx_subscription_ad_modal`, `image_lynx_teams_cashier_modal`, `image_lynx_vas_cashier_modal`, `image_lynx_credits_center`, `image_lynx_credits_popup`, `image_lynx_commerce_benefit_modal`, `image_lynx_commerce_sub_detail_page`

**Anúncios**
`image_lynx_ad_free_launch_modal`, `image_lynx_ad_intercept_modal`, `image_lynx_modal_ad_feedback`, `image_lynx_get_reward_points_modal`, `image_lynx_reward_points_landing_modal`

**Outros**
`image_lynx_inbox_new` (caixa de entrada), `image_lynx_splash_screen`, `image_lynx_global_home`, `image_lynx_global_guide_modal`, `image_lynx_smart_vlog_form`, `smart_edit_xgen_omni` (edição inteligente), `vicut_lynx_commerce_comp_popup`

**Leitura:** a proporção revela a estratégia. **15 dos 47 canais são de monetização** (assinatura + créditos + commerce + ads). É quase um terço da superfície de UI dedicada a converter. Para um app novo, isso é um sinal de onde o produto "vive" depois do crescimento.

---

## 6. Stack nativo (arm64, 147 bibliotecas, 235,7 MB)

| Biblioteca | Tamanho | Papel inferido |
|---|---|---|
| `libmiddle-bridge.so` | 77,8 MB | Núcleo do editor + bridge JNI (maior artefato do app) |
| `libmiddleware.so` | 26,2 MB | Middleware de plataforma |
| `libeffect.so` | 26,0 MB | Engine de efeitos |
| `libres_pool.so` | 16,7 MB | Pool de recursos de efeito |
| `libttvesdk.so` | 11,8 MB | VESDK (vídeo/edição) |
| `libttffmpeg.so` | 5,8 MB | FFmpeg customizado |
| `libaudioeffect.so` | 4,8 MB | Processamento de áudio |
| `libsscronet.so` | 4,6 MB | Cronet (rede HTTP/2 da ByteDance) |
| `libAndroidPitayaCore.so` | 3,7 MB | Pitaya (RPC/coordenação) |
| `liblens.so` | 3,7 MB | Visão computacional |
| `liblynx.so` | 3,1 MB | Engine Lynx |
| `libpythonA.so` | 3,0 MB | Runtime Python embarcado |
| `libbytenn.so` | 3,0 MB | Inferência neural |
| `libtt_c2pa_sdk.so` | 2,9 MB | Proveniência de conteúdo (C2PA) |
| `libretouch_sdk.so` | 2,7 MB | Retoque facial/corporal |
| `libmetasec_ov.so` | 1,8 MB | Segurança/anti-tamper (MetaSec) |
| `libwcdb.so` | 1,8 MB | Banco local (WCDB, fork SQLite do WeChat) |
| `libquick.so` | 1,7 MB | Runtime QuickJS (JS auxiliar) |
| `libkrypton.so` | 1,4 MB | Criptografia |
| `libbdvideouploader.so` | 1,1 MB | Upload de vídeo |
| `libAGFX.so` | 0,7 MB | Efeitos gráficos |
| `libspeechsdk.so` | 0,7 MB | Voz/ASR |
| `libBDPythonVM.so` | 0,5 MB | VM Python |

Observações:
- **`libpythonA.so` + `libBDPythonVM.so`**: o app embarca Python. Isso normalmente é usado para scripts de efeito/automação baixados do servidor — um vetor de extensão que quase nenhum app de vídeo tem.
- **`libtt_c2pa_sdk.so`**: assinatura de proveniência de mídia gerada por IA. É requisito regulatório (UE AI Act) e diferencia de concorrentes.
- **`libmetasec_ov.so` + `libnpth*`**: camada anti-tamper/anti-instrumentação.
- **Sem x86**: emuladores Android comuns (AVD x86_64) **não rodam** este APK.

---

## 7. Mapa de APIs

### 7.1 Hosts

| Host | Uso |
|---|---|
| `feed-api.capcutapi.com` | Feed, templates, relação, busca, share |
| `feed-api-va.hypic.com` | Variante VA do feed + upload (`/api/v1/upload/upload_sign`) |
| `editor-api.capcutapi.com` | Editor, tarefas de IA, config |
| `commerce-api.capcutapi.com` | Assinatura, créditos, trade |
| `passport-api.capcutapi.com` | Login/conta |
| `general-api-us-looki.capcutapi.com` | API geral (região US) |
| `mon-boot.capcutapi.com` | Bootstrap de telemetria |
| `i18n-api.faceueditor.com` | i18n |
| `vcs-{sg,va,va-useast2a}.byteoversea.com` | Serviço de vídeo (VCS) |
| `sami-sg1.byteintlapi.com` | SAMI (media intelligence) |
| `api-retouchpics-intranet.byteintl.net` | Retouch (interno) |
| `sf-fe.capcut.com` | Front-end estático dos bundles Lynx |
| `www.capcut.com/lvpc_web/login_status` | Ponte de sessão web ↔ app |

### 7.2 Padrão de nomenclatura

Tudo é `/lv/v{N}/<domínio>/<ação>`. Domínios observados (nativos + Lynx):

- **Tarefas assíncronas**: `common_task/{new,query,sync,process,cancel}`, `capflow/{submit,query,cancel}` — o padrão "submit → poll" para render/AI.
- **Templates**: `replicate/{get_collections,multi_get_templates,add,replicate_work_add,not_interested,delete_impressions}`, `replicate_pic/*`, `cc_web/plane/*`, `workspace_template/video/*`, `homepage/{templates,vip_templates,related_templates,profile,likes,personal_center,replicate_work_list}`.
- **Feed/social**: `relation/{feeds,follow,cancel_follow,user_recommend,feeds_state}`, `comment/{list,publish,reply_list,like,unlike,stick,cancel_stick,delete,restrict}`, `search/{guess,templates,users,sug,stream,hashtag,feature}`, `hotlist/get_feed_trends`, `notice/get_unpull_count`.
- **Edição/AI**: `edit/{get_config,detect,get_hot_card_list,get_starling_text,submit_img_enhance}`, `intelligent_edit/{drafts/status,drafts/upload,moment/prompt_sug,material_pre_process,security_audit}`, `aigc_text/{submit_task,query_task,get_voiceclone_text}`, `digital_human/*`, `voice/*`, `music/{template_music_recommend,similar_music_rec}`, `effect/{search,multi_get_category}`, `watermark/get_watermark`.
- **Nuvem/rascunhos**: `cloud_property/{get_project_package,get_user_recent_package,favorite_list,search,rename,delete,property_count}`, `cloud/auto_upload/{get,update}_setting`, `cloud/upload/get_record`, `coordination/{batch_send_message,draft_permission_check,get_share_by_draft}`.
- **Dinheiro**: `v1/subscription/*` (user_info, cc_price_list, iap/make_order, iap/make_unauto_order, get_subscribe_info, gift_card_*), `v1/vip/{get_benefits,exchange_benefit}`, `v3/trade/init_trade`, `v2/subscription/aggregate/prepare_payment`, `v1/benefits/user_credit`, `v1/commerce/{withdraw,get_not_withdraw}`, `v1/cc_withdraw/*`, `v1/user/{check_limit,set_limit}`.
- **Criador**: `creator/task/get_publish_creation_tasks`, `authority/get_creator_authority`, `v2/data_center/follower_general`, `v1/popup/new_creator_encourage_shown`.
- **Upload**: `api/v1/upload/upload_sign` (assinatura de upload), `asset/prepare_upload_cloud`, `cc4b/upload_video`, `bdvideouploader`.

### 7.3 O que esse mapa revela

1. **`common_task` e `capflow` são o coração assíncrono.** Render, IA e processamento pesado não são request/response — são job queues com polling. Se você construir algo equivalente, esse contrato vem primeiro.
2. **`cloud_property` é o "drive" do CapCut** — projetos em nuvem, não só rascunhos locais. O editor grava local (`libwcdb`) e sincroniza via `get_project_package`.
3. **A mesma API serve web e app.** `/lv/v1/...` aparece nos bundles web e nos DEX. Isso é deliberado: um BFF só, dois clientes.
4. **`v1/` (sem `lv/`) é o namespace de monetização**, separado do resto. Provavelmente um serviço com deploy independente.

---

## 8. Deep links e superfície exportada

### 8.1 Schemes

| Scheme / host | Componente | Uso |
|---|---|---|
| `capcut://` | `com.vega.launcher.precondition.DeeplinkActivity` | Roteador interno universal |
| `https://www.capcut.com/tt-login/oauthresponse` | `com.lemon.account.TiktokEntryActivity` | Retorno de OAuth TikTok |
| `capcutlogintt://oauthresponse` | `com.lemon.account.TiktokEntryActivity` | OAuth (fallback de scheme) |
| `snssdk3006://` | `com.vega.launcher.init.core.NotifyActivity` | Push/notificação |
| `snssdk2515://` | `com.xt.retouch.applauncher.core.NotifyActivity` | Retouch |
| `pipohybridsdk3006://pipopay/ewallet/webview` | `com.bytedance.pipo...PIPOWalletDispatcherActivity` | Carteira Pipo |
| `com.lemon.lvoverseas://` | `net.openid.appauth.RedirectUriReceiverActivity` | AppAuth/OIDC |
| `fbconnect://cct.com.lemon.lvoverseas` | `com.facebook.CustomTabActivity` | Login Facebook |

### 8.2 Rotas `capcut://` encontradas nos DEX

```
capcut://main/lynx?channel=<canal>&bundle=<bundle>&dynamic=3      (107 ocorrências)
capcut://lynxview?channel=<canal>&bundle=template.js&dynamic=3    (33)
capcut://main/tabbar?index=N                                      (12)
capcut://main/web?url=...&hide_nav_bar=1&loading_bgcolor=...       (6)
capcut://editor/create                                             (6)
capcut://template/detail?template_id=<id>                          (3)
capcut://template/tab | capcut://template/comment?template_id=
capcut://user/homepage?user_id=<id> | capcut://topic/detail?topic_id=
capcut://retouch/{tool,ai_model,4b?tab_name=...}
capcut://edit/{ai_script,ai_translator_notify,quality_enhance,ai_painting_intro}
capcut://aishorts/homepage | capcut://ad/maker | capcut://jump/signup
capcut://media_select | capcut://tutorial/tab | capcut://webview/?url=
```

**`capcut://main/lynx` é o barramento de navegação real.** Toda tela nova é uma URI com `channel` + `bundle`. Isso significa que o app pode abrir qualquer página Lynx — inclusive as de terceiros/parceiros — sem update.

### 8.3 Activities exportadas (23 de 390)

`SEND`/`SEND_MULTIPLE` (compartilhamento de entrada):
`EditShareActivity`, `UploadShareActivity`, `RetouchShareActivity`, `RemoveBackgroundShareActivity`, `ImportFontsShareActivity`

`VIEW`:
`DeeplinkActivity`, `NotifyActivity`, `TiktokEntryActivity`, `PIPOWalletDispatcherActivity`, `RedirectUriReceiverActivity` (AppAuth), `CustomTabActivity` (Facebook), `PushActivity`

Sem filtro (exportadas mas sem action declarada):
`MainActivity`, `BdEntryActivity` (share), `BackFromLemon8Activity`, `FaceuAssistMainActivity`, `LvRecordActivity` (action `record_sdk_action`), `DeveloperActivity`, `SafeModeActivity`, `AnnounceActivity`, `BdEntryActivity`/`ProxyActivity` (retouch), `Lemon8ShareResultActivity`

**Nenhuma delas declara `android:permission`.** São exportadas e sem proteção declarada — a validação é feita em código. Para um app novo, isso é o oposto do recomendado: use `permission` + verificação de assinatura do chamador.

### 8.4 Providers

26 providers, dos quais **4 são `exported=true`**:
- `com.facebook.FacebookContentProvider`
- 3 × `*DepthsI18nAccountStubProvider` (push/contas, com `android.content.ContactDirectory=true`)

Os demais são `exported=false`, incluindo `FileProvider`, `ApkProvider` (upgrade), `PushFileProvider`, `WsChannelMultiProcessSharedProvider`, `AuthTokenMultiProcessSharedProvider`, `BDInstallProvider`, `AppLovinInitProvider`, `MobileAdsInitProvider`, `AudienceNetworkContentProvider`, `VungleProvider`.

### 8.5 Serviços exportados

De 48 services declarados, **10 são exportados**:

- `com.ss.android.message.NotifyService` (push)
- 6 serviços de conta/sync do `com.bytedance.android.push.depths.i18n.account.*` (SyncAdapter + AccountAuthenticator) — **um `AccountAuthenticator` exportado sem permissão é digno de nota**: permite que apps de terceiros peçam tokens via `AccountManager` (sujeito à aprovação do usuário).
- `RevocationBoundService` (Google Sign-In), `SystemJobService` (WorkManager, protegido por `BIND_JOB_SERVICE`).

---

## 9. Autenticação

Rotas de `passport` observadas nas strings:

```
/passport/user/login/
/passport/user/device_login/
/passport/user/login_by_verify_ticket/
/passport/user/check_email_registered
/passport/user/check_mobile_registered
/passport/user/bind_visitor_account/
/passport/user/check_visitor_upgraded/
/passport/username/register/
/passport/password/update/
/passport/token/beat/v2/            ← heartbeat de sessão
/passport/vcd/{get_login_ticket,login_by_ticket,get_user_info_by_ticket,switch_account,get_auth_account}/
/passport/sso/{scan_qrcode,confirm_qrcode}/
/passport/related_login/{get_qrcode,check_qrconnect}/
/passport/safe/{login_device/list,login_device/del,check_env/v1}/
/passport/shark/safe_verify/
/passport/sms/authorize/
/passport/transfer/get_token/
/passport/account/info/v2/
/passport/user/logout/
```

**Modelo inferido:**
- **Login por device** (`device_login`) → conta anônima/visitante desde o primeiro uso, com upgrade posterior (`bind_visitor_account`). É o padrão "comece a usar sem cadastro" que o CapCut usa.
- **VCD = "Verified Credential Delegation"** (tickets): o app não guarda senha; troca ticket por sessão. `login_by_ticket` é o caminho principal.
- **QR code / SSO**: login cruzado entre dispositivos e com o ecossistema TikTok.
- **`safe/check_env` + `shark/safe_verify` + `libmetasec_ov`**: detecção de root/emulador/hook antes de operações sensíveis.
- **Ponte web**: `www.capcut.com/lvpc_web/login_status` sincroniza sessão entre o app e o editor web.

Nenhum teste autenticado foi feito. Nenhuma credencial foi submetida.

---

## 10. Monetização, anúncios e assinatura

### 10.1 Mediação de anúncios

SDKs identificados por pacote/classe e por strings:

| SDK | Evidência |
|---|---|
| **Pangle** (ByteDance) | `com.bytedance.sdk.openadsdk`, `api16-access-sg.pangle.io`, `ssdk-sg.pangle.io`, 36 `.proto` em `gatewayprotocol/` |
| Google Mobile Ads | `ca-app-pub-8563181921274308~3003233985`, `MobileAdsInitProvider` |
| AppLovin / MAX | `com.applovin`, key `hvpk3fAA...`, `dash.applovin.com`, `ms.applovin.com` |
| Meta Audience Network | `com.facebook.ads.AudienceNetworkContentProvider` |
| IronSource | `com.ironsource.lifecycle.IronsourceLifecycleProvider` |
| Unity Ads | `com.unity3d.services.core.configuration.AdsSdkInitializer` |
| Vungle | `com.vungle.warren.utility.VungleProvider`, `config.ads.vungle.com` |
| Fyber, Taboola, Criteo, RTB House | strings de host/SDK |

**10+ redes mediadas** = o app é um exchange de anúncios, não um app com "um banner". Isso explica `image_lynx_ad_intercept_modal` e `image_lynx_modal_ad_feedback`: existem modais dedicados a **interceptar** o usuário com anúncio e a **coletar feedback** do anúncio.

### 10.2 Pagamento

- **Google Play Billing 6.0.1** (`billing.properties`, `com.google.android.play.billingclient.version`).
- **Carteira Pipo** (`com.bytedance.pipo`, `pipohybridsdk3006://pipopay/ewallet/webview`) — pagamento próprio para mercados sem Play Billing ou para web.
- **Assinatura**: `v1/subscription/iap/{make_order,make_unauto_order}`, `v3/trade/init_trade`, `v2/subscription/aggregate/prepare_payment`.
- **Créditos**: `v1/benefits/user_credit`, `image_lynx_credits_center`, `image_lynx_credits_popup`, `image_lynx_get_reward_points_modal` — modelo "créditos + assinatura", comum em apps de IA.
- **Gift cards**: `v1/subscription/gift_card_entrance`, `get_gift_card_config_for_subscribe_page`.

**Padrão de negócio:** assinatura (recorrente) + créditos (consumível, para AI) + anúncios (para non-subscribers) + reward ads (ganhar crédito assistindo). Quatro motores de receita no mesmo app.

---

## 11. Segurança e privacidade

**Positivo:**
- `networkSecurityConfig` (`r/_/j.xml`): `cleartextTrafficPermitted="false"` na base e em `debug-overrides`, com `trust-anchors` apenas `system`. Ou seja, **não há bypass de TLS em produção** e **não há exceção de cleartext** (só `127.0.0.1` declarado, e ainda assim com `false`).
- `allowBackup=false`.
- `google_analytics_default_allow_ad_storage=false`, `allow_ad_user_data=false`, `allow_ad_personalization_signals=false`, `firebase_data_collection_default_enabled=false` — defaults conservadores de consentimento (o opt-in é runtime).
- Assinatura v2+v3 e fingerprint consistente com `assetlinks.json`.

**Atenção:**
- 58 permissões, incluindo `ACCESS_ADSERVICES_AD_ID/ATTRIBUTION/TOPICS`, `CAMERA`, `RECORD_AUDIO`, `ACCESS_MEDIA_LOCATION`, sensores de alta taxa, e o conjunto de armazenamento legado (`requestLegacyExternalStorage=true`).
- **23 activities exportadas sem `android:permission`** — incluindo `DeveloperActivity` e `SafeModeActivity`.
- **`AccountAuthenticator` exportado** (3×) sem permissão: superfície de integração de conta para terceiros.
- **Código de terceiros de anúncio inicializado por `androidx.startup`** (Unity Ads) e por ContentProvider (AppLovin, AdMob, Meta, Vungle) — inicialização antes de qualquer consentimento explícito do usuário no processo.
- **Python embarcado + QuickJS + Lynx dinâmico** = três runtimes de script. Cada um é um caminho de execução de código vindo do servidor. Sem verificação de integridade dos bundles, isso é risco de supply chain.
- `DeveloperActivity` exportada é um alvo clássico de pesquisa (settings escondidos, endpoints de teste).

**Não avaliado:** verificação criptográfica da assinatura (o REA declara explicitamente que não valida cadeia/revogação), presença de certificado de debug, `android:debuggable`, e o conteúdo dos `.so` (não houve análise binária nesta rodada).

---

## 12. Observado vs. inferido vs. desconhecido

### Observado (evidência direta)
- Identidade, versão, SDKs, 58 permissões, application class, launcher.
- 27.633 entradas; 24 DEX com 177.234 classes / 1.426.817 métodos / 947.797 strings.
- 147 libs arm64 (235,7 MB), com a lista e os tamanhos acima.
- 47 canais Lynx offline, 30 locales cada, 97–98 bundles JS (33,3 MB).
- Assinatura v1/v2/v3, certificado `O=bytedance CN=lemon`, fingerprint igual ao de `assetlinks.json`.
- `networkSecurityConfig` sem cleartext e sem trust anchor de usuário em produção.
- 23 activities exportadas; 4 providers exportados; 8 schemes de deep link.
- Lista de endpoints `/lv/v1/*`, `/api/v1/*`, `/passport/*`, `/v1/*` extraída de DEX e de bundles.
- SDKs de anúncio presentes (por classe/provider/host).
- Meta-data: AdMob app id, AppLovin key, AMap key, `JS_VERSION_CODE=58`, `EasyGoClient=true`.
- `billing.properties` 6.0.1, `integrity.properties` 1.1.0.

### Inferido (confiança média)
- **`libmiddle-bridge.so` é o núcleo do editor** — pelo tamanho e pelo nome; não foi desassemblado.
- **`common_task`/`capflow` são job queues com polling** — o par `submit/query/cancel` é inequívoco, mas o payload não foi visto.
- **VCD = ticket-based auth** — a família de rotas é consistente, mas o fluxo exato não foi exercitado.
- **`dynamic=3` = modo de atualização de bundle** — inferido do nome e do padrão Gecko.
- **`cloud_property` = drive de projetos** — inferido dos nomes (`get_project_package`, `property_count`).
- **Python/QuickJS são usados para scripts remotos de efeito** — plausível pelo par `libpythonA` + `libBDPythonVM` + `libquick`, não confirmado.
- **A proporção 15/47 de canais de monetização reflete prioridade de produto** — interpretação, não fato.

### Desconhecido (bloqueado)
- **Código Java decompilado.** O JADX morreu por OOM (3,6 GiB de RAM). Nenhuma classe foi lida em nível de fonte. Um alvo pequeno (um DEX por vez, com heap reduzido) é viável, mas não foi tentado.
- **Contratos de request/response.** Nenhuma chamada autenticada foi feita; os schemas JSON são desconhecidos.
- **Formato do projeto/rascunho** (`get_project_package`) — não extraído.
- **Conteúdo dos `.so`** — sem Ghidra/desassemblagem nesta rodada.
- **Se o APK público é a build de produção exata** da Play Store (versão e assinatura batem com `assetlinks.json`, o que é forte indício, mas não prova).
- **Comportamento de `DeveloperActivity` e `SafeModeActivity`.**
- **Cobertura dos 47 canais**: apenas os bundles foram lidos; a lógica de negócio dentro deles não foi auditada linha a linha.

### Limitações de método
- Inventário de ZIP lê apenas o diretório central; o APK Signing Block e bytes fora de entradas não são "ocorrências".
- `inspect-apk-signature` **não verifica criptograficamente** a assinatura.
- Strings de DEX incluem constantes de bibliotecas de terceiros (Apache, AndroidX) — os números de "hosts" e "paths" brutos superestimam o código próprio.
- Nada foi executado: nenhum comportamento em runtime foi observado.

---

## 13. O que isso significa para o seu app

1. **Não copie a arquitetura de UI — copie a de conteúdo.** 47 canais Lynx funcionam porque existe um pipeline de build/publicação de bundles. Se você usar React Native/Expo, o equivalente é OTA update por "feature bundle". O ganho real é lançar tela sem review de loja.
2. **Comece pelo contrato assíncrono.** `submit → poll → result` com `task_id`, estados e cancelamento. Todo recurso caro (render, IA, transcodificação) deve nascer assim; refatorar depois é caro.
3. **Defina o modelo de "projeto" antes do editor.** O CapCut separa `draft` local (WCDB) de `project package` na nuvem (`cloud_property`). Se você misturar os dois, a sincronização vira dívida eterna.
4. **O gate de conta é "visitante primeiro".** `device_login` + `bind_visitor_account` deixa o usuário criar antes de se registrar. É a decisão de onboarding mais importante do produto.
5. **Monetização desde o MVP, mas separada.** Quatro motores (ads, assinatura, créditos, reward) com namespaces de API distintos (`v1/*` vs `lv/v1/*`). Mantenha o billing isolado do core.
6. **Segurança: faça o oposto do que o CapCut faz em exports.** Nenhuma activity exportada sem `permission`; valide o chamador; não exponha `AccountAuthenticator` sem necessidade.
7. **Não tente reimplementar o editor.** 235 MB de C++ especializado, com C2PA, retouch, inferência on-device e Python embarcado. Integre um SDK de edição ou use o editor web como serviço.

---

## 14. Inventário de evidências

**REA (evidence IDs)**
- `ev_5e5c58a22cd01a6c9d2bcceeb03cda73e54b989edbd4505850235ed8b203dfd6` — inventário do artefato (`inventory_artifact`), 27.633 entradas, 27.462 nós, 27.633 arestas
- `ev_d5189496d5fc3263e14c0bfe905c92266343efdf947d03abe55b7ab7bcdd2024` — resultado agregado do `inspect-artifact`
- `ev_20fbd1bbe72142af08582cf7a356e23aaa8c5c6a00f8ef438d8dff0af7776452` — assinatura v1/v2/v3 + certificado

**Falha registrada (importante para reprodutibilidade)**
- `inspect-android-package` (JADX) → `execution_failure` / `Connection closed`; causa raiz: OOM kill do processo `java` (`anon-rss 2.145.172 kB`, VM total 11,1 GB) em host com 3,6 GiB de RAM. Diagnóstico em `/tmp/opencode/capcut-apk-package.json` e `capcut-apk-package.err`.

**Arquivos**
- `/tmp/opencode/capcut-apk/capcut.apk` — alvo (319.992.455 B)
- `/tmp/opencode/capcut-apk-inventory.json` — inventário completo (30,6 MB)
- `/tmp/opencode/capcut-apk-signature.json` — assinatura
- `/tmp/opencode/capcut-manifest.json` — manifesto decodificado (componentes, filtros, permissões, meta-data)
- `/tmp/opencode/inventory-evidence.json` — Evidence extraível do inventário
- `/tmp/opencode/dex-strings.txt` — 735.053 strings dos 24 DEX
- `/tmp/opencode/hosts.txt` — 255 hosts
- `/tmp/opencode/paths.txt` — 10.107 caminhos
- `/tmp/opencode/lynx-endpoints.txt` — 173 endpoints dos bundles Lynx
- `/tmp/opencode/lynxall/assets/offline/` — 47 canais (41 MB)
- `/tmp/opencode/parse_manifest.py` — script de decodificação (rodar com `./venv/bin/python`)
- `/tmp/opencode/venv/` — venv com androguard 4.1.4

**Documento irmão:** `/home/okjanpc/capcut-web-rea-report.md` (reconhecimento web)
