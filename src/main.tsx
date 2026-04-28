import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initTelegramMiniApp } from "./lib/telegramWebApp";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

initTelegramMiniApp();
registerSW({ immediate: true });

const root = document.getElementById("root")!;
createRoot(root).render(<App />);

const loader = document.getElementById("page-loader");
if (loader) {
  const bar = document.getElementById("page-loader-bar");
  if (bar) bar.style.cssText += "width:100%;transition:width 0.2s ease;";
  setTimeout(() => loader.classList.add("done"), 220);
}
