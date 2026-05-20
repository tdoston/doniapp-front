# Railway — to'liq deploy

## Servislar

| Servis | GitHub repo | Root Directory | URL |
|--------|-------------|----------------|-----|
| **doniapp-back** | `tdoston/doniapp-back` | `/` (manage.py ildizda) | https://doniapp-back-production.up.railway.app |
| **doniapp-front** | `tdoston/doniapp-front` | `/` | https://doniapp-front-production.up.railway.app |
| **Postgres** | plugin | — | `DATABASE_URL` → backend |

Monorepo `tdoston/swift-bookings` ham yangilangan (`django_backend/` + `.env.production`). Railway **Source** qaysi repoga ulangan bo‘lsa, shu repodan deploy qiladi.

## Bir buyruqda GitHub push (ikkala prod repo)

```bash
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

## Railway Dashboard (har safar to'liq deploy)

1. **Postgres** → **Restart** (Crashed bo‘lsa)
2. **doniapp-back** → Settings:
   - Source: `tdoston/doniapp-back`, branch `main`, Root `/`
   - Variables: `DATABASE_URL` (reference), `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_NOTIFY_CHAT_ID=-1003942993894`
3. **doniapp-back** → **Deploy** / Redeploy
4. **doniapp-front** → Settings:
   - Source: `tdoston/doniapp-front`, branch `main`, Root `/`
   - Build: `npm ci && npm run build` (yoki `.env.production` commitdan)
5. **doniapp-front** → **Redeploy**
6. BotFather `/setdomain` → `doniapp-front-production.up.railway.app`

## Backend start (lokal bilan bir xil)

`scripts/railway.sh start`: `bootstrap_postgres_schema` → `migrate` → `seed_initial_db` → `gunicorn`

## Tekshiruv

```bash
curl -sS https://doniapp-back-production.up.railway.app/api/health
# {"ok":true,"db":true,...}

curl -sS -X POST https://doniapp-back-production.up.railway.app/api/auth/password-login \
  -H 'Content-Type: application/json' -d '{"login":"x","password":"y"}'
# 400 — auth ishlayapti
```

## CLI (ixtiyoriy)

```bash
cd django_backend && railway login
railway link   # project: humorous-simplicity
railway redeploy -s doniapp-back
railway logs -s doniapp-back --lines 100
```
