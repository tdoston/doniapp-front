#!/usr/bin/env bash
# To'liq: swift-bookings commit+push, keyin doniapp-back va doniapp-front
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACK_REPO="${DONIAPP_BACK_REPO:-https://github.com/tdoston/doniapp-back.git}"
FRONT_REPO="${DONIAPP_FRONT_REPO:-https://github.com/tdoston/doniapp-front.git}"
LOG="$ROOT/push-all-repos.log"
exec > >(tee -a "$LOG") 2>&1

echo "=== $(date -Iseconds) push-all-repos ==="

cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git reset HEAD notes 2>/dev/null || true
  git commit -m "$(cat <<EOF
Sync full codebase for prod deploy (back + front).

PWA cache bust, Railway build scripts, API base, Telegram channel, UI updates.
EOF
)"
else
  echo "swift-bookings: working tree clean"
fi
git push origin main
echo "swift-bookings: $(git log -1 --oneline)"

SHORT="$(git rev-parse --short HEAD)"
TMP="${TMPDIR:-/tmp}/swift-push-all-$$"
mkdir -p "$TMP"

echo "==> doniapp-back"
rm -rf "$TMP/back"
git clone "$BACK_REPO" "$TMP/back"
rsync -a --delete --exclude '.git' --exclude '.venv' --exclude '.env' --exclude '.env.*' \
  --exclude 'staticfiles' --exclude 'data' --exclude '__pycache__' --exclude '*.pyc' \
  "$ROOT/django_backend/" "$TMP/back/"
chmod +x "$TMP/back/scripts/"*.sh 2>/dev/null || true
cd "$TMP/back"
git add -A
git commit -m "Full sync from swift-bookings @ ${SHORT}" || echo "back: nothing to commit"
git push origin main
echo "doniapp-back: $(git log -1 --oneline)"

echo "==> doniapp-front"
rm -rf "$TMP/front"
git clone "$FRONT_REPO" "$TMP/front"
rsync -a --delete \
  --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude 'dev-dist' \
  --exclude '.env' --exclude '.env.local' --exclude '.env.*' \
  --exclude 'django_backend' --exclude 'notes' --exclude '.cursor' \
  --exclude 'push-all-repos.log' \
  "$ROOT/" "$TMP/front/"
# .env.production commit qilinadi
test -f "$ROOT/.env.production" && cp "$ROOT/.env.production" "$TMP/front/"
grep -q '!.env.production' "$TMP/front/.gitignore" 2>/dev/null || echo '!.env.production' >> "$TMP/front/.gitignore"
cd "$TMP/front"
git add -A
git commit -m "Full sync from swift-bookings @ ${SHORT}" || echo "front: nothing to commit"
git push origin main
echo "doniapp-front: $(git log -1 --oneline)"

rm -rf "$TMP"
echo "=== TAYYOR ==="
