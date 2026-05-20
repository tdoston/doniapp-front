#!/usr/bin/env bash
# To'liq Railway deploy: doniapp-back + doniapp-front GitHub push
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACK_REPO="${DONIAPP_BACK_REPO:-https://github.com/tdoston/doniapp-back.git}"
FRONT_REPO="${DONIAPP_FRONT_REPO:-https://github.com/tdoston/doniapp-front.git}"
TMP="${TMPDIR:-/tmp}/swift-railway-deploy-$$"
mkdir -p "$TMP"

echo "==> Clone doniapp-back"
git clone --depth 1 "$BACK_REPO" "$TMP/back"
rsync -a --exclude '.git' --exclude '.venv' --exclude '.env' --exclude '.env.*' \
  --exclude 'staticfiles' --exclude 'data' --exclude '__pycache__' \
  "$ROOT/django_backend/" "$TMP/back/"
chmod +x "$TMP/back/scripts/railway.sh"
cd "$TMP/back"
git add -A
if git diff --cached --quiet; then
  echo "    doniapp-back: o'zgarish yo'q"
else
  git commit -m "Deploy sync from swift-bookings $(date +%Y-%m-%d)"
  git push origin main
  echo "    doniapp-back: push OK"
fi

echo "==> Clone doniapp-front"
git clone --depth 1 "$FRONT_REPO" "$TMP/front"
rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'dist' \
  --exclude '.env' --exclude '.env.local' \
  "$ROOT/" "$TMP/front/" \
  --exclude 'django_backend' --exclude 'notes' --exclude '.cursor'
cp "$ROOT/.env.production" "$TMP/front/" 2>/dev/null || true
cp "$ROOT/railway.toml" "$TMP/front/" 2>/dev/null || true
cd "$TMP/front"
git add -A
if git diff --cached --quiet; then
  echo "    doniapp-front: o'zgarish yo'q"
else
  git commit -m "Deploy sync from swift-bookings $(date +%Y-%m-%d)"
  git push origin main
  echo "    doniapp-front: push OK"
fi

rm -rf "$TMP"
echo ""
echo "==> GitHub push tugadi. Railway Dashboard:"
echo "    1) Postgres → Restart"
echo "    2) doniapp-back → Redeploy (Root: /)"
echo "    3) doniapp-front → Redeploy (Root: /)"
echo "    4) Tekshiruv: curl https://doniapp-back-production.up.railway.app/api/health"
echo ""
echo "    CLI: cd django_backend && railway login && railway redeploy"
