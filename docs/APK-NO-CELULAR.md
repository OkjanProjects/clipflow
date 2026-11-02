# APK sem computador — opções reais

Todas as opções abaixo partem **só dos arquivos do projeto** e podem ser feitas pelo celular.

| Opção | Precisa de | Tempo | Resultado |
| --- | --- | --- | --- |
| A. GitHub Actions | conta GitHub | ~20 min (nuvem) | APK **nativo** (React Native) |
| B. EAS Build | conta Expo | ~15 min (nuvem) | APK **nativo** |
| C. Termux + script | Termux + SDK (~1 GB) | ~2 min | APK **WebView** (mesma UI, roda o build web) |
| D. App "HTML → APK" | app da Play Store | ~2 min | APK **WebView** |
| E. PWA | navegador | ~10 s | atalho instalado (não é APK) |

---

## A. GitHub Actions (recomendada — APK nativo)

O workflow já está em `.github/workflows/android-apk.yml`. Ele roda `expo prebuild` +
`gradlew assembleRelease` no servidor do GitHub e devolve o APK como artifact.

1. Crie um repositório **privado** em `github.com` (pelo navegador do celular).
2. Envie o projeto. Duas formas:
   - **Pelo app GitHub**: crie os arquivos manualmente (trabalhoso), ou
   - **Pelo Termux** (recomendado, ~1 min):
     ```bash
     pkg install git
     cd ~/clipflow
     git init && git add -A && git commit -m "clipflow"
     git remote add origin https://github.com/SEU_USUARIO/clipflow.git
     git push -u origin main
     ```
3. No GitHub, abra **Actions → Android APK → Run workflow**.
4. Ao terminar (~20 min), entre no run e baixe **`clipflow-apk`** (ZIP com o `.apk`).
5. Extraia e toque no `.apk` para instalar (permita "instalar apps desconhecidos").

O APK sai assinado com a debug keystore — instala normalmente, mas não serve para publicar na
Play Store (para isso gere uma keystore própria).

---

## B. EAS Build (nativo, oficial da Expo)

```bash
# no Termux
pkg install nodejs-lts git
npm i -g eas-cli
cd ~/clipflow
eas login                 # conta gratuita expo.dev
eas build -p android --profile preview
```

O perfil `preview` do `eas.json` gera **APK**. No fim, o EAS mostra um link — baixe direto no
celular. Também é possível disparar pelo site `expo.dev` depois de conectar o repositório.

---

## C. Termux + script (APK WebView, offline, 2 minutos)

Este é o caminho **100% local**: empacota o build web (`dist-web/`) num APK com uma WebView, usando
apenas `aapt2`, `d8` e `apksigner`. Sem Gradle, sem NDK, sem nuvem.

### 1. Preparar o Termux

Instale o **Termux pelo F-Droid** (a versão da Play Store está abandonada).

```bash
pkg update && pkg upgrade -y
pkg install -y aapt2 apksigner d8 openjdk-21 zipalign zip unzip
```

### 2. Ter o `android.jar`

O `aapt2` precisa do `android.jar` da plataforma. Duas formas:

```bash
# opção 1: sdkmanager (se você instalou cmdline-tools)
sdkmanager "platforms;android-34" "build-tools;34.0.0"

# opção 2: baixar direto (sem SDK completo)
curl -LO https://dl.google.com/android/repository/platform-34_r03.zip
unzip platform-34_r03.zip
export ANDROID_JAR=$PWD/android-14/android.jar
```

### 3. Gerar o build web e o APK

```bash
cd ~/clipflow
npm ci
npx expo export --platform web --output-dir dist-web
chmod +x tools/webview-apk/build-apk.sh
./tools/webview-apk/build-apk.sh dist-web
```

Saída: `tools/webview-apk/build/ClipFlow.apk` (~2 MB + assets).

```bash
# instalar direto
adb install -r tools/webview-apk/build/ClipFlow.apk
# ou abra o arquivo no gerenciador de arquivos
```

> O script também roda em Linux/Windows(WSL). Ele detecta `aapt2`/`d8`/`apksigner` no
> `build-tools` do `ANDROID_HOME` automaticamente.

### Limites desta opção

- É o **build web** dentro de uma WebView: mesma UI, mesmas telas, mesmo export simulado.
- Não tem os módulos nativos (câmera, galeria, notificações). Para o que este app faz, não faz falta.
- Performance de web, não de React Native nativo.

### C2. Build nativo no Termux (experimental)

Dá para rodar o Gradle completo no celular, mas precisa de NDK (`termux-ndk`, ~2 GB), ~6 GB livres e
bastante RAM. Além disso o `aapt2` do Gradle costuma conflitar com o do Termux:

```bash
echo "android.aapt2FromMavenOverride=$PREFIX/bin/aapt2" >> ~/.gradle/gradle.properties
```

Só vale a pena se você não puder usar a nuvem. Para o dia a dia, use A ou B.

---

## D. Apps "HTML → APK" da Play Store

Apps como *Web2Apk*, *HTML to APK* e similares fazem o mesmo que o script da opção C, com interface
gráfica: você aponta para a pasta `dist-web` e ele gera o APK. Vantagem: zero terminal. Desvantagem:
muitos têm anúncios, pedem permissões demais ou assinam o APK com chave própria. Prefira os de
código aberto e revise o que eles pedem.

---

## E. PWA (nem é APK, mas é o mais rápido)

Com o app publicado em HTTPS (GitHub Pages, Netlify Drop, Vercel):

1. Abra a URL no Chrome do celular.
2. Menu → **Adicionar à tela inicial**.

Fica com ícone, abre em tela cheia e funciona offline depois do primeiro carregamento. Não passa
pela Play Store e não é um `.apk`.

---

## Resumo prático

- Quer o **app nativo** instalado: **A** (GitHub Actions) ou **B** (EAS).
- Quer **agora**, sem conta e sem internet no build: **C** (script deste repo).
- Quer só usar no celular sem instalar nada: **E** ou o **Expo Go** (`npm run start:lan`).
