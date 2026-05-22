#!/usr/bin/env bash
# Railway prod: back + front redeploy (avval: railway login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! railway whoami >/dev/null 2>&1; then
  echo "XATO: railway login kerak"
  exit 1
fi

echo "==> Project"
railway status

echo "==> Redeploy doniapp-back (--from-source)"
railway redeploy -s doniapp-back -y --from-source

echo "==> Redeploy doniapp-front (--from-source)"
railway redeploy -s doniapp-front -y --from-source

echo "==> Kutish (45s)..."
sleep 45

echo "==> Health"
curl -sS "https://doniapp-back-production.up.railway.app/api/health"
echo ""
curl -sS "https://doniapp-front-production.up.railway.app/" | grep -o 'name="build" content="[^"]*"' || echo "(front: build meta topilmadi — deploy hali tugamagan bo'lishi mumkin)"
echo ""
echo "TAYYOR"
