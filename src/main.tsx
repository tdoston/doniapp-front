import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initTelegramMiniApp } from "./lib/telegramWebApp";
import "./index.css";

initTelegramMiniApp();
createRoot(document.getElementById("root")!).render(<App />);
