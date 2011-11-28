#!/usr/bin/env bash
echo "Adding locale files..."
LOCALES="$(dirname $0)/src/chrome/locale"

for locale in `ls $LOCALES`; do
  echo "Adding files for $locale..."
  svn add $LOCALES/$locale 2> /dev/null
  svn add $LOCALES/$locale/* 2> /dev/null
done
