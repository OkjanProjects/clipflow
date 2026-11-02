# Arquitetura — do achado ao código

Este documento liga cada conclusão da análise do CapCut ao arquivo do ClipFlow que a implementa.
A ideia é simples: **o app não copia código, copia contratos**. Nomes de campo, caminhos de endpoint e
ordem do funil foram mantidos iguais para que trocar o mock por um backend real não exija refatorar a
UI.

Evidências citadas (IDs completos, gerados pelo REA):

| ID | Origem |
| --- | --- |
| `ev_0d0d050f…85fa18` | Web — shell SSR / Modern.js |
| `ev_13ad78da…53add2` | Web — loader do template detail |
| `ev_ab264e5b…bd2e7b` | Web — BFF `/lv/v1/user/web/get_user_info` (`ret: 1015`) |
| `ev_2f8dbe6f…fb8644` | Web — manifesto PWA / `start_url` |
| `ev_dcbe2c49…dbcb0b` | Web — assetlinks / deep links |
| `ev_5e5c58a2…03dfd6` | APK — inventário de artefatos (27.633 entradas) |
| `ev_d5189496…dd2024` | APK — agregado de DEX/strings/endpoints |
| `ev_20fbd1bb…776452` | APK — assinatura v1/v2/v3 e certificado |

Relatórios completos: `capcut-web-rea-report.md` e `capcut-apk-rea-report.md` (nesta pasta).

---

## 1. Modelo de dados

**Achado:** o `templateDetail` do web (`ev_13ad78da…`) e o bundle Lynx `image_lynx_main_template`
usam o mesmo schema: `templateId`, `title`, `desc`, `coverUrl`, `videoUrl`, `videoRatio`,
`videoWidth`/`videoHeight`, `playAmount`, `usageAmount`, `segmentAmount`, `likeAmount`,
`commentAmount`, `templateDuration` (**ms**), `createTime` (**epoch em segundos**), `collections[]`,
`author{uid,secUid,name,avatarUrl,profileUrl}`.

**Decisão:** manter os nomes e as unidades originais. Isso evita bugs de conversão e deixa o mapeamento
1:1 com a API real.

| Arquivo | Papel |
| --- | --- |
| `src/lib/types.ts` | `Template`, `Collection`, `Author`, `FeedPage`, `SessionUser`, `ExportTask` |
| `src/lib/mock-data.ts` | 16 fixtures com ids, contadores e durações plausíveis |
| `src/lib/format.ts` | `formatCount` (K/M/B), `formatDuration` (ms→`m:ss`), `formatRelativeTime` (epoch) |

Detalhe de fidelidade: o feed real usa **cursor opaco** + `has_more`, não `page`/`offset`. O mock
devolve um cursor string e o hook só avança enquanto `hasMore` for verdadeiro.

---

## 2. Feed e coleções

**Achado:** as coleções observadas no web e nos canais Lynx são `10001` (For You), `70003`
(Following), `10003` (TikTok), `10002` (Effects), `10006` (Celebrate) e `10012` (Fandom). O feed é
paginado por `POST /lv/v2/replicate/get_collection_templates` com `{ collection_id, cursor, count }`.

**Decisão:** expor as mesmas 6 coleções como chips no topo do feed, com paginação por cursor e
pull-to-refresh.

| Arquivo | Papel |
| --- | --- |
| `src/lib/mock-data.ts` | `COLLECTIONS` com os 6 ids reais; `CATEGORIES` do hub `/template/*` |
| `src/lib/api.ts` | `getFeed()` → `ENDPOINTS.collectionTemplates`, `PAGE_SIZE = 6` |
| `src/lib/use-feed.ts` | estado de cursor, `loadMore`, `refresh`, proteção contra resposta fora de ordem |
| `src/app/(tabs)/index.tsx` | grade 2 colunas + `onEndReached` |
| `src/app/(tabs)/templates.tsx` | busca + filtro por categoria/coleção |
| `src/components/template-card.tsx` | variantes `grid`, `rail` e `row` |

A proteção contra corrida em `use-feed.ts` (`requestId` + `busy`) existe porque trocar de coleção
enquanto uma página está em voo é o caso mais comum de feed "embaralhado".

---

## 3. Sessão visitante primeiro

**Achado:** o produto permite usar sem conta. O fluxo é
`POST /passport/user/device_login/` (cria device id + conta visitante) e, depois,
`POST /passport/user/bind_visitor_account/` promove o visitante a membro. O BFF web confirma que
anônimo recebe `ret: 1015` / `check login error` (`ev_ab264e5b…`), ou seja: **há superfície pública,
mas os dados de usuário exigem sessão**.

**Decisão:** implementar o mesmo estado de dois níveis (`guest` / `member`) com persistência local.
O gate de conta aparece no CTA do template e no editor, exatamente onde o produto original converte.

| Arquivo | Papel |
| --- | --- |
| `src/lib/session.tsx` | `SessionProvider`, `continueAsGuest` (device_login), `signIn` (bind_visitor_account), `signOut` |
| `src/lib/session.tsx` | storage: `expo-secure-store` no device, `localStorage` no web |
| `src/app/(tabs)/create.tsx` | banner de visitante + sheet "Entrar para exportar" |
| `src/app/template/[id].tsx` | `useTemplate()`: sem sessão → visitante → gate |
| `src/app/(tabs)/profile.tsx` | estados sem sessão / visitante / membro |

