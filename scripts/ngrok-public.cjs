/**
 * Vite dev-serverni ngrok orqali HTTPS ga chiqaradi.
 * Muhit: NGROK_AUTHTOKEN (https://dashboard.ngrok.com/get-started/your-authtoken)
 * Ixtiyoriy: TUNNEL_PORT (default 8080)
 */

const path = require("path");
const fs = require("fs");

function loadEnvFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* fayl yo'q */
  }
}

const root = path.resolve(__dirname, "..");
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, "django_backend", ".env"));

const ngrok = require("ngrok");

const port = parseInt(process.env.TUNNEL_PORT || "8080", 10);
const authtoken = (process.env.NGROK_AUTHTOKEN || "").trim();

async function main() {
  if (!authtoken) {
    console.error("NGROK_AUTHTOKEN topilmadi.");
    console.error("  1) https://dashboard.ngrok.com/get-started/your-authtoken — tokenni oling");
    console.error("  2) export NGROK_AUTHTOKEN='...' yoki loyiha ildizi / django_backend/.env ga qo'shing");
    console.error("  3) Muqobil: npm run public:tunnel:cf (Cloudflare)");
    process.exit(1);
  }

  const url = await ngrok.connect({ addr: port, authtoken });
  console.log("\n  Public URL (ngrok):", url, "\n");

  process.on("SIGINT", async () => {
    try {
      await ngrok.disconnect();
      await ngrok.kill();
    } catch {
      /* */
    }
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
