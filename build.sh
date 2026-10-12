#!/usr/bin/env bash
# Собирает курс в один файл: devops-course.html (для артефакта) и index.html (для GitHub Pages)
set -euo pipefail
cd "$(dirname "$0")"
{ cat src/head.html; echo '<script>'; cat src/c1.js src/c2.js src/c3.js src/c4.js src/widgets.js src/app.js; echo '</script>'; } > devops-course.html
{ echo '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'; cat devops-course.html; echo '</body></html>'; } > index.html
echo "ok: $(wc -c < devops-course.html) bytes"
