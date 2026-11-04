#!/usr/bin/env bash
set -e
npx expo export --platform web
if [ -d ".expo/web-build" ]; then
  mkdir -p web-build
  cp -r .expo/web-build/* web-build/
fi
echo "Build completo"
