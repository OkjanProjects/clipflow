# ClipFlow

App mobile de templates e edição de vídeo, construído como **reimplementação limpa** a partir da
análise estática das superfícies públicas do CapCut (web + APK Android). Roda em **Android e iOS via
Expo Go**, e também no navegador.

- **Stack:** Expo SDK 58 · React Native 0.88 · expo-router · TypeScript · Hermes
- **Dados:** camada mock local que reproduz os contratos reais (`/lv/v1/*`, `/lv/v2/*`, `/passport/*`)
- **Nada de código proprietário:** nenhum binário, bundle Lynx, asset ou segredo foi copiado

Relatórios da análise que originou o app (incluídos em `docs/`):

- `docs/capcut-web-rea-report.md` — arquitetura web, rotas, modelo de dados, funil
- `docs/capcut-apk-rea-report.md` — identidade do APK, arquitetura VEGA/Lynx, 47 canais, mapa de API
- `docs/ARQUITETURA.md` — ligação de cada achado ao arquivo que o implementa

---

## 1. Rodar no celular em 2 minutos (Expo Go)

Pré-requisitos:

- Node.js 20+ (testado com 22.23.4)
- Celular Android ou iPhone com o app **Expo Go** instalado
- Celular e computador na **mesma rede Wi-Fi**

```bash
cd clipflow
npm install
npm run start:lan
```

O terminal mostra um QR code. No celular:

- **Android:** abra o Expo Go → *Scan QR code*
- **iPhone:** abra a câmera e toque no aviso do Expo Go

O bundle é servido pela rede local (LAN). Se o Windows/Linux estiver com firewall bloqueando a porta
8081, libere a porta ou use o modo túnel:

```bash
npm run start:tunnel
```

O modo túnel usa `@expo/ngrok` (já incluído em `devDependencies`) e funciona fora da mesma rede — útil
em 4G ou Wi-Fi corporativo.

> **Expo Go e a versão do SDK:** o Expo Go da loja suporta apenas o SDK mais recente. Este projeto usa
> o SDK 58. Se o Expo Go reclamar de incompatibilidade, atualize o app na loja ou gere um development
> build (seção 5).

### Rodar no navegador

```bash
npm run web
```

Abre em `http://localhost:8081`. O build estático de produção também está validado:

```bash
npx expo export --platform web --output-dir dist-web
npx serve dist-web        # ou qualquer servidor estático
```

---

## 2. Scripts

| Script | O que faz |
| --- | --- |
| `npm start` | Metro + QR (padrão: LAN) |
| `npm run start:lan` | Força o endereço de rede local |
| `npm run start:tunnel` | Túnel público (funciona fora da LAN) |
| `npm run android` | Abre no emulador/dispositivo Android conectado |
| `npm run ios` | Abre no simulador iOS (macOS) |
| `npm run web` | Versão web (react-native-web) |
| `npm run typecheck` | `tsc --noEmit` — validação de tipos |
| `npm run export:android` | Gera o bundle Hermes de produção (`dist/`) |
| `npm run lint` | ESLint do Expo |

Verificações já executadas neste projeto:

- `npx tsc --noEmit` → sem erros
- `npx expo export --platform android` → `dist/_expo/static/js/android/entry-*.hbc` (Hermes, ~4,6 MB)
- `npx expo export --platform web` → `dist-web/` com code-splitting por rota
- Metro servindo o manifesto e o bundle Android de desenvolvimento (HTTP 200, ~10 MB)

---

## 3. Estrutura

```
src/
  app/                        rotas (expo-router, file-based)
    _layout.tsx               tema escuro + SessionProvider + Stack
    (tabs)/
      _layout.tsx             4 abas: Descobrir, Templates, Criar, Perfil
      index.tsx               feed em grade com paginação por cursor
      templates.tsx           busca + categorias + coleções
      create.tsx              hub de criação + gate de conta
      profile.tsx             sessão visitante/membro + sobre
    template/[id].tsx         detalhe: vídeo, stats, recomendações, CTA
    editor/[id].tsx           editor mock + timeline + export assíncrono
    +not-found.tsx            fallback de rota
  components/
    ui.tsx                    Button, Chip, Badge, Stat, EmptyState, Screen…
    template-card.tsx         card em grade / rail / linha
    video-hero.tsx            player (expo-video) com poster de fallback
    bottom-sheet.tsx          sheet animado (gate de login, export)
  lib/
    api.ts                    camada de dados mock/remote + fila common_task
    mock-data.ts              16 templates, 6 coleções, 8 categorias
    session.tsx               device_login → bind_visitor_account (SecureStore)
    use-feed.ts               hook de feed com cursor e refresh
    format.ts                 contadores, duração, tempo relativo
    types.ts                  Template, Collection, SessionUser, ExportTask
  constants/theme.ts          tokens de design (acento #00CAE0)
docs/ARQUITETURA.md           achado → arquivo que implementa
```

