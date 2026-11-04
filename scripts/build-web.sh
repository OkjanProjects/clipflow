#!/usr/bin/env bash
set -e
echo "Instalando dependências..."
npm ci --silent || npm install --silent
echo "Exportando web..."
npx expo export --platform web || npx expo export:web
echo "Verificando saídas..."
if [ -d "web-build" ]; then
  echo "web-build já existe"
elif [ -d ".expo/web-build" ]; then
  echo "Copiando de .expo/web-build"
  mkdir -p web-build
  cp -r .expo/web-build/* web-build/
elif [ -d "web" ]; then
  echo "Copiando de web/"
  mkdir -p web-build
  cp -r web/* web-build/
else
  echo "Nenhuma saída encontrada. Listando diretórios..."
  find . -maxdepth 2 -type d -name "*web*"
  exit 1
fi
echo "Build completo!"
ls -la web-build/
