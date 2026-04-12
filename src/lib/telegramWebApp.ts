/**
 * Telegram Mini App: rasmiy skript `window.Telegram.WebApp` ni ishga tushiradi.
 * Bot token bu yerga kiritilmaydi (faqat server / BotFather).
 */
export function isTelegramWebApp(): boolean {
  return Boolean(typeof window !== "undefined" && window.Telegram?.WebApp);
}

export function initTelegramMiniApp(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();

  const bg = tg.themeParams.bg_color;
  const sec = tg.themeParams.secondary_bg_color;
  if (sec) {
    try {
      tg.setHeaderColor(sec);
    } catch {
      /* eski WebApp versiyalari */
    }
  }
  if (bg) {
    try {
      tg.setBackgroundColor(bg);
    } catch {
      /* */
    }
  }

  const root = document.documentElement;
  if (tg.colorScheme === "dark") {
    root.classList.add("telegram-dark");
  } else {
    root.classList.remove("telegram-dark");
  }

  document.body.classList.add("tg-mini-app");
}
