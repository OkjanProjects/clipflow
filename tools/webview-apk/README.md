# WebView APK builder

Empacota o build web do ClipFlow num `.apk` instalável usando só `aapt2`, `d8` e `apksigner`.
Sem Gradle, sem NDK, sem Android Studio.

```bash
# na raiz do projeto
npx expo export --platform web --output-dir dist-web
./tools/webview-apk/build-apk.sh dist-web
# → tools/webview-apk/build/ClipFlow.apk
```

Variáveis úteis:

| Variável | Para que serve |
| --- | --- |
| `ANDROID_HOME` | local do SDK (detecta `build-tools` e `platforms`) |
| `ANDROID_JAR` | caminho direto do `android.jar` |

Como funciona:

1. `dist-web/` é copiado para `assets/web/` dentro do APK.
2. `MainActivity` carrega `https://appassets.androidplatform.net/` e intercepta as requisições,
   servindo os arquivos de `assets/web/` — nada sai para a rede.
3. Rotas do expo-router que não existem como arquivo caem no `index.html` (fallback de SPA).
4. O APK é assinado com uma keystore de debug gerada na primeira execução.

Limite: é o app **web** numa WebView. Mesma interface e mesmas telas, sem módulos nativos
(câmera, galeria, notificações).
