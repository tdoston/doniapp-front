# Railway — to'liq deploy (front + back + DB)

## 1. Postgres

1. Railway project → **New** → **Database** → **PostgreSQL**
2. Postgres → **doniapp-back** → **Connect** / **Add Variable Reference**
3. Backend Variables da paydo bo'ladi: **`DATABASE_URL`** (`postgres.railway.internal:5432/...`)

## 2. doniapp-back

| Sozlama | Qiymat |
|---------|--------|
| Source | `tdoston/doniapp-back`, branch `main`, Root **`/`** |
| Build | `bash scripts/railway.sh build` → collectstatic |
| Pre-deploy / Release | `bash scripts/railway.sh release` → bootstrap + migrate + seed |
| Start | `bash scripts/railway.sh start` → migrate + gunicorn |

**Variables:** `django_backend/railway.env.example` dan nusxa oling.

## 3. doniapp-front

| Sozlama | Qiymat |
|---------|--------|
| Source | `tdoston/doniapp-front`, branch `main`, Root **`/`** |
| Build | `rm -rf dist && npm ci && npm run build` |
| Start | `npm run start:railway` |

**Variables:** `railway.env.example` yoki `.env.production` (commitda).

BotFather: `/setdomain` → `doniapp-front-production.up.railway.app`

## 4. Deploy tartibi

1. `./scripts/push-all-repos.sh` — GitHub ga push
2. Postgres **Restart** (agar Crashed)
3. **doniapp-back** → Deploy (release DB, keyin start)
4. **doniapp-front** → Deploy
5. Tekshiruv:

```bash
curl -sS https://doniapp-back-production.up.railway.app/api/health
# {"ok":true,"db":true,"ready":true}

curl -sI https://doniapp-front-production.up.railway.app/ | head -3
# HTTP/2 200
```

Brauzer: inkognito yoki Service Worker unregister (PWA cache).

## 5. CLI

```bash
cd django_backend && railway login && railway link
railway redeploy -s doniapp-back
railway redeploy -s doniapp-front
railway logs -s doniapp-back --lines 80
```
