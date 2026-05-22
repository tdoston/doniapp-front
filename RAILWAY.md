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

## doniapp-back: 502 / Deploy failed (Postgres o‘chiq bo‘lsa)

Backend logida ko‘pincha **catatonit emas**, balki:

- `[railway] XATO: Postgres ulanmadi` — **release** (pre-deploy) yiqiladi
- yoki deploy o‘tadi, lekin API **502** — Postgres ishlamayapti

**Sabab:** `doniapp-back` Postgres ga bog‘liq; DB **Crashed** bo‘lsa back ham to‘liq ishlamaydi.

**Tartib:** avval Postgres ni tuzating (quyidagi bo‘lim), keyin **doniapp-back** → Redeploy.

Tekshiruv: `curl .../api/health` → kamida HTTP 200; Postgres tiklangach `"db":true`.

## Postgres: `catatonit: failed to exec pid1`

Bu **sizning SQL yoki deploy skriptingiz emas** — Railway managed Postgres konteyneri ishga tushmayapti (ko‘pincha **19–20 may** platforma incidentidan keyin image buzilgan).

Logda volume mount muvaffaqiyatli, keyin darhol:
`ERROR (catatonit:2): failed to exec pid1: No such file or directory`

### Tuzatish (tartibda)

1. **Redeploy source image** (oddiy Redeploy yetmaydi):
   - Postgres servisi → **Cmd+K** (yoki Ctrl+K) → **Redeploy source image**
   - Bu `ghcr.io/railwayapp-templates/postgres-ssl` ni qayta yuklaydi; **volume (ma’lumot) o‘chmaydi**
2. 2–3 daqiqa kuting → holat **Active** bo‘lsin
3. **doniapp-back** → **Redeploy** (DATABASE_URL reference saqlangan bo‘lishi kerak)
4. `curl .../api/health` → `"db":true`

### Agar baribir crash bo‘lsa

- Railway **Help / Discord** — volume saqlab host ko‘chirish so‘rang ([misol](https://station.railway.com/questions/postgres-service-stuck-in-crash-loop-aft-2de1a769))
- Yoki **yangi Postgres** servisi yarating (yangi volume), backup bo‘lsa restore qiling — **eski buzilgan Postgres servisini o‘chirmang** avval backup/export qiling
- Yangi loyihada: avval **yangi Postgres** qo‘ying, keyin back/front ulang

## 5. CLI

```bash
cd django_backend && railway login && railway link
railway redeploy -s doniapp-back
railway redeploy -s doniapp-front
railway logs -s doniapp-back --lines 80
```
