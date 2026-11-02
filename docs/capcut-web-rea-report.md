# CapCut Web — Reconhecimento com REA (base para um app mobile)

**Alvo:** `https://www.capcut.com/`
**Data:** 02/11/2026
**Método:** REA 6.8.0 — captura passiva via CDP/Playwright, análise estática de bundles, sem login e sem contornar paywall/DRM.
**Perfil:** Chromium 156 (Brave), viewport 390×844, locale `pt-BR`, TZ `America/Sao_Paulo`.
**Modelo:** `opencode/big-pickle` (custo 0).

---

## 1. Resumo executivo

O capcut.com é um **site SSR (Modern.js/React) com hidratação**, sustentado por um **BFF próprio** (`www.capcut.com/lv/...`) e por um conjunto de serviços de plataforma (`*.capcutapi.com`). A superfície pública é essencialmente um **funil de aquisição**: páginas SEO de ferramentas → hub de templates → detalhe do template → gate de login → app (web/desktop/mobile).

Quatro conclusões que importam para construir um app mobile:

1. **O dado do template já vem pronto no HTML** (`__MODERN_ROUTER_DATA__`). Não existe API pública de templates: a lista e o detalhe são renderizados no servidor. Um app que queira o mesmo catálogo precisaria de um BFF equivalente, não de scraping do cliente.
2. **O gate de login é explícito e antecipado.** `/my-edit` (editor web) e `/creative-suite` empurram para `/login`; a página de template **pré-carrega** um iframe `login-embed` antes de qualquer ação do usuário. Sem sessão, o BFF responde `ret: 1015 "check login error"`.
3. **A distribuição mobile é feita por deep link + fallback web**, não por API: `capcut://template/detail?template_id=...`, `apple-itunes-app` com `app-argument`, OneLink (`capcut-yt.onelink.me/W3Oy`) e um **APK hospedado publicamente** em CDN.
4. **A telemetria é o "sistema nervoso" do produto**: `mcs-normal-sg` (eventos), `mon-sg` (Slardar/Argus/CSP reports), `vmweb` (A/B). Um clone precisa decidir desde o início entrega de eventos, A/B e i18n — são três SDKs distintos, não um.

---

## 2. Arquitetura observada

### 2.1 Renderização e camadas

| Camada | Evidência | Observação |
|---|---|---|
| SSR React/Modern.js | header `x-modernjs-render: server` | HTML completo no primeiro byte; hidratação depois |
| BFF same-origin | `POST /lv/v1/user/web/get_user_info` | agregador de sessão/perfil; responde `1015` para anônimo |
| Plataforma | `vmweb-normal-sg.capcutapi.com` | `/service/2/abtest_config/`, `/service/2/web_sdk_settings/` |
| Telemetria | `mcs-normal-sg.capcutapi.com` | `POST /webid`, `POST /list` (lotes de eventos) |
| Observabilidade | `mon-sg.capcutapi.com` | `monitor_browser/collect/batch/...` (Slardar + Argus + CSP) |
| i18n | `starling-normal-sg.capcutapi.com` | `check_and_get_text/{apiKey}/normal/{ns}?lang=...` |
| Editor API | `edit-api-sg.capcut.com` | referenciado nos bundles; não exercitado (exige login) |
| CDN estático | `sf16-ug-neutral.capcutstatic.com` | bundles JS/CSS do app de landing |
| CDN de mídia | `p16-seeyou-sg.ibyteimg.com`, `v16-vod.capcutvod.com` | capas e vídeos de template |

**appId 348188**, `psm` varia por página (`growth.capcut.landing_page`, `growth.capcut.template_detail`), `app_version 1.0.0.827`, SDK de eventos `5.4.1_oversea`.

### 2.2 CSP (recorte)

`connect-src` libera `*.capcut.com`, `*.capcutapi.com`, `*.capcutstatic.com`, `*.ibyteimg.com`, `*.capcutvod.com`, `*.tiktok.com`, `*.byteintlapi.com`, `*.run.app`, `macan-native.com`, `localhost:*`.
`frame-src` inclui `capcut-yt.onelink.me`, `kefu-im-i18n.byteintl.com` (suporte), players de mídia e `*.facebook.com`/`*.google.com`.
Implicação: o editor web conversa com hosts de mídia e de pagamento (`*.pipopay.com`) fora do domínio principal — o modelo de segurança é por allowlist ampla, não por same-origin.

