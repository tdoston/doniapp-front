#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="${TMPDIR:-/tmp}/doniapp-front-push-$$"
git clone --depth 1 https://github.com/tdoston/doniapp-front.git "$TMP"
rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude 'dev-dist' \
  --exclude '.env' --exclude 'django_backend' --exclude 'notes' --exclude '.cursor' \
  "$ROOT/" "$TMP/"
cd "$TMP"
git add -A
git diff --cached --quiet && echo "No changes" && exit 0
git commit -m "Force fresh prod build: rm dist, PWA skipWaiting, SW update."
git push origin main
echo "Pushed: $(git log -1 --oneline)"
