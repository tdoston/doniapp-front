# Railway Deploy (Frontend + Backend alohida)

This repo should be deployed as **two Railway services** from the same GitHub repository.

## 1) Backend service (Django API)

- **Service name:** `backend`
- **Root Directory:** `django_backend`
- **Builder:** Nixpacks (auto)
- Uses: `django_backend/nixpacks.toml`
  - Install: `pip install -r requirements.txt`
  - Build: `python manage.py migrate --noinput`
  - Start: `gunicorn swiftbookings.wsgi:application --bind 0.0.0.0:$PORT ...`

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

## Important

- Railway `one service = one deployment` ishlaydi.
- Frontend va backendni alohida service sifatida deploy qiling.
- Rootdagi eski monolit Docker ishlatilmaydi; bu repo Nixpacks bilan 2-service oqimga moslangan.
- After first successful deploy, test:
  - `https://<backend-domain>/api/health`
  - Frontend app loads and API calls succeed.