### 2.3 Bootstrap de página (template detail)

O HTML traz, além do conteúdo:

- `<script id="__GTW_AGW_INFO__">` — metadados do gateway (branch de build, região);
- `__GTW_IP_LOCATION_INFO__`, `__GTW_LOCATION_CODE__`, `__GTW_LOCATION_INFO__` — geolocalização injetada na borda;
- `__GTW_WEB_ID__` — `web_id` gerado no gateway;
- `__GTW_UT__` — flags de primeira visita/sessão;
- `__MODERN_ROUTER_DATA__` — **o payload real da página** (loaderData + templateDetail + recommendList + footer + flags de região/login);
- `__MODERN_SSR_DATA__` — metadados de i18n/SSR.

Ou seja: **o gateway faz parte do produto**. Região, web_id e localização chegam antes do JS da aplicação rodar.

---

## 3. Mapa de superfícies públicas

Rotas confirmadas por captura ou por constante de bundle:

| Rota | Tipo | O que entrega | Evidência |
|---|---|---|---|
| `/` | SSR landing | SEO, navegação de produtos, CTA de download | captura `capcut-scenario-capture.json` |
| `/tools/*` (55 links) | SSR SEO | páginas de ferramenta (gerador de vídeo, remover fundo, legendas…) | DOM de `/template` |
| `/template` | SSR hub | categorias; cards não renderizam nesse viewport | `capcut-template-capture.json` |
| `/template/{social,holiday,calendar,effects,business,industry,record,…}` | SSR hub | 12 cards SSR com link `/template-detail/{slug}/{id}` | `capcut-tpl-social-capture.json` |
| `/template-detail/{slug}/{id}` | SSR detalhe | modelo completo do template + recomendações + deep link | `capcut-tpl-detail-capture.json` |
| `/discover/category/{Name}/{collectionId}` | SSR/CSR feed | coleções (Following 70003, For-You 10001, TikTok 10003, Effects 10002, Celebrate 10006, Fandom 10012) | `__MODERN_ROUTER_DATA__` |
| `/discover/creator/{secUid}` | perfil | autor do template | `author.profileUrl` |
| `/explore/{slug}` | SSR SEO | páginas de intenção ("social media plan" etc.) | a11y do detalhe |
| `/login`, `/signup` | SSR + iframe | login SDK; redireciona para `/{locale}/login` | `capcut-login-capture.json` |
| `/login-embed` | iframe | modal de login pré-carregado em páginas de conteúdo | `capcut-template-capture.json` |
| `/my-edit` | app | editor web; anônimo cai para `/` | `capcut-myedit-capture.json` |
| `/creative-suite` | SSR | apresentação do editor online | `capcut-creative-suite-capture.json` |
| `/download-guidance` | SSR | fallback do OneLink ("Install CapCut in 2 steps") | `capcut-dlguide-capture.json` |
| `/activity/download_pc` | redirect | instalador desktop | `download-guidance` |
| `/tools/capcut-apk-latest-version-android-download` | SSR SEO | **APK direto** + passos de instalação | `capcut-apk-capture.json` |

`robots.txt` bloqueia `/t/`, `*/discover/*`, `*/kep/*`, `/download-guidance`, `/activity/download_pc`, `/templates/`, `/lvpc_web*` — ou seja, o feed e o funil de download são deliberadamente fora do índice.

---

## 4. Modelo de dados do template

Extraído de `__MODERN_ROUTER_DATA__.loaderData.$.templateDetail`:

```
templateId, title, desc, coverUrl, videoUrl, videoRatio, videoWidth, videoHeight,
playAmount, usageAmount, segmentAmount, likeAmount, commentAmount,
templateDuration (ms), createTime (epoch), itemType, capabilityName, scene,
tagTitle, templateLanguage, ugcLang, bizCode, ccDescType, isDefault,
is_valid_template_region, useAvailable, locationInfo, kepInfos, commentList,
collections[], author{name, avatarUrl, description, profileUrl, secUid, uid},
structuredData{name, description, thumbnailUrl, uploadDate, contentUrl, duration,
               interactionStatistic, url, keywords, mainEntityOfPage, width, height,
               creator, locationCreated}, jumpCCServerParams
```

