import { GameLifeState } from "../state/store";

// Конфігурація автозбереження
const AUTOSAVE_INTERVAL_MS = 3 * 60 * 1000; // 3 хвилини за замовчуванням

let autosaveIntervalId: NodeJS.Timeout | null = null;
let lastSaveTime = 0;

// v1.1: Функція для примусового збереження з позначкою часу
export function forceSave(store: GameLifeState): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Zustand persist автоматично зберігає при зміні стану
      // Але ми можемо викликати явне збереження через localStorage
      const stateToSave = {
        currentStats: store.currentStats,
        days: store.days,
        quests: store.quests,
        quickActions: store.quickActions,
        quickActionHistory: store.quickActionHistory, // v1.1
        shopItems: store.shopItems,
        profile: store.profile,
        diamonds: store.diamonds,
        diamondsEarnedTotal: store.diamondsEarnedTotal,
        timeMeta: store.timeMeta,
        purchaseHistory: store.purchaseHistory,
        achievements: store.achievements,
        lastDayStarted: store.lastDayStarted,
        lastSavedAt: new Date().toISOString() // v1.1: Позначаємо час збереження
      };

      // Використовуємо requestIdleCallback для неблокуючого збереження
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        requestIdleCallback(() => {
          try {
            localStorage.setItem("game-life-store", JSON.stringify({
              state: stateToSave,
              version: 4 // v1.1
            }));
            lastSaveTime = Date.now();
            // v1.1: Позначаємо в store
            if (store.markSaved) {
              store.markSaved();
            }
            resolve();
          } catch (error) {
            console.error("Autosave error:", error);
            resolve(); // Не блокуємо, навіть якщо помилка
          }
        });
      } else {
        // Fallback для браузерів без requestIdleCallback
        setTimeout(() => {
          try {
            localStorage.setItem("game-life-store", JSON.stringify({
              state: stateToSave,
              version: 4 // v1.1
            }));
            lastSaveTime = Date.now();
            // v1.1: Позначаємо в store
            if (store.markSaved) {
              store.markSaved();
            }
            resolve();
          } catch (error) {
            console.error("Autosave error:", error);
            resolve();
          }
        }, 0);
      }
    } catch (error) {
      console.error("Autosave error:", error);
      resolve();
    }
  });
}

// Запуск автозбереження
export function startAutosave(
  getStore: () => GameLifeState,
  intervalMs: number = AUTOSAVE_INTERVAL_MS
): void {
  // Зупиняємо попередній інтервал, якщо є
  stopAutosave();

  autosaveIntervalId = setInterval(() => {
    const store = getStore();
    forceSave(store).catch(console.error);
  }, intervalMs);

  // Зберігаємо при закритті вікна
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      const store = getStore();
      // Синхронне збереження при закритті
      try {
        const stateToSave = {
          currentStats: store.currentStats,
          days: store.days,
          quests: store.quests,
          quickActions: store.quickActions,
          quickActionHistory: store.quickActionHistory, // v1.1
          shopItems: store.shopItems,
          profile: store.profile,
          diamonds: store.diamonds,
          diamondsEarnedTotal: store.diamondsEarnedTotal,
          timeMeta: store.timeMeta,
          purchaseHistory: store.purchaseHistory,
          achievements: store.achievements,
          lastDayStarted: store.lastDayStarted,
          lastSavedAt: new Date().toISOString() // v1.1
        };
        localStorage.setItem("game-life-store", JSON.stringify({
          state: stateToSave,
          version: 4 // v1.1
        }));
        if (store.markSaved) {
          store.markSaved();
        }
      } catch (error) {
        console.error("Save on unload error:", error);
      }
    });

    // Зберігаємо при перезавантаженні сторінки
    window.addEventListener("pagehide", () => {
      const store = getStore();
      forceSave(store).catch(console.error);
    });
  }
}

// Зупинка автозбереження
export function stopAutosave(): void {
  if (autosaveIntervalId) {
    clearInterval(autosaveIntervalId);
    autosaveIntervalId = null;
  }
}

// Отримати час останнього збереження
export function getLastSaveTime(): number {
  return lastSaveTime;
}
