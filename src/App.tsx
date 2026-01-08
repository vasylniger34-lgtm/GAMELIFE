import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Quests from "./pages/Quests";
import Statistics from "./pages/Statistics";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import QuickActionArchive from "./pages/QuickActionArchive";
import NotFound from "./pages/NotFound";
import { Header } from "./components/layout/Header";
import { BottomNav } from "./components/layout/BottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect, useRef } from "react";
import { useGameLifeStore } from "./state/store";
import { getDateKey } from "./state/time";
import { initNotifications } from "./services/notifications";
import { startAutosave } from "./services/autosave";

// Головний компонент застосунку, маршрути та каркас макету
const App: React.FC = () => {
  const activatePlannedForToday = useGameLifeStore(
    (s) => s.activatePlannedForToday
  );
  const syncDayForToday = useGameLifeStore((s) => s.syncDayForToday);
  
  // Отримуємо тему поточного дня для застосування на всіх сторінках
  const today = useGameLifeStore((s) => {
    const todayKey = getDateKey();
    return s.days[todayKey];
  });
  const theme = today?.theme || "hustle_mode";
  const themeClass = `gl-theme-${theme}`;
  
  // Використовуємо ref для відстеження останньої синхронізованої дати
  const lastSyncedDateRef = useRef<string | null>(null);

  // При першому відкритті за день — синхронізуємо день та активуємо заплановані квести
  useEffect(() => {
    const todayKey = getDateKey();
    
    // Синхронізуємо тільки якщо дата змінилась або це перший запуск
    if (lastSyncedDateRef.current !== todayKey) {
      // 1) синхронізуємо день за поточною датою (автоматичне архівування попереднього дня)
      syncDayForToday();
      // 2) активуємо квести, заплановані на сьогодні
      activatePlannedForToday();
      lastSyncedDateRef.current = todayKey;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Порожній масив - виконується тільки при монтуванні

  // Ініціалізація сповіщень при завантаженні додатку
  useEffect(() => {
    initNotifications();
  }, []);

  // Запуск автозбереження
  useEffect(() => {
    startAutosave(() => useGameLifeStore.getState());
    return () => {
      // Cleanup при розмонтуванні (хоча це не повинно статися для App)
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className={`gl-root ${themeClass}`}>
        <Header />
        <main className="gl-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/archive" element={<QuickActionArchive />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </ErrorBoundary>
  );
};

export default App;