Exemplo observado (`7625211784307248404`): 9:16, 714×1280, 65 s de duração, 657.608 plays, 29.199 usos, 7 segmentos, 6.987 likes, 374 comentários.

**Leitura para o app:** o "segmento" (`segmentAmount`) é a unidade de composição — o template é uma sequência de N clipes com parâmetros. É esse número que define o custo de pré-visualização e o formato de um "template engine" próprio.

`recommendList` traz 10 itens com o mesmo schema (menos campos), o que sugere reuso direto do card no feed.

---

## 5. Funil e gates

```
SEO (/tools/*, /explore/*)
        │
        ▼
Hub (/template, /template/social)
        │  12 cards SSR
        ▼
Detalhe (/template-detail/...)  ──►  capcut://template/detail?template_id=…
        │                            (meta apple-itunes-app / smart banner)
        │  CTA "Use template" (btn-use-template, #00cae0)
        ▼
Login (iframe /login-embed, pré-carregado)  ──►  /login?redirect_url=/my-edit
        │
        ▼
Editor web (/my-edit, PWA)  ──►  edit-api-sg.capcut.com
        │
        ▼
App mobile (OneLink → store, ou APK direto)
```

Observações relevantes:

- **O login é pré-carregado, não sob demanda.** O iframe `login-embed?scene=custom&sdk_login_preset=1&col=1&sdk_preload=1&title_key=...` aparece no tráfego de `/template` e `/template/social` mesmo sem clique. Custo: ~4 requests de SDK + CSS antes de qualquer intenção.
- **`/my-edit` sem sessão volta para `/`.** Não há tela de "editor vazio" pública; o app decide entre landing e login.
- **Geolocalização por redirecionamento de locale**: `/login` → 302 → `/pt-br/login` com base em IP/região. Um app deve tratar locale como estado de servidor, não do cliente.
- **BFF responde 1015 para anônimo** (`get_user_info`): é o sinal canônico de "sem sessão" — bom contrato para o app.

---

## 6. Distribuição mobile e deep links

| Item | Valor observado |
|---|---|
| Deep link de template | `capcut://template/detail?template_id={id}&enter_from=smart_app_banner` |
| Deep link de aba | `capcut://main/tabbar?index=1` |
| iOS | `apple-itunes-app: app-id=1500855883` |
| OneLink | `https://capcut-yt.onelink.me/W3Oy` (pid `WEB_page_official`, siteId 5334854, fallback `/download-guidance`) |
| Android packages | `com.lemon.lvoverseas`, `com.lemon.lvoverus` |
| `assetlinks.json` | 200, com 3 fingerprints por pacote; também declara `web` → `https://www.capcut.com` |
| `apple-app-site-association` | **404** (Universal Links não publicados nesse host) |
| PWA | `start_url: /my-edit?is_pwa=1`, `display: standalone`, tema `#121217`, ícones 16–512 |
| APK público | `https://sf16-sg.tiktokcdn.com/obj/eden-sg/nupkuhs_yvojuh_jj/ljhwZthlaukjlkulzlp/capcut_apk/cc_website_download.apk` |

Assimetria importante: **Android tem App Links completos; iOS não tem AASA**. Na prática, o iOS depende de smart banner + OneLink, enquanto o Android resolve o link direto. Para um app próprio, isso é uma decisão de arquitetura de links a tomar cedo.

---

## 7. Observação vs. inferência vs. desconhecido

**Observado (evidência direta)**
- SSR Modern.js, `appId 348188`, hosts e CSP acima.
- Modelo de dados do template e das coleções.
- Redirect 302 de locale no login; `1015` no BFF para anônimo.
- `/my-edit` anônimo → `/`.
- `login-embed` pré-carregado em páginas de conteúdo.
- APK público, `assetlinks.json`, ausência de AASA, manifest PWA.
- Telemetria em lote (`/list`), com `page_view`, `predefine_pageview`, `seo_aggregation_page`, `client_load`.

