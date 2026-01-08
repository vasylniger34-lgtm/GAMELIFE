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

// Блокування масштабування на мобільних пристроях (iOS / Android)
// Працює тільки на мобільних, не впливає на десктоп
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Перевірка, чи сайт відкритий як PWA / fullscreen
const isStandalone = (): boolean => {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
};

// Функція для оновлення viewport meta тега
const updateViewport = (): void => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover"
    );
  }
};

if (isMobileDevice()) {
  let lastTouchEnd = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  const DOUBLE_TAP_DELAY = 300;
  const DOUBLE_TAP_DISTANCE = 10;

  // Оновлюємо viewport при завантаженні
  updateViewport();

  // Збереження координат початку дотику
  document.addEventListener("touchstart", (event: TouchEvent) => {
    if (event.touches.length === 1) {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    } else if (event.touches.length > 1) {
      // Блокуємо pinch-zoom одразу при появі другого дотику
      event.preventDefault();
    }
  }, { passive: false });

  // Блокування double-tap zoom через touchend з таймером (standard iOS workaround)
  document.addEventListener("touchend", (event: TouchEvent) => {
    const now = Date.now();
    const touch = event.changedTouches[0];
    
    if (!touch) return;
    
    // Перевірка на double-tap (час + координати)
    const timeSinceLastTouch = now - lastTouchEnd;
    const distanceX = Math.abs(touch.clientX - touchStartX);
    const distanceY = Math.abs(touch.clientY - touchStartY);
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (
      timeSinceLastTouch < DOUBLE_TAP_DELAY &&
      totalDistance < DOUBLE_TAP_DISTANCE
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    lastTouchEnd = now;
  }, { passive: false });

  // iOS Safari gesture events (працює в fullscreen/PWA режимі)
  // Блокування pinch-zoom та інших жестів
  // Ці події ігноруються Safari в fullscreen-режимі без preventDefault
  document.addEventListener("gesturestart", (event: Event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("gesturechange", (event: Event) => {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener("gestureend", (event: Event) => {
    event.preventDefault();
  }, { passive: false });

  // Додаткове блокування для iOS Safari в fullscreen
  // Перехоплення touchmove з множинними дотиками (pinch)
  document.addEventListener("touchmove", (event: TouchEvent) => {
    // Якщо більше одного дотику - це pinch gesture
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });

  // Запобігання зміні масштабу при орієнтації
  window.addEventListener("orientationchange", () => {
    // Невелика затримка для того, щоб браузер встиг обробити зміну орієнтації
    setTimeout(() => {
      updateViewport();
      // Додатково скидаємо масштаб через body
      document.body.style.zoom = "1";
    }, 100);
  });

  // Додаткова перевірка при зміні розміру вікна (для PWA)
  window.addEventListener("resize", () => {
    updateViewport();
  });

  // Запобігання зміні масштабу при фокусі (iOS Safari workaround)
  window.addEventListener("focus", () => {
    updateViewport();
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

