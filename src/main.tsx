import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initTelegramMiniApp } from "./lib/telegramWebApp";
import { registerSW } from "virtual:pwa-register";
import { UiLanguageProvider } from "./lib/ui-language";
import "./index.css";

initTelegramMiniApp();

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    void registration?.update();
  },
});
void updateSW;

createRoot(document.getElementById("root")!).render(
  <UiLanguageProvider>
    <App />
  </UiLanguageProvider>
);