---

## 4. Mock local vs API remota

Por padrão o app roda **100% offline com dados mock**. Isso é intencional: o backend real exige
sessão autenticada e devolve `ret: 1015` / `check login error` para anônimos.

Para apontar para um backend compatível (o seu próprio, ou um proxy que você tenha autorização para
usar), defina a variável de ambiente:

```bash
EXPO_PUBLIC_API_BASE_URL=https://seu-backend.exemplo npm run start:lan
```

Com isso, `src/lib/api.ts` passa a chamar os caminhos reais:

| Chamada | Endpoint |
| --- | --- |
| Coleções | `GET /lv/v1/replicate/get_collections` |
| Feed paginado | `POST /lv/v2/replicate/get_collection_templates` |
| Templates por id | `POST /lv/v1/replicate/multi_get_templates` |
| Recomendações | `GET /lv/v1/homepage/templates` |
| Export — criar | `POST /lv/v1/common_task/new` |
| Export — consultar | `GET /lv/v1/common_task/query` |

O parser trata o padrão do backend: **HTTP 200 com `ret != "0"` no corpo** também é erro.

---

## 5. Gerar um APK instalável

O app roda via Expo Go sem build. Para um `.apk` próprio existem dois caminhos.

> **Sem computador?** Veja `docs/APK-NO-CELULAR.md` — GitHub Actions, EAS pelo celular e um
> empacotador WebView que roda no Termux em ~2 minutos (`tools/webview-apk/`). O passo a passo do
> GitHub está em `docs/PUBLICAR-GITHUB.md`.

### 5.1 EAS Build (nuvem, não precisa de Android SDK)

```bash
npm install -g eas-cli
eas login                      # conta gratuita em expo.dev
cd clipflow
eas build -p android --profile preview
```

O perfil `preview` em `eas.json` gera **APK** com distribuição interna. Ao terminar, o EAS devolve um
link de download; instale no celular (é preciso permitir "instalar apps desconhecidos").

Perfis disponíveis:

| Perfil | Saída | Uso |
| --- | --- | --- |
| `development` | APK com dev client | depuração com Metro |
| `preview` | APK assinado | testar no celular |
| `production` | AAB | Play Store |

### 5.2 Build local (precisa de Android SDK)

```bash
# instale o Android SDK e aceite as licenças; depois:
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

npx expo prebuild -p android
npx expo run:android --variant release
# APK em android/app/build/outputs/apk/release/app-release.apk
```

Este ambiente **não tem Android SDK instalado** (`ANDROID_HOME` vazio), por isso o build local não foi
executado aqui — apenas o bundle Hermes foi validado.

---

## 6. Deep links

O scheme é `clipflow://`:

```bash
clipflow://template/7625211784307248404
clipflow://editor/7625211784307248404
```

No Expo Go o scheme é o do Expo, então use o prefixo `--/`:

```bash
npx uri-scheme open "exp://127.0.0.1:8081/--/template/7625211784307248404" --android
```

No navegador, as rotas são caminhos normais: `/template/<id>` e `/editor/<id>`.

---

## 7. O que está implementado

- Feed em grade com **paginação por cursor**, pull-to-refresh e estados de erro/vazio
- Coleções reais do produto (`10001`, `70003`, `10003`, `10002`, `10006`, `10012`)
- Busca local por título, descrição, autor e categoria
- Detalhe do template: player em loop, poster de fallback, métricas, autor, recomendações
- **Sessão visitante primeiro**: `device_login` → `bind_visitor_account`, persistida em SecureStore
- Gate de conta no CTA e no editor (mesmo funil do produto original)
- Editor mock com timeline, ferramentas e **export assíncrono** (`common_task/new` → polling em
  `common_task/query`) com barra de progresso e `task_id`
- Deep links, tema escuro, tipografia e acento `#00CAE0` derivados da análise

## 8. O que **não** está implementado (de propósito)

- Login real, OAuth, captura de credenciais ou qualquer bypass de autenticação/paywall/DRM
- Renderização de vídeo de verdade (o export simula a fila; não há FFmpeg no device)
- Extração ou reuso de assets proprietários, fontes, efeitos ou presets do CapCut
- Sincronização de projetos, upload para CDN, compras, anúncios
- Funcionalidades que dependem de endpoints autenticados não mapeados

---

## 9. Aviso legal

Projeto independente e educacional. **Não é afiliado, associado ou endossado pela CapCut ou
ByteDance.** "CapCut" pertence aos seus respectivos donos. A análise foi feita apenas sobre
superfícies públicas (site sem login e APK distribuído publicamente), sem contornar autenticação,
proteções técnicas ou termos de uso. Os dados do app são fictícios; as capas vêm de `picsum.photos`
e os vídeos de exemplo do bucket público do Google (`gtv-videos-bucket`).
