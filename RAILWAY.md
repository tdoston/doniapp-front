# Railway Deploy (Frontend + Backend alohida)

This repo should be deployed as **two Railway services** from the same GitHub repository.

## 1) Backend service (Django API)

- **Service name:** `backend`
- **Root Directory:** `django_backend`
- **Builder:** Nixpacks (auto)
- Uses: `django_backend/nixpacks.toml`
  - Install: `pip install -r requirements.txt`
  - Build (har deploy, **staging/production** uchun bir xil):
    1. `DATABASE_URL` borligini tekshiradi (Postgres plugin backend bilan bog‘langan bo‘lishi kerak).
    2. `psql … -f sql/postgres_bootstrap.sql` — biznes jadvallar (`managed=False` bo‘lgani uchun `migrate` ularni yaratmaydi).
    3. `python manage.py migrate --noinput` — shu yerda **`api.0008`** (`rooms.inactive`, `cancel_reason_options`) va boshqa migratsiyalar qo‘llanadi.
    4. `python manage.py seed_initial_db` — **faqat migrate dan keyin**: seed `rooms.inactive` ustuniga yozadi; 0008 dan oldin ishlatilsa xato bo‘lishi mumkin.
  - Start: `bootstrap_postgres_schema` → **`migrate --noinput`** → **`seed_initial_db`** → `gunicorn` (xuddi shu tartib).
  - Katalog API (DRF): `GET /api/catalog/hostels`, `GET /api/catalog/rooms?hostel=Vodnik`, `GET /api/catalog/cancel-reasons?scope=booking_checkin|bron_board`.

### Git push → auto deploy

Railway har `main` pushda build qiladi: yuqoridagi **build** bosqichida migratsiya va seed avtomatik ishlaydi. Qo‘lda faqat maxsus holatda:

- **Bitta marta qayta seed:** avval migratsiya bo‘lganini tekshirib, keyin:  
  `python manage.py migrate --noinput && python manage.py seed_initial_db`
- **Faqat DDL + migratsiya (seed siz):**  
  `python manage.py bootstrap_postgres_schema && python manage.py migrate --noinput`

Agar Postgresni keyinroq ulasangiz, birinchi muvaffaqiyatli deploydan keyin **Redeploy** qiling — build qayta `psql` + `migrate` + `seed` ni ishga tushiradi.

### Backend environment variables

- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY=<strong-random-secret>`
- `DJANGO_ALLOWED_HOSTS=*.up.railway.app,<your-custom-domain>`
- Optional CORS/CSRF:
  - `CORS_EXTRA_ORIGINS=https://<frontend-domain>`
  - `CSRF_TRUSTED_EXTRA=https://<frontend-domain>`
- Optional DB:
  - `DATABASE_URL=<Railway Postgres URL>`

## 2) Frontend service (Vite)

- **Service name:** `frontend`
- **Root Directory:** `/` (repo root)
- **Builder:** Nixpacks (auto)
- Uses: root `nixpacks.toml`
  - Install: `npm ci`
  - Build: `npm run build`
  - Start: `npm run start:railway`

### Frontend environment variables

- `VITE_API_BASE=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api`
  - If Railway UI doesn't resolve this expression automatically in your project, paste explicit backend URL.

## HTTP 500 / «Internal Server Error»

- **Avval deploy log** (Railway → backend → Deployments → build yoki deploy log).
- Ko‘pincha: migratsiya qo‘llanmagan (`cancel_reason_options` yoki `rooms.inactive` yo‘q) — **Run command:**  
  `python manage.py migrate --noinput && python manage.py seed_initial_db`  
  keyin **Redeploy**.
- Yangi javob: sxema xatosi bo‘lsa API ba’zan **503** + `code: db_schema_mismatch` (HTML 500 o‘rniga).

## Taxta: «Maʼlumotlar bazasiga ulanib boʼlmadi»

Frontend bu matnni **faqat** API `503` va `code: db_unavailable` da ko‘rsatadi (Django Postgres `OperationalError`). Boshqa xatolarda («Serverga ulanib bo‘lmadi») odatda **noto‘g‘ri `VITE_API_BASE`**, CORS yoki tarmoq.

- **Backend → Postgres:** Postgres servisini backend bilan bog‘lang, `DATABASE_URL` backend variablesda bo‘lsin. TCP proxy / public URL da `sslmode=require` bo‘lmasa, `POSTGRES_SSLMODE=require` qo‘ying.
- **Frontend → Backend:** `VITE_API_BASE=https://<backend>.up.railway.app/api` (oxirida `/api`).

## Important

- Railway `one service = one deployment` ishlaydi.
- Frontend va backendni alohida service sifatida deploy qiling.
- Rootdagi eski monolit Docker ishlatilmaydi; bu repo Nixpacks bilan 2-service oqimga moslangan.
- After first successful deploy, test:
  - `https://<backend-domain>/api/health`
  - Frontend app loads and API calls succeed.