**Limite explícito:** `signIn()` é uma simulação local. Nenhuma credencial é enviada, nenhum token é
forjado e nenhum endpoint autenticado é chamado.

---

## 4. Export assíncrono

**Achado:** o APK usa uma fila de tarefas genérica:
`/lv/v1/common_task/{new,query,sync,process,cancel}`. O render não é síncrono — o cliente cria a
tarefa, recebe um `task_id` e faz polling de estado/progresso.

**Decisão:** reproduzir o contrato com uma `Map` em memória. `submitExportTask` devolve `queued` com
progresso 0; `queryExportTask` avança em passos até `success`. O editor faz polling a cada 550 ms e
para no estado terminal.

| Arquivo | Papel |
| --- | --- |
| `src/lib/api.ts` | `submitExportTask`, `queryExportTask`, `taskStore`, `ExportTask` |
| `src/app/editor/[id].tsx` | `startExport`, `setInterval` + cleanup, barra de progresso, `task_id` |
| `src/components/bottom-sheet.tsx` | sheet de export com estados `queued`/`processing`/`success` |

O mock **não** gera vídeo: `resultUrl` é apenas um placeholder. Render real exigiria um pipeline
nativo (FFmpeg/MediaCodec), fora do escopo.

---

## 5. UI, navegação e deep links

**Achado:** o app Android é um shell nativo (`com.vega.launcher.ScaffoldApplication`,
`com.vega.main.MainActivity`) que hospeda 47 canais Lynx offline; a navegação entre telas é feita por
`capcut://lynxview?channel=<image_lynx_*>&bundle=template.js&dynamic=3`. O web é SSR com Modern.js e
PWA (`start_url=/my-edit?is_pwa=1`, `ev_2f8dbe6f…`). O acento do CTA no web é `#00cae0`.

**Decisão:** trocar Lynx por React Native + expo-router, mas manter a **mesma topologia de telas** e o
mesmo acento. Onde o original usa canal Lynx, o app usa rota tipada.

| Achado | Implementação |
| --- | --- |
| Shell + navegação por canal | `src/app/_layout.tsx` (Stack) + `src/app/(tabs)/_layout.tsx` (4 abas) |
| Feed (`image_lynx_discover`) | `src/app/(tabs)/index.tsx` |
| Portal de templates (`image_lynx_template_portal`) | `src/app/(tabs)/templates.tsx` |
| Detalhe do template | `src/app/template/[id].tsx` |
| Editor | `src/app/editor/[id].tsx` |
| Perfil (`image_lynx_profile_home`) | `src/app/(tabs)/profile.tsx` |
| Deep link `capcut://…` | scheme `clipflow://` em `app.json` + rotas `template/[id]`, `editor/[id]` |
| Acento `#00cae0` | `palette.accent` em `src/constants/theme.ts` |
| Tema escuro do PWA (`#121217`) | `palette.bg = #0B0B0F` (ajustado para contraste) |

Deep links suportados:

```
clipflow://template/<templateId>
clipflow://editor/<templateId>
```

O `+not-found.tsx` lista os schemes válidos quando a rota não existe.

---

## 6. Camada de rede

**Achado:** o backend responde **HTTP 200 com `ret` de erro no corpo** (ex.: `1015`). Erros de
negócio não vêm como status HTTP.

**Decisão:** o cliente checa `response.ok` **e** `body.ret !== "0"`, lançando `ApiError` com o `ret`
original. A UI mostra a mensagem e oferece retry.

| Arquivo | Papel |
| --- | --- |
| `src/lib/api.ts` | `remote<T>()`, `ApiError`, `apiMode` (`mock` \| `remote`) |
| `src/lib/api.ts` | `ENDPOINTS` com os caminhos reais |
| `README.md` §4 | como ativar o modo remoto com `EXPO_PUBLIC_API_BASE_URL` |

O modo remoto está implementado mas **não habilitado por padrão**: sem um backend autorizado ele só
devolveria `1015`.

---

## 7. Decisões de escopo

| Área | Por que ficou fora |
| --- | --- |
| Login/OAuth real | Exigiria credenciais e fluxo de terceiros; fora do escopo ético definido |
| Paywall / assinatura / anúncios | 15 dos 47 canais Lynx são monetização; reproduzir seria contornar receita |
| Extração de assets/efeitos | Conteúdo proprietário; o app usa mídia pública de exemplo |
| Render de vídeo | Precisa de stack nativa pesada; a fila foi simulada |
| Endpoints autenticados | Não mapeáveis sem sessão, e não devem ser acessados |

---

## 8. Verificação

```bash
npm run typecheck                                  # tsc --noEmit
npx expo export --platform android --output-dir dist
npx expo export --platform web --output-dir dist-web
npm run start:lan                                  # QR para Expo Go
```

Resultados obtidos: TypeScript limpo; bundle Hermes Android (~4,6 MB) e web com code-splitting
gerados; Metro respondendo `packager-status:running` e servindo o bundle Android de desenvolvimento
(HTTP 200).
