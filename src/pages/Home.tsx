import { FormEvent, useMemo, useState } from "react";
import { useGameLifeStore } from "../state/store";
import { DayBadge } from "../components/DayBadge";
import { StatsBar } from "../components/StatsBar";
import { QuickActions } from "../components/QuickActions";
import { SpeechBubble } from "../components/SpeechBubble";
import { MorningRoutine } from "../components/MorningRoutine";
import { EpicQuestWidget } from "../components/EpicQuestWidget";
import { StatSlider } from "../components/StatSlider";
import { DailyStats, DayTheme } from "../state/types";
import { getDateKey } from "../state/time";
import { format, subDays } from "date-fns";

// Початкові значення для нового дня
const defaultFeeling: DailyStats = {
  mood: 70,
  money: 0,
  energy: 70,
  motivation: 60,
  stress: 30,
  momentum: 50,
  sleepHours: 7
};

// Головний екран: рівень, XP, діаманти, поточний день, квести, швидкі дії
const Home: React.FC = () => {
  // Використовуємо примітивні селектори замість функцій
  const days = useGameLifeStore((s) => s.days);
  const quests = useGameLifeStore((s) => s.quests);
  const currentStats = useGameLifeStore((s) => s.currentStats);
  const profile = useGameLifeStore((s) => s.profile);
  const diamonds = useGameLifeStore((s) => s.diamonds);
  const startDayWithInitialStats = useGameLifeStore(
    (s) => s.startDayWithInitialStats
  );

  // Обчислюємо today та todayQuests в useMemo для стабільних посилань
  const todayKey = getDateKey();
  const today = useMemo(() => {
    // Безпечна перевірка: якщо дня немає, повертаємо undefined (буде створено при старті)
    return days?.[todayKey];
  }, [days, todayKey]);

  const todayQuests = useMemo(() => {
    if (!today || today.status !== "active") return [];
    // v1.1: Показуємо квести без plannedDate (постійні) або з plannedDate === todayKey
    return Object.values(quests).filter(
      (q) => {
        // Постійні квести (без plannedDate)
        if (!q.plannedDate && q.status === "active") return true;
        // v1.1: Квести на сьогодні (plannedDate === todayKey) - показуємо як сьогоднішні, навіть якщо status === "planned"
        if (q.plannedDate === todayKey && (q.status === "active" || q.status === "planned")) return true;
        return false;
      }
    );
  }, [quests, today, todayKey]);

  const [modalOpen, setModalOpen] = useState(false);
  const [feeling, setFeeling] = useState<DailyStats>(defaultFeeling);
  const [feelingDelta, setFeelingDelta] = useState<Partial<DailyStats>>({}); // v1.1: Зміни від попереднього дня (-25 до +25)
  const [baseStats, setBaseStats] = useState<DailyStats>(defaultFeeling); // v1.1: Базові стати (з попереднього дня)
  const [selectedTheme, setSelectedTheme] = useState<DayTheme | undefined>(undefined);

  const status = today?.status ?? "inactive";

  
  // v1.1: Обчислюємо фінальні стати на основі базових + змін
  const finalStats = useMemo(() => {
    const final: DailyStats = { ...baseStats };
    Object.entries(feelingDelta).forEach(([key, delta]) => {
      if (typeof delta === "number") {
        const statKey = key as keyof DailyStats;
        if (statKey === "money") {
          final.money = Math.max(0, baseStats.money + delta);
        } else if (statKey === "sleepHours") {
          final.sleepHours = Math.min(12, Math.max(0, baseStats.sleepHours + delta));
        } else {
          final[statKey] = Math.min(100, Math.max(0, baseStats[statKey] + delta));
        }
      }
    });
    return final;
  }, [baseStats, feelingDelta]);

  // Показуємо кнопку "Почати день" тільки якщо день не активний
  const showStartButton = status === "inactive";

  const handleOpenStart = () => {
    // v1.1: Якщо є попередній день, використовуємо його endStats як базові значення
    const yesterdayKey = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const prevDay = days[yesterdayKey];
    const base = prevDay?.endStats || prevDay?.startStats || defaultFeeling;
    
    setBaseStats(base);
    setFeelingDelta({}); // Скидаємо зміни
    setFeeling(base); // Встановлюємо базові значення
    // Ініціалізуємо тему з поточного дня або дефолтною
    setSelectedTheme(today?.theme || "hustle_mode");
    setModalOpen(true);
  };

  const handleSubmitFeeling = (e: FormEvent) => {
    e.preventDefault();
    // Використовуємо вибрану тему або тему з дня, або дефолтну
    const themeToUse = selectedTheme || today?.theme || "hustle_mode";
    // v1.1: Використовуємо фінальні стати (базові + зміни)
    startDayWithInitialStats(finalStats, themeToUse);
    setModalOpen(false);
    setSelectedTheme(undefined);
    setFeelingDelta({});
  };

  // v1.1: handleChange тепер зберігає зміни (delta), а не абсолютні значення
  const handleDeltaChange = (key: keyof DailyStats, delta: number) => {
    setFeelingDelta((prev) => ({
      ...prev,
      [key]: delta
    }));
  };

  // Групуємо квести за категоріями в правильному порядку (виключаємо головний квест)
  const groupedQuests = useMemo(() => {
    const byCat: Record<string, typeof todayQuests> = {
      daily: [],
      habit: [],
      main: [],
      side: []
    };
    todayQuests.forEach((q) => {
      // Виключаємо головний квест зі звичайних списків (він показується окремо)
      if (byCat[q.category] && !q.isMainQuest) {
        byCat[q.category].push(q);
      }
    });
    return byCat;
  }, [todayQuests]);

  // Активний головний квест (не завершений)
  const activeMainQuest = useMemo(() => {
    return todayQuests.find((q) => q.isMainQuest && q.status === "active");
  }, [todayQuests]);

  // Завершений головний квест
  const completedMainQuest = useMemo(() => {
    return todayQuests.find((q) => q.isMainQuest && q.status === "completed");
  }, [todayQuests]);

  // Розраховуємо XP до наступного рівня (починаємо з рівня 0, безпечні значення)
  const safeLevel = profile?.level ?? 0;
  const safeXpTotal = profile?.xpTotal ?? 0;
  const xpForCurrentLevel = safeLevel * 100;
  const xpForNextLevel = (safeLevel + 1) * 100;
  const xpProgress = safeXpTotal - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPercent = xpNeeded > 0 ? Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100)) : 100;

  return (
    <div className="gl-page">
      {/* v1.1: Ранкова рутина - показується після Start New Day */}
      <MorningRoutine />

      {/* Верхня секція: Рівень, HP (Energy), Діаманти */}
      <div className="gl-page-header gl-main-header">
        <div className="gl-main-stats-top">
          <div className="gl-main-stat">
            <span className="gl-main-stat-label">Рівень</span>
            <span className="gl-main-stat-value">{profile?.level ?? 0}</span>
          </div>
          <div className="gl-main-stat">
            <span className="gl-main-stat-label">XP</span>
            <span className="gl-main-stat-value">{profile?.xpTotal ?? 0}</span>
          </div>
          <div className="gl-main-stat">
            <span className="gl-main-stat-label">Діаманти</span>
            <span className="gl-main-stat-value">💎 {diamonds ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Велика кнопка "Почати день" */}
      {showStartButton && (
        <div className="gl-card gl-start-day-card">
          <button
            className="gl-btn gl-btn-primary gl-btn-start-day"
            onClick={handleOpenStart}
          >
            Почати день
          </button>
          {/* Мовна бульбашка */}
          <SpeechBubble type="main" />
        </div>
      )}

      {/* Мовна бульбашка для активного дня */}
      {status === "active" && (
        <div className="gl-card">
          <SpeechBubble type="main" />
        </div>
      )}

      {/* Стати гравця (показуємо тільки якщо день активний) - вертикальні прогрес-бари */}
      {status === "active" && (
        <>
          {/* Гроші окремо без прогрес-бару */}
          <div className="gl-card">
            <div className="gl-card-title">Гроші</div>
            <div className="gl-money-display">
              <span className="gl-money-icon">💰</span>
              <span className="gl-money-value">${currentStats?.money ?? 0}</span>
            </div>
          </div>

          {/* Інші характеристики з прогрес-барами */}
          <div className="gl-card">
            <div className="gl-card-title">Характеристики</div>
            <div className="gl-stats-vertical">
              <div className="gl-stat-bar-vertical">
                <div className="gl-stat-bar-icon">😊</div>
                <div className="gl-stat-bar-container">
                  <div className="gl-stat-bar-label">Настрій</div>
                  <div className="gl-stat-bar-wrapper">
                    <div 
                      className="gl-stat-bar-fill-vertical gl-stat-mood"
                      style={{ height: `${currentStats?.mood ?? 0}%` }}
                    >
                      <div className="gl-stat-bar-glow"></div>
                    </div>
                  </div>
                  <div className="gl-stat-bar-value">{currentStats?.mood ?? 0}</div>
                </div>
              </div>
              <div className="gl-stat-bar-vertical">
              <div className="gl-stat-bar-icon">⚡</div>
              <div className="gl-stat-bar-container">
                <div className="gl-stat-bar-label">Енергія</div>
                <div className="gl-stat-bar-wrapper">
                  <div 
                    className="gl-stat-bar-fill-vertical gl-stat-energy"
                    style={{ height: `${currentStats?.energy ?? 0}%` }}
                  >
                    <div className="gl-stat-bar-glow"></div>
                  </div>
                </div>
                <div className="gl-stat-bar-value">{currentStats?.energy ?? 0}</div>
              </div>
            </div>
            <div className="gl-stat-bar-vertical">
              <div className="gl-stat-bar-icon">🔥</div>
              <div className="gl-stat-bar-container">
                <div className="gl-stat-bar-label">Мотивація</div>
                <div className="gl-stat-bar-wrapper">
                  <div 
                    className="gl-stat-bar-fill-vertical gl-stat-motivation"
                    style={{ height: `${currentStats?.motivation ?? 0}%` }}
                  >
                    <div className="gl-stat-bar-glow"></div>
                  </div>
                </div>
                <div className="gl-stat-bar-value">{currentStats?.motivation ?? 0}</div>
              </div>
            </div>
            <div className="gl-stat-bar-vertical">
              <div className="gl-stat-bar-icon">⚠️</div>
              <div className="gl-stat-bar-container">
                <div className="gl-stat-bar-label">Стрес</div>
                <div className="gl-stat-bar-wrapper">
                  <div 
                    className="gl-stat-bar-fill-vertical gl-stat-stress"
                    style={{ height: `${currentStats?.stress ?? 0}%` }}
                  >
                    <div className="gl-stat-bar-glow"></div>
                  </div>
                </div>
                <div className="gl-stat-bar-value">{currentStats?.stress ?? 0}</div>
              </div>
            </div>
            <div className="gl-stat-bar-vertical">
              <div className="gl-stat-bar-icon">📈</div>
              <div className="gl-stat-bar-container">
                <div className="gl-stat-bar-label">Імпульс</div>
                <div className="gl-stat-bar-wrapper">
                  <div 
                    className="gl-stat-bar-fill-vertical gl-stat-momentum"
                    style={{ height: `${currentStats?.momentum ?? 0}%` }}
                  >
                    <div className="gl-stat-bar-glow"></div>
                  </div>
                </div>
                <div className="gl-stat-bar-value">{currentStats?.momentum ?? 0}</div>
              </div>
            </div>
            <div className="gl-stat-bar-vertical">
              <div className="gl-stat-bar-icon">🌙</div>
              <div className="gl-stat-bar-container">
                <div className="gl-stat-bar-label">Сон (год)</div>
                <div className="gl-stat-bar-wrapper">
                  <div 
                    className="gl-stat-bar-fill-vertical gl-stat-sleep"
                    style={{ height: `${((currentStats?.sleepHours ?? 0) / 12) * 100}%` }}
                  >
                    <div className="gl-stat-bar-glow"></div>
                  </div>
                </div>
                <div className="gl-stat-bar-value">{currentStats?.sleepHours ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Секція "Поточний день" - показує квести сьогодні */}
      {status === "active" && (
        <div className="gl-card">
          <div className="gl-card-title">Поточний день</div>
          {todayQuests.length === 0 ? (
            <p className="gl-muted">Поки що немає запланованих квестів на сьогодні.</p>
          ) : (
            <>
              {/* Показуємо завершений головний квест зверху */}
              {completedMainQuest && (
                <div className="gl-quest-item gl-main-quest-completed">
                  <div className="gl-quest-header">
                    <span className="gl-main-quest-star">⭐</span>
                    <span className="gl-quest-title">{completedMainQuest.title}</span>
                    <span className="gl-badge gl-badge-success">Виконано</span>
                  </div>
                  {completedMainQuest.description && (
                    <div className="gl-quest-description">{completedMainQuest.description}</div>
                  )}
                  <div className="gl-quest-rewards">
                    {completedMainQuest.rewards.xp && (
                      <span>XP: +{Math.floor(completedMainQuest.rewards.xp * 1.5)}</span>
                    )}
                    {completedMainQuest.rewards.diamonds && (
                      <span>💎: +{Math.floor(completedMainQuest.rewards.diamonds * 1.5)}</span>
                    )}
                  </div>
                </div>
              )}
              {groupedQuests.daily.length > 0 && (
                <div className="gl-quest-group">
                  <h3 className="gl-quest-group-title">Щоденні</h3>
                  <ul className="gl-list">
                    {groupedQuests.daily.map((q) => (
                      <li key={q.id} className="gl-list-item">
                        <div className="gl-list-title">{q.title}</div>
                        {q.description && (
                          <div className="gl-list-sub">{q.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {groupedQuests.habit.length > 0 && (
                <div className="gl-quest-group">
                  <h3 className="gl-quest-group-title">Звички</h3>
                  <ul className="gl-list">
                    {groupedQuests.habit.map((q) => (
                      <li key={q.id} className="gl-list-item">
                        <div className="gl-list-title">{q.title}</div>
                        {q.description && (
                          <div className="gl-list-sub">{q.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {groupedQuests.main.length > 0 && (
                <div className="gl-quest-group">
                  <h3 className="gl-quest-group-title">Головні</h3>
                  <ul className="gl-list">
                    {groupedQuests.main.map((q) => (
                      <li key={q.id} className="gl-list-item">
                        <div className="gl-list-title">{q.title}</div>
                        {q.description && (
                          <div className="gl-list-sub">{q.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {groupedQuests.side.length > 0 && (
                <div className="gl-quest-group">
                  <h3 className="gl-quest-group-title">Побічні</h3>
                  <ul className="gl-list">
                    {groupedQuests.side.map((q) => (
                      <li key={q.id} className="gl-list-item">
                        <div className="gl-list-title">{q.title}</div>
                        {q.description && (
                          <div className="gl-list-sub">{q.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Швидкі дії */}
      {status === "active" && <QuickActions />}

      {/* Epic Quest Widget - нижче швидких дій, показує тільки поточний етап */}
      {status === "active" && <EpicQuestWidget />}

      {/* Модальне вікно для введення статів при старті дня */}
      {modalOpen && (
        <div className="gl-modal-backdrop">
          <div className="gl-modal">
            <h2 className="gl-modal-title">Як ти себе почуваєш сьогодні?</h2>
            <p className="gl-muted">
              {baseStats !== defaultFeeling 
                ? "Скоригуй характеристики від вчорашнього дня (від -25 до +25)."
                : "Оціни кожну характеристику. Це буде стартова точка для сьогоднішнього дня."}
            </p>
            <form className="gl-form" onSubmit={handleSubmitFeeling}>
              {/* Вибір теми дня */}
              <label className="gl-form-label">
                Тема дня
                <select
                  className="gl-input"
                  value={selectedTheme || today?.theme || "hustle_mode"}
                  onChange={(e) => setSelectedTheme(e.target.value as DayTheme)}
                >
                  <option value="hustle_mode">Hustle Mode</option>
                  <option value="zen_focus">Zen Focus</option>
                  <option value="procrastinator_slayer">Procrastinator Slayer</option>
                  <option value="night_owl">Night Owl</option>
                  <option value="momentum_boost">Momentum Boost</option>
                  <option value="mystic_vision">Mystic Vision</option>
                </select>
              </label>
              
              {/* v1.1: StatSlider для змін від -25 до +25 */}
              <div className="gl-form-label" style={{ marginTop: "1rem", marginBottom: "0.5rem", fontWeight: "600" }}>
                {baseStats !== defaultFeeling ? "Зміни від вчорашнього дня:" : "Характеристики:"}
              </div>
              
              <StatSlider
                label="Настрій"
                icon="😊"
                value={feelingDelta.mood || 0}
                onChange={(value) => handleDeltaChange("mood", value)}
                min={-25}
                max={25}
                allowNegative={true}
              />
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Вчора: {baseStats.mood.toFixed(0)} → Сьогодні: {finalStats.mood.toFixed(0)}
                </div>
              )}
              
              <StatSlider
                label="Енергія"
                icon="⚡"
                value={feelingDelta.energy || 0}
                onChange={(value) => handleDeltaChange("energy", value)}
                min={-25}
                max={25}
                allowNegative={true}
              />
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Вчора: {baseStats.energy.toFixed(0)} → Сьогодні: {finalStats.energy.toFixed(0)}
                </div>
              )}
              
              <StatSlider
                label="Мотивація"
                icon="🔥"
                value={feelingDelta.motivation || 0}
                onChange={(value) => handleDeltaChange("motivation", value)}
                min={-25}
                max={25}
                allowNegative={true}
              />
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Вчора: {baseStats.motivation.toFixed(0)} → Сьогодні: {finalStats.motivation.toFixed(0)}
                </div>
              )}
              
              <StatSlider
                label="Стрес"
                icon="😰"
                value={feelingDelta.stress || 0}
                onChange={(value) => handleDeltaChange("stress", value)}
                min={-25}
                max={25}
                allowNegative={true}
              />
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Вчора: {baseStats.stress.toFixed(0)} → Сьогодні: {finalStats.stress.toFixed(0)}
                </div>
              )}
              
              <StatSlider
                label="Імпульс"
                icon="📈"
                value={feelingDelta.momentum || 0}
                onChange={(value) => handleDeltaChange("momentum", value)}
                min={-25}
                max={25}
                allowNegative={true}
              />
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Вчора: {baseStats.momentum.toFixed(0)} → Сьогодні: {finalStats.momentum.toFixed(0)}
                </div>
              )}
              
              <StatSlider
                label="Години сну"
                icon="🌙"
                value={feelingDelta.sleepHours || 0}
                onChange={(value) => handleDeltaChange("sleepHours", value)}
                min={-25}
                max={25}
                allowNegative={true}
              />
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Вчора: {baseStats.sleepHours.toFixed(1)} → Сьогодні: {finalStats.sleepHours.toFixed(1)}
                </div>
              )}
              
              <label className="gl-form-label">
                Гроші ($): {finalStats.money.toFixed(0)}
                <input
                  type="number"
                  className="gl-input"
                  value={finalStats.money}
                  onChange={(e) => {
                    const newMoney = Number(e.target.value) || 0;
                    const delta = newMoney - baseStats.money;
                    handleDeltaChange("money", delta);
                  }}
                />
              </label>
              {baseStats !== defaultFeeling && (
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem" }}>
                  Вчора: {baseStats.money.toFixed(0)} → Сьогодні: {finalStats.money.toFixed(0)}
                </div>
              )}
              <p className="gl-hint">
                * Легка згадка про Богашиву: якщо відчуваєш третє око — можливо,
                настав час головного квесту :)
              </p>
              <div className="gl-card-actions">
                <button
                  type="button"
                  className="gl-btn gl-btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="gl-btn gl-btn-primary"
                >
                  Почати день
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
