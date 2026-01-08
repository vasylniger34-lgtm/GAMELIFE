import { GameLifeState } from "../state/store";
import { DailyStats, Day, Quest, QuickAction, ShopItem, Profile, Achievement, PurchaseRecord, TimeMeta } from "../state/types";

// Версія формату збереження (має відповідати версії в store.ts)
export const SAVE_VERSION = 3;

// Тип для експортованого стану
export interface ExportedState {
  version: number;
  timestamp: string;
  data: {
    currentStats: DailyStats;
    days: Record<string, Day>;
    quests: Record<string, Quest>;
    quickActions: Record<string, QuickAction>;
    shopItems: Record<string, ShopItem>;
    profile: Profile;
    diamonds: number;
    diamondsEarnedTotal: number;
    timeMeta: TimeMeta;
    purchaseHistory: PurchaseRecord[];
    achievements: Record<string, Achievement>;
    lastDayStarted: string | null;
  };
  checksum?: string; // Опціональний checksum для валідації
}

// Обчислює простий checksum для валідації
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Валідація структури стану
export function validateState(state: any): state is ExportedState["data"] {
  if (!state || typeof state !== "object") return false;

  // Перевірка основних полів
  const requiredFields = [
    "currentStats",
    "days",
    "quests",
    "quickActions",
    "shopItems",
    "profile",
    "diamonds",
    "diamondsEarnedTotal",
    "timeMeta",
    "purchaseHistory",
    "achievements"
  ];

  for (const field of requiredFields) {
    if (!(field in state)) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }

  // Перевірка типів
  if (typeof state.diamonds !== "number" || typeof state.diamondsEarnedTotal !== "number") {
    return false;
  }

  if (!state.profile || typeof state.profile.level !== "number" || typeof state.profile.xpTotal !== "number") {
    return false;
  }

  if (!Array.isArray(state.purchaseHistory)) {
    return false;
  }

  return true;
}

// Експорт стану в JSON
export function exportState(state: GameLifeState): string {
  try {
    const exportData: ExportedState = {
      version: SAVE_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        currentStats: state.currentStats,
        days: state.days,
        quests: state.quests,
        quickActions: state.quickActions,
        shopItems: state.shopItems,
        profile: state.profile,
        diamonds: state.diamonds,
        diamondsEarnedTotal: state.diamondsEarnedTotal,
        timeMeta: state.timeMeta,
        purchaseHistory: state.purchaseHistory,
        achievements: state.achievements,
        lastDayStarted: state.lastDayStarted
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const checksum = calculateChecksum(jsonString);
    exportData.checksum = checksum;

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error("Export error:", error);
    throw new Error("Помилка експорту даних");
  }
}

// Імпорт стану з JSON
export function importState(jsonString: string): ExportedState["data"] {
  try {
    const parsed: ExportedState = JSON.parse(jsonString);

    // Перевірка версії
    if (parsed.version > SAVE_VERSION) {
      throw new Error(`Непідтримувана версія збереження: ${parsed.version}. Поточна версія: ${SAVE_VERSION}`);
    }

    // Перевірка checksum (якщо є)
    if (parsed.checksum) {
      const jsonWithoutChecksum = JSON.stringify({ ...parsed, checksum: undefined }, null, 2);
      const calculatedChecksum = calculateChecksum(jsonWithoutChecksum);
      if (calculatedChecksum !== parsed.checksum) {
        console.warn("Checksum mismatch - data might be corrupted");
      }
    }

    // Валідація структури
    if (!validateState(parsed.data)) {
      throw new Error("Невірна структура даних");
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Невірний формат JSON");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Помилка імпорту даних");
  }
}

// Завантаження стану з файлу
export function loadStateFromFile(file: File): Promise<ExportedState["data"]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const state = importState(text);
        resolve(state);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Помилка читання файлу"));
    };

    reader.readAsText(file);
  });
}

// Завантаження стану в файл (v1.1: покращено для iOS Safari)
export function downloadStateAsFile(state: GameLifeState, filename?: string): void {
  try {
    const jsonString = exportState(state);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `game-life-save-${new Date().toISOString().split("T")[0]}.json`;
    
    // v1.1: iOS Safari сумісність - додаємо атрибут для завантаження
    link.setAttribute("download", link.download);
    
    // Додаємо до DOM перед кліком (важливо для iOS)
    document.body.appendChild(link);
    
    // Використовуємо setTimeout для забезпечення рендерингу
    setTimeout(() => {
      link.click();
      // Видаляємо після затримки для iOS
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, 0);
  } catch (error) {
    console.error("Download error:", error);
    // v1.1: Fallback для iOS - відкриваємо в новому вікні
    try {
      const jsonString = exportState(state);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
      window.open(dataUri, "_blank");
    } catch (fallbackError) {
      throw new Error("Помилка завантаження файлу");
    }
  }
}
