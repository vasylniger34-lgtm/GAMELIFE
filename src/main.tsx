import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

// Реєстрація service worker для PWA (офлайн, оновлення, кеш)
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Можна додати UI‑повідомлення користувачу
    console.log("Доступна нова версія Game Life. Перезавантажте сторінку.");
  },
  onOfflineReady() {
    console.log("Game Life готовий працювати офлайн.");
  }
});


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

