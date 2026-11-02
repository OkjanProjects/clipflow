#!/usr/bin/env bash
#
# Gera um APK instalável a partir do build web do ClipFlow, SEM Gradle e SEM NDK.
# Funciona no Termux (celular) e no Linux.
#
# Uso:
#   ./build-apk.sh [pasta-do-build-web]
#
# Pré-requisitos (Termux):
#   pkg install aapt2 apksigner d8 openjdk-21 zipalign zip
#   # e um Android SDK com platform + build-tools, ou use:
#   #   pkg install android-sdk   (quando disponível)
#
# Pré-requisitos (Linux):
#   Android SDK com platforms/android-XX/android.jar e build-tools
#
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="${1:-$HERE/../../dist-web}"
BUILD="$HERE/build"
APP_NAME="ClipFlow"
PKG="com.clipflow.webview"

echo "== ClipFlow · empacotador WebView =="
echo "web dir : $WEB_DIR"

if [ ! -f "$WEB_DIR/index.html" ]; then
  echo "ERRO: $WEB_DIR/index.html não existe."
  echo "Gere antes com:  npx expo export --platform web --output-dir dist-web"
  exit 1
fi

# ---------------------------------------------------------------- SDK / tools
find_tool() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
    return
  fi
  local sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
  local found
  found="$(find "$sdk/build-tools" -maxdepth 2 -name "$name" -type f 2>/dev/null | sort -V | tail -1)"
  [ -n "$found" ] && echo "$found"
}

AAPT2="$(find_tool aapt2)"
APKSIGNER="$(find_tool apksigner)"
ZIPALIGN="$(find_tool zipalign)"
D8="$(find_tool d8)"

for t in AAPT2 APKSIGNER D8; do
  if [ -z "${!t}" ]; then
    echo "ERRO: $t não encontrado. Instale o Android build-tools ou os pacotes do Termux."
    exit 1
  fi
done

if [ -z "$ZIPALIGN" ]; then
  echo "AVISO: zipalign não encontrado; o APK será assinado sem alinhamento (instala normalmente)."
fi

ANDROID_JAR="${ANDROID_JAR:-}"
if [ -z "$ANDROID_JAR" ]; then
  SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
  ANDROID_JAR="$(find "$SDK/platforms" -maxdepth 2 -name android.jar 2>/dev/null | sort -V | tail -1)"
fi
if [ -z "$ANDROID_JAR" ] || [ ! -f "$ANDROID_JAR" ]; then
  echo "ERRO: android.jar não encontrado. Defina ANDROID_JAR=/caminho/android.jar"
  exit 1
fi

echo "aapt2   : $AAPT2"
echo "d8      : $D8"
echo "android : $ANDROID_JAR"

# ---------------------------------------------------------------------- build
rm -rf "$BUILD"
mkdir -p "$BUILD/assets" "$BUILD/gen" "$BUILD/classes" "$BUILD/dex"
cp -a "$HERE/res" "$BUILD/res"
mkdir -p "$BUILD/res/mipmap-xxxhdpi"

echo "-- copiando build web para assets/web"
cp -a "$WEB_DIR/." "$BUILD/assets/web/"

echo "-- ícone"
ICON="$HERE/../../assets/images/icon.png"
if [ -f "$ICON" ]; then
  cp "$ICON" "$BUILD/res/mipmap-xxxhdpi/ic_launcher.png"
else
  # PNG 1x1 transparente como fallback
  printf '\x89PNG\r\n\x1a\n' > "$BUILD/res/mipmap-xxxhdpi/ic_launcher.png"
fi

echo "-- aapt2 compile"
"$AAPT2" compile --dir "$BUILD/res" -o "$BUILD/res.zip"

echo "-- aapt2 link"
"$AAPT2" link \
  -o "$BUILD/base.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$HERE/AndroidManifest.xml" \
  "$BUILD/res.zip" \
  --java "$BUILD/gen" \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  -A "$BUILD/assets"

echo "-- javac"
javac -source 17 -target 17 -nowarn \
  -bootclasspath "$ANDROID_JAR" \
  -classpath "$ANDROID_JAR" \
  -d "$BUILD/classes" \
  "$BUILD/gen/com/clipflow/webview/R.java" \
  "$HERE/java/com/clipflow/webview/MainActivity.java" 2>/dev/null || \
javac -source 8 -target 8 -nowarn \
  -bootclasspath "$ANDROID_JAR" \
  -classpath "$ANDROID_JAR" \
  -d "$BUILD/classes" \
  "$BUILD/gen/com/clipflow/webview/R.java" \
  "$HERE/java/com/clipflow/webview/MainActivity.java"

echo "-- d8"
( cd "$BUILD/classes" && jar cf "$BUILD/classes.jar" . )
"$D8" --release --min-api 24 --lib "$ANDROID_JAR" --output "$BUILD/dex" "$BUILD/classes.jar"

echo "-- empacotando classes.dex"
( cd "$BUILD/dex" && zip -q -j "$BUILD/base.apk" classes.dex )

echo "-- zipalign"
if [ -n "$ZIPALIGN" ]; then
  "$ZIPALIGN" -f 4 "$BUILD/base.apk" "$BUILD/aligned.apk"
else
  cp "$BUILD/base.apk" "$BUILD/aligned.apk"
fi

echo "-- assinatura (keystore de debug)"
KS="$HERE/debug.keystore"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -v \
    -keystore "$KS" \
    -storepass android -keypass android \
    -alias androiddebugkey \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
fi

"$APKSIGNER" sign \
  --ks "$KS" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --ks-key-alias androiddebugkey \
  --out "$BUILD/$APP_NAME.apk" \
  "$BUILD/aligned.apk"

"$APKSIGNER" verify "$BUILD/$APP_NAME.apk" >/dev/null && echo "-- assinatura OK"

echo
echo "APK pronto: $BUILD/$APP_NAME.apk"
ls -lh "$BUILD/$APP_NAME.apk"
echo
echo "Instalar:  adb install -r \"$BUILD/$APP_NAME.apk\""
echo "Ou abra o arquivo no gerenciador de arquivos do celular."
