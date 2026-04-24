# DoniHostel (swift-bookings)

- **Backend:** `django_backend/` — REST `/api/*`, SQLite: `django_backend/data/swift_bookings.sqlite`, `npm run db:reset` → `seed_demo_sqlite`.
- **Frontend:** Vite + React; **filial va xona katalogi** `GET /api/catalog/hostels`, `GET /api/catalog/rooms?hostel=…`; **bron/mehmon/statistika** DBdan.
- **Dev:** `npm run dev:stack` (Vite + Django `:3001`).

### Telegram Mini App

- `index.html` da `telegram-web-app.js`; `src/lib/telegramWebApp.ts` — `ready()` + `expand()`.
- **HTTPS** domen kerak (BotFather → bot → *Menu Button* / *Web App* URL).
- **Bot token** faqat muhitda: `django_backend/.env` yoki `export TELEGRAM_BOT_TOKEN='...'` + `npm run telegram:verify` (gitga token yozmang).
- Prod: `CORS_EXTRA_ORIGINS` va `CSRF_TRUSTED_EXTRA` ga Mini App domeningizni qo‘shing (`.env.example`).

### Vaqtinchalik ochiq havola (HTTPS tunnel)

**Asosiy (bepul, akkaunt shart emas):** Cloudflare Quick Tunnel — `npm run public:tunnel` (yoki `public:tunnel:cf`). Terminalda `https://....trycloudflare.com` chiqadi.

1. Bir terminal: `npm run dev:stack` (Vite **8080**; `/api` → Django **3001**).
2. Ikkinchi terminal: `npm run public:tunnel`.
3. Boshqa Vite porti: `TUNNEL_PORT=8081 npm run public:tunnel`.

**Boshqa bepul variantlar:** `npm run public:tunnel:lt` — [localtunnel](https://localtunnel.github.io/www/) (ba’zan birinchi ochilishda qo‘shimcha sahifa). `npm run public:tunnel:ngrok` — ngrok ([authtoken](https://dashboard.ngrok.com/get-started/your-authtoken) kerak).
