#!/usr/bin/env bash
echo "Copying locale files..."
LOCALES_SRC="$1"
LOCALES_DEST="$(dirname $0)/src/chrome/locale/xpi"

echo "Destination: $LOCALES_DEST"
for locale in `ls $LOCALES_SRC`; do
  echo "Copying file for $locale..."
  mkdir -p $LOCALES_DEST/$locale/
  cp -r $LOCALES_SRC/$locale/* $LOCALES_DEST/$locale/
  svn add $LOCALES_DEST/$locale 2> /dev/null
  svn add $LOCALES_DEST/$locale/* 2> /dev/null
done