**Inferido (baixa/média confiança)**
- `edit-api-sg.capcut.com` é o backend do editor web (constante de bundle + CSP; não exercitado).
- `segmentAmount` = número de clipes do template (coerente com o player e com o `duration`, não confirmado no editor).
- O feed `/discover/*` usa scroll infinito via cursor (o bundle contém `cursor`; não observado em rede).
- `vmweb` A/B usa `ab_vid`/`__tea_sdk_ab_version_*` por cookie.

**Desconhecido (bloqueado por login ou por limite de captura)**
- Contrato real de projetos, upload, export e render (`/lv/*`, `edit-api`).
- Se existe API pública de listagem de templates (nenhuma foi vista; tudo veio no HTML).
- Payload completo de i18n (`starling` devolveu 323 KB > orçamento de 64 KB da captura).
- Comportamento autenticado de `/my-edit` e `/creative-suite`.
- Conteúdo pós-scroll do hub `/template` (cards não renderizados no viewport testado).
- Se o APK público é a build de produção e qual versão.

**Limitações de método**
- `is_spider: true` no header de A/B: o site detecta headless e pode alterar experimentos/conteúdo.
- Nenhuma submissão de credencial foi feita; nenhum asset proprietário foi extraído.
- Eventos de rede limitados a 1 MiB de corpo por transação; corpos grandes ficam `unavailable`.

---

## 8. Recomendações para o app mobile

1. **Copie o padrão BFF, não as rotas.** Um endpoint agregador (`/app/v1/home`) que devolve feed + template + recomendações num payload só evita o efeito cascata que o site tem hoje (HTML → i18n → webid → A/B → eventos).
2. **Trate template como dado versionado.** `templateId` + `segmentAmount` + `videoRatio` + `duration` são o mínimo para renderizar preview; `collections` e `author.secUid` resolvem navegação e perfil sem chamadas extras.
3. **Defina o gate cedo.** O site pré-carrega login; no app, o equivalente é decidir quais abas funcionam anônimas (feed/template) e quais exigem sessão (edição/export). O código `1015` é um bom contrato de "não autenticado".
4. **Links:** adote App Links no Android e Universal Links no iOS desde o início (o CapCut não publica AASA — é uma lacuna que você pode evitar).
5. **Telemetria e A/B são infraestrutura, não feature.** Se o app não tiver entrega de eventos em lote e atribuição de experimento desde o MVP, os dados de funil não serão comparáveis.
6. **i18n no servidor.** O site resolve namespace + locale por API; fazer isso no cliente multiplica requests e atrasa o primeiro frame.

---

## 9. Inventário de evidências

**REA (evidence IDs)**
- `ev_0d0d050fe216c7f5c03bd02a58aa4b0c35aa33bb98d0faed90693bfa9185fa18` — descoberta de alvos CDP
- `ev_13ad78daf32f321e1286cc7234a0fa0ba1aed9a77fe53452211a9d3c8453add2` — primeira inspeção da home
- `ev_ab264e5b61072cf251de42e6947efe49fea4703d12e2911c7982729d13bd2e7b` — 22 scripts da home
- `ev_2f8dbe6f96bd929ad280e5b06b7b387ac3332016e6c3830511d824a32cfb8644` — análise estática dos 19 bundles (591.919 nós AST, 2 rotas, 75 inferências)
- `ev_dcbe2c49c3b7237eab86adfbdd83749dbae3b48598d3eb93f0e8ea59dbcdcb0b` — resumo de cenário (home)

**Arquivos de captura (CLI, completos)**
- `/tmp/capcut-scenario-capture.json` — home (74 requests)
- `/tmp/capcut-login-capture.json` — login (302 → `/pt-br/login`)
- `/tmp/capcut-template-capture.json` — hub `/template`
- `/tmp/capcut-tpl-social-capture.json` — hub `/template/social` (12 cards)
- `/tmp/capcut-tpl-detail-capture.json` — detalhe + `__MODERN_ROUTER_DATA__`
- `/tmp/capcut-creative-suite-capture.json` — `/creative-suite`
- `/tmp/capcut-dlguide-capture.json` — `/download-guidance`
- `/tmp/capcut-apk-capture.json` — página do APK
- `/tmp/capcut-myedit-capture.json` — `/my-edit` anônimo
- `/tmp/capcut-router-data.json`, `/tmp/capcut-csp.txt`, `/tmp/capcut-static/` — artefatos derivados
