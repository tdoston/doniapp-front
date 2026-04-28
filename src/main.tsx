import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initTelegramMiniApp } from "./lib/telegramWebApp";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

initTelegramMiniApp();
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);

const loader = document.getElementById("page-loader");
if (loader) setTimeout(() => loader.classList.add("done"), 300);
