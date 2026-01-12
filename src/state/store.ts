import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Achievement,
  AchievementId,
  AppStatsAggregated,
  DailyStats,
  Day,
  DayStatus,
  DayTheme,
  EpicQuest,
  EpicQuestStep,
  Habit,
  HabitHistory,
  Profile,
  PurchaseRecord,
  Quest,
  QuestCategory,
  QuestStatus,
  QuickAction,
  QuickActionHistory,
  ShopItem,
  TimeMeta
} from "./types";
import { diffHours, getDateKey, nowIso } from "./time";

// Базові стартові значення статів (для нового дня)
const defaultDailyStats: DailyStats = {
  mood: 70,
  money: 0,
  energy: 70,
  motivation: 60,
  stress: 30,
  momentum: 50,
  sleepHours: 7
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const clampSleep = (value: number) => Math.min(12, Math.max(0, value));

// Функція для перевірки та оновлення досягнень
// Використовуємо any для типів, оскільки це внутрішня функція
const checkAndUpdateAchievements = (get: () => any, set: (partial: any) => void) => {
  const state = get();
  const achievements = { ...state.achievements };
  let updated = false;

  // 1. Foundation Laid (Level 2)
  if (!achievements.foundation_laid.unlocked && state.profile.level >= 2) {
    achievements.foundation_laid = {
      ...achievements.foundation_laid,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: state.profile.level
    };
    updated = true;
  } else if (!achievements.foundation_laid.unlocked) {
    achievements.foundation_laid = {
      ...achievements.foundation_laid,
      current: state.profile.level,
      progress: Math.min(100, (state.profile.level / 2) * 100)
    };
    updated = true;
  }

  // 2. Quest Initiate (Complete 10 quests)
  const completedQuests = Object.values(state.quests).filter(
    (q) => q.status === "completed"
  ).length;
  if (!achievements.quest_initiate.unlocked && completedQuests >= 10) {
    achievements.quest_initiate = {
      ...achievements.quest_initiate,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: completedQuests
    };
    updated = true;
  } else if (!achievements.quest_initiate.unlocked) {
    achievements.quest_initiate = {
      ...achievements.quest_initiate,
      current: completedQuests,
      progress: Math.min(100, (completedQuests / 10) * 100)
    };
    updated = true;
  }

  // 3. Money Maker (Earn $100)
  const totalMoney = state.currentStats.money;
  if (!achievements.money_maker.unlocked && totalMoney >= 100) {
    achievements.money_maker = {
      ...achievements.money_maker,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: totalMoney
    };
    updated = true;
  } else if (!achievements.money_maker.unlocked) {
    achievements.money_maker = {
      ...achievements.money_maker,
      current: totalMoney,
      progress: Math.min(100, (totalMoney / 100) * 100)
    };
    updated = true;
  }

  // 4. Sleep Streak (7+ hours for 7 consecutive days)
  const finishedDays = Object.values(state.days)
    .filter((d) => d.status === "finished" && d.endStats)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  const sleepStreak = finishedDays
    .slice(0, 7)
    .filter((d) => d.endStats && d.endStats.sleepHours >= 7).length;
  if (!achievements.sleep_streak.unlocked && sleepStreak >= 7) {
    achievements.sleep_streak = {
      ...achievements.sleep_streak,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: sleepStreak
    };
    updated = true;
  } else if (!achievements.sleep_streak.unlocked) {
    achievements.sleep_streak = {
      ...achievements.sleep_streak,
      current: sleepStreak,
      progress: Math.min(100, (sleepStreak / 7) * 100)
    };
    updated = true;
  }

  // 5. Stress Slayer (Stress < 30 for 3 consecutive days)
  const stressStreak = finishedDays
    .slice(0, 3)
    .filter((d) => d.endStats && d.endStats.stress < 30).length;
  if (!achievements.stress_slayer.unlocked && stressStreak >= 3) {
    achievements.stress_slayer = {
      ...achievements.stress_slayer,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: stressStreak
    };
    updated = true;
  } else if (!achievements.stress_slayer.unlocked) {
    achievements.stress_slayer = {
      ...achievements.stress_slayer,
      current: stressStreak,
      progress: Math.min(100, (stressStreak / 3) * 100)
    };
    updated = true;
  }

  // 6. Momentum Master (Reach Momentum 80+)
  const currentMomentum = state.currentStats.momentum;
  if (!achievements.momentum_master.unlocked && currentMomentum >= 80) {
    achievements.momentum_master = {
      ...achievements.momentum_master,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: currentMomentum
    };
    updated = true;
  } else if (!achievements.momentum_master.unlocked) {
    achievements.momentum_master = {
      ...achievements.momentum_master,
      current: currentMomentum,
      progress: Math.min(100, (currentMomentum / 80) * 100)
    };
    updated = true;
  }

  // 7. Daily Dominator (Complete all daily quests for 5 days)
  // Перевіряємо останні 5 днів
  const dailyDominatorDays = finishedDays.slice(0, 5).filter((day) => {
    const dayQuests = Object.values(state.quests).filter(
      (q) => q.plannedDate === day.date && q.category === "daily"
    );
    return dayQuests.length > 0 && dayQuests.every((q) => q.status === "completed");
  }).length;
  if (!achievements.daily_dominator.unlocked && dailyDominatorDays >= 5) {
    achievements.daily_dominator = {
      ...achievements.daily_dominator,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: dailyDominatorDays
    };
    updated = true;
  } else if (!achievements.daily_dominator.unlocked) {
    achievements.daily_dominator = {
      ...achievements.daily_dominator,
      current: dailyDominatorDays,
      progress: Math.min(100, (dailyDominatorDays / 5) * 100)
    };
    updated = true;
  }

  // 8. Habit Hero (Maintain 3 habits for 7 days straight)
  const habitHeroDays = finishedDays.slice(0, 7).filter((day) => {
    const dayHabits = Object.values(state.quests).filter(
      (q) => q.plannedDate === day.date && q.category === "habit" && q.status === "completed"
    );
    return dayHabits.length >= 3;
  }).length;
  if (!achievements.habit_hero.unlocked && habitHeroDays >= 7) {
    achievements.habit_hero = {
      ...achievements.habit_hero,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: habitHeroDays
    };
    updated = true;
  } else if (!achievements.habit_hero.unlocked) {
    achievements.habit_hero = {
      ...achievements.habit_hero,
      current: habitHeroDays,
      progress: Math.min(100, (habitHeroDays / 7) * 100)
    };
    updated = true;
  }

  // 9. Diamond Collector (Spend 50 Diamonds in shop)
  const diamondsSpent = state.purchaseHistory.reduce((sum, p) => sum + p.cost, 0);
  if (!achievements.diamond_collector.unlocked && diamondsSpent >= 50) {
    achievements.diamond_collector = {
      ...achievements.diamond_collector,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: diamondsSpent
    };
    updated = true;
  } else if (!achievements.diamond_collector.unlocked) {
    achievements.diamond_collector = {
      ...achievements.diamond_collector,
      current: diamondsSpent,
      progress: Math.min(100, (diamondsSpent / 50) * 100)
    };
    updated = true;
  }

  // 10. Ultimate GL (Reach Level 5 and complete 50 quests)
  const isLevel5 = state.profile.level >= 5;
  const has50Quests = completedQuests >= 50;
  const ultimateGL = isLevel5 && has50Quests ? 1 : 0;
  if (!achievements.ultimate_gl.unlocked && ultimateGL === 1) {
    achievements.ultimate_gl = {
      ...achievements.ultimate_gl,
      unlocked: true,
      unlockedAt: nowIso(),
      progress: 100,
      current: 1
    };
    updated = true;
  } else if (!achievements.ultimate_gl.unlocked) {
    const levelProgress = Math.min(100, (state.profile.level / 5) * 100);
    const questProgress = Math.min(100, (completedQuests / 50) * 100);
    achievements.ultimate_gl = {
      ...achievements.ultimate_gl,
      current: 0,
      progress: Math.min(100, (levelProgress + questProgress) / 2)
    };
    updated = true;
  }

  if (updated) {
    set({ achievements });
  }
};

export interface GameLifeState {
  // Данні
  currentStats: DailyStats; // Поточні стати активного дня
  days: Record<string, Day>; // key = dateKey, всі дні автоматично архівуються
  quests: Record<string, Quest>;
  habits: Record<string, Habit>; // v1.1: Звички (окрема система)
  habitHistory: HabitHistory[]; // v1.1: Архів звичок
  quickActions: Record<string, QuickAction>;
  quickActionHistory: QuickActionHistory[]; // v1.1: Архів швидких дій
  shopItems: Record<string, ShopItem>;
  profile: Profile;
  diamonds: number; // Поточна кількість діамантів
  diamondsEarnedTotal: number; // Загальна кількість зароблених діамантів
  timeMeta: TimeMeta;
  purchaseHistory: PurchaseRecord[]; // Історія покупок
  achievements: Record<AchievementId, Achievement>; // Досягнення
  lastDayStarted: string | null; // Остання дата, коли був розпочатий день (для стріків)
  lastSavedAt?: string; // v1.1: Час останнього збереження (ISO timestamp)
  epicQuest?: EpicQuest; // Epic Quest - довгостроковий квест з етапами

  // Обчислені властивості
  getToday: () => Day | undefined;
  getQuestsForDate: (dateKey: string) => Quest[];
  getTodayQuests: () => Quest[];
  getAggregatedStats: () => AppStatsAggregated;
  getProfile: () => Profile;

  // Логіка часу / анти‑маніпуляція
  touchTime: () => void;
  registerActivity: () => void;

  // Система дня
  syncDayForToday: () => void; // Синхронізація при зміні дати (автоматичне архівування)
  startDayWithInitialStats: (initial: DailyStats, theme?: DayTheme) => void; // Старт дня з введенням статів

  // Квести
  createQuest: (input: {
    title: string;
    description?: string;
    category: QuestCategory;
    plannedDate?: string; // v1.1: опціональна для постійних квестів
    rewards: Quest["rewards"];
    penalties?: Partial<DailyStats>;
    penaltyDiamonds?: number; // v1.1: покарання діамантами
  }) => void;
  completeQuest: (id: string) => void;
  completeQuestEarly: (id: string) => void; // v1.1: виконання майбутнього квесту завчасно
  failQuest: (id: string, penaltyDiamonds?: number) => void; // v1.1: з покаранням діамантами
  archiveQuest: (id: string) => void;
  executeQuest: (id: string) => void; // v1.1: виконання постійного квесту (одразу бонуси, не зникає)

  // Планування
  activatePlannedForToday: () => void;

  // Швидкі дії
  createQuickAction: (input: { name: string; description?: string; effect: Partial<DailyStats> }) => void;
  updateQuickAction: (id: string, input: { name?: string; description?: string; effect?: Partial<DailyStats> }) => void;
  deleteQuickAction: (id: string) => void;
  applyQuickAction: (id: string) => void; // v1.1: тепер також зберігає в історію
  getQuickActionHistory: () => QuickActionHistory[]; // v1.1: отримати архів

  // Магазин
  createShopItem: (input: { name: string; description?: string; cost: number; effect?: Partial<DailyStats>; narrativeAction?: string }) => void;
  updateShopItem: (id: string, input: { name?: string; description?: string; cost?: number; effect?: Partial<DailyStats>; narrativeAction?: string }) => void;
  deleteShopItem: (id: string) => void;
  purchaseShopItem: (id: string) => void;

  // Оновлення статів (застосування змін)
  applyStatsDelta: (delta: Partial<DailyStats>) => void;

  // v1.1: Ранкова рутина
  completeMorningRoutine: () => void;

  // v1.1: Система збережень
  markSaved: () => void; // Позначити час останнього збереження

  // Epic Quest: довгостроковий квест з етапами
  createEpicQuest: (input: {
    title: string;
    description?: string;
    steps: Array<{ title: string; description?: string }>;
    finalRewards?: EpicQuest["finalRewards"];
  }) => void;
  updateEpicQuest: (input: {
    title?: string;
    description?: string;
    steps?: Array<{ title: string; description?: string }>;
  }) => void;
  completeEpicQuestStep: (stepId: string) => void; // Виконати поточний етап
  getEpicQuestProgress: () => number; // Прогрес у відсотках (0-100)
  resetEpicQuest: () => void; // Скинути Epic Quest для створення нового

  // Habits: постійні дії без дати
  createHabit: (input: {
    name: string;
    description?: string;
    effect: Habit["effect"];
  }) => void;
  updateHabit: (id: string, input: {
    name?: string;
    description?: string;
    effect?: Habit["effect"];
  }) => void;
  deleteHabit: (id: string) => void;
  executeHabit: (id: string) => void; // Виконати habit (одразу бонуси, зберігає в історію)
  getHabitHistory: () => HabitHistory[]; // Отримати архів habits
}

// Початковий стан для першого запуску
const createInitialState = (): Omit<
  GameLifeState,
  | "getToday"
  | "getQuestsForDate"
  | "getTodayQuests"
  | "getAggregatedStats"
  | "getProfile"
  | "touchTime"
  | "registerActivity"
  | "syncDayForToday"
  | "startDayWithInitialStats"
  | "createQuest"
  | "completeQuest"
  | "failQuest"
  | "archiveQuest"
  | "activatePlannedForToday"
  | "createQuickAction"
  | "updateQuickAction"
  | "deleteQuickAction"
  | "applyQuickAction"
  | "createShopItem"
  | "updateShopItem"
  | "deleteShopItem"
  | "purchaseShopItem"
  | "applyStatsDelta"
> => {
  const now = Date.now();

  // Початкові досягнення (оновлені згідно з новими вимогами)
  const initialAchievements: Record<AchievementId, Achievement> = {
    foundation_laid: {
      id: "foundation_laid",
      name: "Foundation Laid",
      description: "Досягни рівня 2",
      icon: "✨",
      unlocked: false,
      progress: 0,
      target: 2,
      current: 1
    },
    quest_initiate: {
      id: "quest_initiate",
      name: "Quest Initiate",
      description: "Виконай 10 квестів",
      icon: "⚡",
      unlocked: false,
      progress: 0,
      target: 10,
      current: 0
    },
    sleep_streak: {
      id: "sleep_streak",
      name: "Sleep Streak",
      description: "Тримай 7+ годин сну 7 днів поспіль",
      icon: "🌙",
      unlocked: false,
      progress: 0,
      target: 7,
      current: 0
    },
    stress_slayer: {
      id: "stress_slayer",
      name: "Stress Slayer",
      description: "Тримай стрес < 30 три дні поспіль",
      icon: "🧊",
      unlocked: false,
      progress: 0,
      target: 3,
      current: 0
    },
    money_maker: {
      id: "money_maker",
      name: "Money Maker",
      description: "Зароби $100",
      icon: "💰",
      unlocked: false,
      progress: 0,
      target: 100,
      current: 0
    },
    momentum_master: {
      id: "momentum_master",
      name: "Momentum Master",
      description: "Досягни імпульсу 80+",
      icon: "🌊",
      unlocked: false,
      progress: 0,
      target: 80,
      current: 0
    },
    daily_dominator: {
      id: "daily_dominator",
      name: "Daily Dominator",
      description: "Виконай всі щоденні квести 5 днів поспіль",
      icon: "☀️",
      unlocked: false,
      progress: 0,
      target: 5,
      current: 0
    },
    habit_hero: {
      id: "habit_hero",
      name: "Habit Hero",
      description: "Тримай 3 звички 7 днів поспіль",
      icon: "🔥",
      unlocked: false,
      progress: 0,
      target: 7,
      current: 0
    },
    diamond_collector: {
      id: "diamond_collector",
      name: "Diamond Collector",
      description: "Витрать 50 діамантів в магазині",
      icon: "💎",
      unlocked: false,
      progress: 0,
      target: 50,
      current: 0
    },
    ultimate_gl: {
      id: "ultimate_gl",
      name: "Ultimate GL",
      description: "Досягни рівня 5 та виконай 50 квестів",
      icon: "👑",
      unlocked: false,
      progress: 0,
      target: 1,
      current: 0
    }
  };

  // Створюємо початковий день для сьогодні, якщо його немає
  const todayKey = getDateKey();
  const initialDays: Record<string, Day> = {};
  if (!initialDays[todayKey]) {
    initialDays[todayKey] = {
      id: `day-${todayKey}`,
      date: todayKey,
      status: "inactive",
      startStats: { ...defaultDailyStats },
      theme: "hustle_mode" // Дефолтна тема
    };
  }

  return {
    currentStats: { ...defaultDailyStats },
    days: initialDays,
    quests: {},
    habits: {}, // v1.1: Звички
    habitHistory: [], // v1.1: Архів звичок
    quickActions: {},
    quickActionHistory: [], // v1.1: Архів швидких дій
    shopItems: {},
    profile: {
      level: 0,
      xpTotal: 0,
      xpHistory: []
    },
    diamonds: 0,
    diamondsEarnedTotal: 0,
    timeMeta: {
      lastTimestamp: now,
      lastActivityAt: now,
      timeSuspicious: false
    },
    purchaseHistory: [],
    achievements: initialAchievements,
    lastDayStarted: null,
    lastSavedAt: undefined, // v1.1: Час останнього збереження
    epicQuest: undefined // Epic Quest
  };
};

export const useGameLifeStore = create<GameLifeState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      // ===== Обчислювані селектори =====
      getToday: () => {
        const dateKey = getDateKey();
        return get().days[dateKey];
      },

      getQuestsForDate: (dateKey: string) =>
        Object.values(get().quests).filter((q) => q.plannedDate === dateKey),

      getTodayQuests: () => {
        const dateKey = getDateKey();
        const today = get().getToday();
        if (!today || today.status !== "active") return [];
        
        return Object.values(get().quests).filter(
          (q) => q.plannedDate === dateKey && (q.status === "active" || q.status === "planned")
        );
      },

      getAggregatedStats: () => {
        const days = Object.values(get().days);
        const quests = Object.values(get().quests);
        const totalDays = days.filter((d) => d.status === "finished").length;
        const completedQuests = quests.filter((q) => q.status === "completed").length;
        const failedQuests = quests.filter((q) => q.status === "failed").length;
        const diamondsEarned = get().diamondsEarnedTotal;
        const xpGained = get().profile.xpTotal;

        return {
          totalDays,
          completedQuests,
          failedQuests,
          diamondsEarned,
          xpGained
        };
      },

      getProfile: () => get().profile,

      // ===== Час та активність =====
      touchTime: () => {
        const now = Date.now();
        const { timeMeta } = get();
        if (now + 5 * 60 * 1000 < timeMeta.lastTimestamp) {
          set({
            timeMeta: {
              ...timeMeta,
              lastTimestamp: now,
              timeSuspicious: true
            }
          });
        } else {
          set({
            timeMeta: { ...timeMeta, lastTimestamp: now }
          });
        }
      },

      registerActivity: () => {
        const now = Date.now();
        const { timeMeta } = get();
        set({
          timeMeta: { ...timeMeta, lastActivityAt: now }
        });
      },

      // ===== Система дня =====
      // Синхронізація днів при зміні календарної дати (автоматичне архівування)
      syncDayForToday: () => {
        const state = get();
        const todayKey = getDateKey();
        const days = { ...state.days };
        const quests = { ...state.quests };

        // Якщо є активний день з іншої дати — завершуємо його автоматично
        const activeOtherDay = Object.values(days).find(
          (d) => d.status === "active" && d.date !== todayKey
        );

        if (activeOtherDay) {
          const previousDate = activeOtherDay.date;
          
          // v1.1: Автоматично провалюємо всі невиконані квести попереднього дня (не тільки daily)
          Object.values(quests).forEach((q) => {
            if (
              q.plannedDate === previousDate &&
              (q.status === "active" || q.status === "planned")
            ) {
              quests[q.id] = {
                ...q,
                status: "failed",
                executedAt: nowIso()
              };
            }
          });

          // v1.1: Фіксуємо кінцеві стати при завершенні дня
          const finishedDay: Day = {
            ...activeOtherDay,
            status: "finished",
            endTime: nowIso(),
            endStats: { ...state.currentStats } // Фіксуємо поточні стати як кінцеві
          };
          days[previousDate] = finishedDay;

          // v1.1: Автоматично архівуємо всі квести попереднього дня (completed, failed, або тільки що провалені)
          Object.values(quests).forEach((q) => {
            if (
              q.plannedDate === previousDate &&
              (q.status === "completed" || q.status === "failed")
            ) {
              // Застосовуємо покарання для провалених квестів перед архівуванням
              if (q.status === "failed") {
                const diamondsToDeduct = q.penaltyDiamonds || 0;
                if (diamondsToDeduct > 0) {
                  const newDiamonds = Math.max(0, state.diamonds - diamondsToDeduct);
                  set({ diamonds: newDiamonds });
                }
              }
              
              quests[q.id] = {
                ...q,
                status: "archived",
                finalStatus: q.status === "completed" ? "completed" : "failed"
              };
            }
          });
        }

        // Автоматично архівуємо квести з минулих дат (якщо користувач пропустив кілька днів)
        // Спочатку позначаємо невиконані квести як failed
        Object.values(quests).forEach((q) => {
          if (
            q.plannedDate && // Тільки квести з датою (не постійні)
            q.plannedDate < todayKey && // Дата вже пройшла
            (q.status === "planned" || q.status === "active") // Невиконані квести
          ) {
            quests[q.id] = {
              ...q,
              status: "failed",
              executedAt: nowIso()
            };
          }
        });

        // Потім архівуємо всі failed/completed квести з минулих дат
        Object.values(quests).forEach((q) => {
          if (
            q.plannedDate && // Тільки квести з датою
            q.plannedDate < todayKey && // Дата вже пройшла
            (q.status === "completed" || q.status === "failed") // Виконані або провалені
          ) {
            // Застосовуємо покарання для провалених квестів перед архівуванням
            if (q.status === "failed") {
              const diamondsToDeduct = q.penaltyDiamonds || 0;
              if (diamondsToDeduct > 0) {
                const currentState = get();
                const newDiamonds = Math.max(0, currentState.diamonds - diamondsToDeduct);
                set({ diamonds: newDiamonds });
              }
            }
            
            quests[q.id] = {
              ...q,
              status: "archived",
              finalStatus: q.status === "completed" ? "completed" : "failed"
            };
          }
        });

        // Створюємо запис для сьогоднішнього дня, якщо його ще немає
        if (!days[todayKey]) {
          // Вибираємо випадкову тему дня
          const themes: DayTheme[] = [
            "hustle_mode",
            "zen_focus",
            "procrastinator_slayer",
            "night_owl",
            "momentum_boost",
            "mystic_vision"
          ];
          const randomTheme = themes[Math.floor(Math.random() * themes.length)];
          
          days[todayKey] = {
            id: `day-${todayKey}`,
            date: todayKey,
            status: "inactive",
            startStats: { ...defaultDailyStats },
            theme: randomTheme
          };
        }

        set({ days, quests });
      },

      // Старт дня після того, як користувач ввів свої стати
      startDayWithInitialStats: (initial, theme) => {
        const state = get();
        const dateKey = getDateKey();
        
        // v1.1: Спочатку синхронізуємо дні (завершуємо попередній день, архівуємо квести)
        get().syncDayForToday();
        
        // Отримуємо оновлений стан після syncDayForToday
        const updatedState = get();
        
        // Створюємо день, якщо його немає (для випадку, коли localStorage порожній)
        let today = updatedState.days[dateKey];
        if (!today) {
          today = {
            id: `day-${dateKey}`,
            date: dateKey,
            status: "inactive",
            startStats: { ...defaultDailyStats },
            theme: "hustle_mode"
          };
        }
        
        if (today.status === "active") return;

        const selectedTheme = theme || today.theme || "hustle_mode";
        const newDay: Day = {
          ...today,
          status: "active",
          startTime: nowIso(),
          startStats: { ...initial },
          theme: selectedTheme
        };

        // v1.1: Активуємо квести на сьогодні (якщо plannedDate === dateKey)
        const quests = { ...updatedState.quests };
        Object.values(quests).forEach((q) => {
          if (q.plannedDate === dateKey && q.status === "planned") {
            quests[q.id] = {
              ...q,
              status: "active",
              activeDate: dateKey
            };
          }
        });

        set({
          days: { ...updatedState.days, [dateKey]: newDay },
          currentStats: { ...initial }, // Стати оновлюються одразу при старті дня
          quests,
          timeMeta: {
            ...updatedState.timeMeta,
            lastActivityAt: Date.now()
          },
          lastDayStarted: dateKey
        });

        // Перевіряємо досягнення одразу після старту дня
        setTimeout(() => {
          checkAndUpdateAchievements(get, set);
        }, 0);
      },

      // ===== Квести =====
      createQuest: (input) => {
        const state = get();
        const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const dateKeyToday = getDateKey();
        // v1.1: plannedDate опціональна - якщо немає, квест постійний
        const isToday = input.plannedDate && input.plannedDate === dateKeyToday;
        const today = state.days[dateKeyToday];
        const quest: Quest = {
          id,
          title: input.title,
          description: input.description,
          category: input.category,
          plannedDate: input.plannedDate, // v1.1: може бути undefined для постійних квестів
          activeDate: isToday && today?.status === "active" ? dateKeyToday : undefined,
          // v1.1: Якщо немає plannedDate, квест завжди доступний (status = "active")
          status: !input.plannedDate ? "active" : (isToday && today?.status === "active" ? "active" : "planned"),
          rewards: input.rewards,
          penalties: input.penalties,
          penaltyDiamonds: input.penaltyDiamonds, // v1.1: покарання діамантами
          createdAt: nowIso()
        };

        set({
          quests: { ...state.quests, [id]: quest }
        });
      },

      completeQuest: (id) => {
        const state = get();
        const quest = state.quests[id];
        if (!quest || quest.status !== "active") return;

        const today = state.getToday();
        if (!today || today.status !== "active") return;

        // Застосовуємо винагороди
        const newStats = { ...state.currentStats };
        if (quest.rewards.stats) {
          Object.entries(quest.rewards.stats).forEach(([key, value]) => {
            if (typeof value === "number") {
              const statKey = key as keyof DailyStats;
              if (statKey === "money") {
                newStats.money += value;
              } else if (statKey === "sleepHours") {
                newStats.sleepHours = clampSleep(newStats.sleepHours + value);
              } else {
                newStats[statKey] = clamp(newStats[statKey] + value);
              }
            }
          });
        }

        // Додаємо досвід (бонус для головного квесту: 1.5x)
        const baseXp = quest.rewards.xp ?? 10;
        const xpGain = quest.isMainQuest ? Math.floor(baseXp * 1.5) : baseXp;
        const prevProfile = state.profile;
        const newXpTotal = prevProfile.xpTotal + xpGain;
        const newLevel = Math.floor(newXpTotal / 100); // Починаємо з рівня 0

        // Додаємо діаманти (бонус для головного квесту: 1.5x)
        const baseDiamonds = quest.rewards.diamonds ?? 0;
        const diamondsGain = quest.isMainQuest ? Math.floor(baseDiamonds * 1.5) : baseDiamonds;
        const newDiamonds = state.diamonds + diamondsGain;
        const newDiamondsEarnedTotal = state.diamondsEarnedTotal + diamondsGain;

        // Оновлюємо історію досвіду
        const todayKey = getDateKey();
        const xpHistory = [...prevProfile.xpHistory];
        const todayXpEntry = xpHistory.find((e) => e.date === todayKey);
        if (todayXpEntry) {
          todayXpEntry.xp += xpGain;
        } else {
          xpHistory.push({ date: todayKey, xp: xpGain });
        }

        const updatedQuest: Quest = {
          ...quest,
          status: "completed",
          executedAt: nowIso()
        };

        const newState = {
          currentStats: newStats,
          quests: { ...state.quests, [id]: updatedQuest },
          profile: {
            level: newLevel,
            xpTotal: newXpTotal,
            xpHistory: xpHistory.slice(-30) // Зберігаємо останні 30 днів
          },
          diamonds: newDiamonds,
          diamondsEarnedTotal: newDiamondsEarnedTotal
        };
        
        set(newState);
        
        // Перевіряємо досягнення після оновлення стану
        setTimeout(() => {
          checkAndUpdateAchievements(get, set);
        }, 0);
      },

      failQuest: (id, penaltyDiamonds = 0) => {
        const state = get();
        const quest = state.quests[id];
        if (!quest || (quest.status !== "active" && quest.status !== "planned"))
          return;

        const newStats = { ...state.currentStats };
        if (quest.penalties) {
          Object.entries(quest.penalties).forEach(([key, value]) => {
            if (typeof value === "number") {
              const statKey = key as keyof DailyStats;
              if (statKey === "money") {
                newStats.money -= value;
              } else if (statKey === "sleepHours") {
                newStats.sleepHours = clampSleep(newStats.sleepHours - value);
              } else {
                newStats[statKey] = clamp(newStats[statKey] - value);
              }
            }
          });
        }

        // v1.1: Покарання діамантами
        const diamondsToDeduct = penaltyDiamonds || quest.penaltyDiamonds || 0;
        const newDiamonds = Math.max(0, state.diamonds - diamondsToDeduct);

        const updatedQuest: Quest = {
          ...quest,
          status: "failed",
          executedAt: nowIso(),
          // Зберігаємо покарання діамантами для подальшого застосування при архівуванні
          penaltyDiamonds: diamondsToDeduct > 0 ? diamondsToDeduct : quest.penaltyDiamonds
        };

        set({
          currentStats: newStats,
          diamonds: newDiamonds,
          quests: { ...state.quests, [id]: updatedQuest }
        });
      },

      // v1.1: Виконання постійного квесту (одразу бонуси, не зникає)
      executeQuest: (id) => {
        const state = get();
        const quest = state.quests[id];
        if (!quest) return;

        // Застосовуємо винагороди
        const newStats = { ...state.currentStats };
        if (quest.rewards.stats) {
          Object.entries(quest.rewards.stats).forEach(([key, value]) => {
            if (typeof value === "number") {
              const statKey = key as keyof DailyStats;
              if (statKey === "money") {
                newStats.money += value;
              } else if (statKey === "sleepHours") {
                newStats.sleepHours = clampSleep(newStats.sleepHours + value);
              } else {
                newStats[statKey] = clamp(newStats[statKey] + value);
              }
            }
          });
        }

        // Додаємо досвід
        const xpGain = quest.rewards.xp ?? 10;
        const prevProfile = state.profile;
        const newXpTotal = prevProfile.xpTotal + xpGain;
        const newLevel = Math.floor(newXpTotal / 100);

        // Додаємо діаманти
        const diamondsGain = quest.rewards.diamonds ?? 0;
        const newDiamonds = state.diamonds + diamondsGain;
        const newDiamondsEarnedTotal = state.diamondsEarnedTotal + diamondsGain;

        // Оновлюємо історію досвіду
        const todayKey = getDateKey();
        const xpHistory = [...prevProfile.xpHistory];
        const todayXpEntry = xpHistory.find((e) => e.date === todayKey);
        if (todayXpEntry) {
          todayXpEntry.xp += xpGain;
        } else {
          xpHistory.push({ date: todayKey, xp: xpGain });
        }

        // v1.1: Квест не зникає, просто фіксуємо виконання
        const updatedQuest: Quest = {
          ...quest,
          executedAt: nowIso()
        };

        set({
          currentStats: newStats,
          quests: { ...state.quests, [id]: updatedQuest },
          profile: {
            level: newLevel,
            xpTotal: newXpTotal,
            xpHistory
          },
          diamonds: newDiamonds,
          diamondsEarnedTotal: newDiamondsEarnedTotal
        });

        setTimeout(() => {
          checkAndUpdateAchievements(get, set);
        }, 0);
      },

      // v1.1: Виконання майбутнього квесту завчасно
      completeQuestEarly: (id) => {
        const state = get();
        const quest = state.quests[id];
        if (!quest || !quest.plannedDate) return;

        const todayKey = getDateKey();
        // Перевіряємо, що квест дійсно майбутній
        if (quest.plannedDate <= todayKey) return;

        // Застосовуємо винагороди (як у executeQuest)
        const newStats = { ...state.currentStats };
        if (quest.rewards.stats) {
          Object.entries(quest.rewards.stats).forEach(([key, value]) => {
            if (typeof value === "number") {
              const statKey = key as keyof DailyStats;
              if (statKey === "money") {
                newStats.money += value;
              } else if (statKey === "sleepHours") {
                newStats.sleepHours = clampSleep(newStats.sleepHours + value);
              } else {
                newStats[statKey] = clamp(newStats[statKey] + value);
              }
            }
          });
        }

        const xpGain = quest.rewards.xp ?? 10;
        const prevProfile = state.profile;
        const newXpTotal = prevProfile.xpTotal + xpGain;
        const newLevel = Math.floor(newXpTotal / 100);

        const diamondsGain = quest.rewards.diamonds ?? 0;
        const newDiamonds = state.diamonds + diamondsGain;
        const newDiamondsEarnedTotal = state.diamondsEarnedTotal + diamondsGain;

        const xpHistory = [...prevProfile.xpHistory];
        const todayXpEntry = xpHistory.find((e) => e.date === todayKey);
        if (todayXpEntry) {
          todayXpEntry.xp += xpGain;
        } else {
          xpHistory.push({ date: todayKey, xp: xpGain });
        }

        // Фіксуємо виконання завчасно
        const updatedQuest: Quest = {
          ...quest,
          completedEarly: true,
          earlyCompletionDate: todayKey,
          executedAt: nowIso()
        };

        set({
          currentStats: newStats,
          quests: { ...state.quests, [id]: updatedQuest },
          profile: {
            level: newLevel,
            xpTotal: newXpTotal,
            xpHistory
          },
          diamonds: newDiamonds,
          diamondsEarnedTotal: newDiamondsEarnedTotal
        });

        setTimeout(() => {
          checkAndUpdateAchievements(get, set);
        }, 0);
      },

      archiveQuest: (id) => {
        // Видалено - архівування тепер автоматичне
        // Цей метод залишається для сумісності, але не використовується
      },

      // Встановити головний квест дня
      setMainQuest: (id) => {
        const state = get();
        const todayKey = getDateKey();
        const today = state.days[todayKey];
        if (!today || today.status !== "active") return;

        const quest = state.quests[id];
        if (!quest || quest.plannedDate !== todayKey || quest.status !== "active") return;

        // Знімаємо головний квест з інших квестів
        const quests = { ...state.quests };
        Object.values(quests).forEach((q) => {
          if (q.plannedDate === todayKey && q.id !== id) {
            quests[q.id] = { ...q, isMainQuest: false };
          }
        });

        // Встановлюємо новий головний квест
        quests[id] = { ...quest, isMainQuest: true };

        // Оновлюємо день
        const days = { ...state.days };
        days[todayKey] = { ...today, mainQuestId: id };

        set({ quests, days });
      },

      // Використати другий шанс за 10 діамантів (тільки один раз на день)
      useSecondChance: (id) => {
        const state = get();
        const quest = state.quests[id];
        if (!quest) return;
        if (quest.status !== "failed") return;
        if (state.diamonds < 10) return;

        const todayKey = getDateKey();
        const today = state.days[todayKey];
        if (!today || today.status !== "active") return;

        // Перевіряємо, чи вже використано другий шанс сьогодні
        if (today.secondChanceUsed) {
          return; // Вже використано сьогодні
        }

        const quests = { ...state.quests };
        quests[id] = {
          ...quest,
          status: "active",
          secondChanceUsed: true, // Позначаємо квест як такий, що використав другий шанс
          executedAt: undefined
        };

        // Позначаємо день як такий, що використав другий шанс
        const days = { ...state.days };
        days[todayKey] = {
          ...today,
          secondChanceUsed: true
        };

        set({
          quests,
          days,
          diamonds: state.diamonds - 10
        });
      },

      // ===== Планування =====
      activatePlannedForToday: () => {
        const state = get();
        const todayKey = getDateKey();
        const today = state.days[todayKey];
        if (!today || today.status !== "active") return;

        const quests = { ...state.quests };
        Object.values(quests).forEach((q) => {
          if (q.plannedDate === todayKey && q.status === "planned") {
            quests[q.id] = {
              ...q,
              status: "active",
              activeDate: todayKey
            };
          }
        });
        set({ quests });
      },

      // ===== Швидкі дії =====
      createQuickAction: (input) => {
        const state = get();
        const id = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const action: QuickAction = {
          id,
          name: input.name,
          description: input.description,
          effect: input.effect,
          createdAt: nowIso()
        };
        set({
          quickActions: { ...state.quickActions, [id]: action }
        });
      },

      updateQuickAction: (id, input) => {
        const state = get();
        const action = state.quickActions[id];
        if (!action) return;
        const updated: QuickAction = {
          ...action,
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.effect !== undefined && { effect: { ...action.effect, ...input.effect } })
        };
        set({
          quickActions: { ...state.quickActions, [id]: updated }
        });
      },

      deleteQuickAction: (id) => {
        const state = get();
        const { [id]: removed, ...rest } = state.quickActions;
        set({ quickActions: rest });
      },

      applyQuickAction: (id) => {
        const state = get();
        const action = state.quickActions[id];
        if (!action) return;
        
        // Застосовуємо ефект
        get().applyStatsDelta(action.effect);
        
        // v1.1: Зберігаємо в історію
        const todayKey = getDateKey();
        const historyEntry: QuickActionHistory = {
          id: `qah-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          quickActionId: id,
          quickActionName: action.name,
          date: todayKey,
          executedAt: nowIso(),
          effect: { ...action.effect }
        };
        
        set({
          quickActionHistory: [...state.quickActionHistory, historyEntry]
        });
      },

      getQuickActionHistory: () => {
        return get().quickActionHistory;
      },

      // ===== Магазин =====
      createShopItem: (input) => {
        const state = get();
        const id = `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const item: ShopItem = {
          id,
          name: input.name,
          description: input.description,
          cost: input.cost,
          effect: input.effect,
          narrativeAction: input.narrativeAction,
          createdAt: nowIso()
        };
        set({
          shopItems: { ...state.shopItems, [id]: item }
        });
      },

      updateShopItem: (id, input) => {
        const state = get();
        const item = state.shopItems[id];
        if (!item) return;
        const updated: ShopItem = {
          ...item,
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.cost !== undefined && { cost: input.cost }),
          ...(input.effect !== undefined && { effect: { ...item.effect, ...input.effect } }),
          ...(input.narrativeAction !== undefined && { narrativeAction: input.narrativeAction })
        };
        set({
          shopItems: { ...state.shopItems, [id]: updated }
        });
      },

      deleteShopItem: (id) => {
        const state = get();
        const { [id]: removed, ...rest } = state.shopItems;
        set({ shopItems: rest });
      },

      purchaseShopItem: (id) => {
        const state = get();
        const item = state.shopItems[id];
        if (!item) return;
        if (state.diamonds < item.cost) return;

        const newDiamonds = state.diamonds - item.cost;
        const newStats = { ...state.currentStats };
        if (item.effect) {
          Object.entries(item.effect).forEach(([key, value]) => {
            if (typeof value === "number") {
              const statKey = key as keyof DailyStats;
              if (statKey === "money") {
                newStats.money += value;
              } else if (statKey === "sleepHours") {
                newStats.sleepHours = clampSleep(newStats.sleepHours + value);
              } else {
                newStats[statKey] = clamp(newStats[statKey] + value);
              }
            }
          });
        }

        // Додаємо запис в історію покупок
        const purchaseRecord: PurchaseRecord = {
          id: `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          itemId: id,
          itemName: item.name,
          cost: item.cost,
          purchaseDate: nowIso()
        };

        set({
          diamonds: newDiamonds,
          currentStats: newStats,
          purchaseHistory: [...state.purchaseHistory, purchaseRecord]
        });
      },

      // ===== Застосування змін статів =====
      applyStatsDelta: (delta) => {
        const state = get();
        const newStats = { ...state.currentStats };
        Object.entries(delta).forEach(([key, value]) => {
          if (typeof value === "number") {
            const statKey = key as keyof DailyStats;
            if (statKey === "money") {
              newStats.money += value;
            } else if (statKey === "sleepHours") {
              newStats.sleepHours = clampSleep(newStats.sleepHours + value);
            } else {
              newStats[statKey] = clamp(newStats[statKey] + value);
            }
          }
        });
        set({ currentStats: newStats });
      },

      // v1.1: Ранкова рутина
      completeMorningRoutine: () => {
        const state = get();
        const todayKey = getDateKey();
        const today = state.days[todayKey];
        if (!today || today.status !== "active") return;

        // Дефолтні нагороди: +5 XP, +2 діаманти
        const xpGain = 5;
        const diamondsGain = 2;

        const prevProfile = state.profile;
        const newXpTotal = prevProfile.xpTotal + xpGain;
        const newLevel = Math.floor(newXpTotal / 100);

        const newDiamonds = state.diamonds + diamondsGain;
        const newDiamondsEarnedTotal = state.diamondsEarnedTotal + diamondsGain;

        const xpHistory = [...prevProfile.xpHistory];
        const todayXpEntry = xpHistory.find((e) => e.date === todayKey);
        if (todayXpEntry) {
          todayXpEntry.xp += xpGain;
        } else {
          xpHistory.push({ date: todayKey, xp: xpGain });
        }

        const updatedDay: Day = {
          ...today,
          morningRoutineCompleted: true,
          morningRoutineCompletedAt: nowIso()
        };

        set({
          days: { ...state.days, [todayKey]: updatedDay },
          profile: {
            level: newLevel,
            xpTotal: newXpTotal,
            xpHistory
          },
          diamonds: newDiamonds,
          diamondsEarnedTotal: newDiamondsEarnedTotal
        });

        setTimeout(() => {
          checkAndUpdateAchievements(get, set);
        }, 0);
      },

      // v1.1: Позначити час останнього збереження
      markSaved: () => {
        set({ lastSavedAt: nowIso() });
      },

      // Epic Quest: довгостроковий квест з етапами
      createEpicQuest: (input) => {
        const state = get();
        // v1.1: Якщо Epic Quest вже існує, ресетаємо його перед створенням нового
        if (state.epicQuest) {
          // Ресетаємо попередній Epic Quest
          set({ epicQuest: undefined });
        }

        const steps: EpicQuestStep[] = input.steps.map((step, index) => ({
          id: `step-${Date.now()}-${index}`,
          title: step.title,
          description: step.description,
          order: index + 1,
          completed: false
        }));

        const epicQuest: EpicQuest = {
          id: `epic-${Date.now()}`,
          title: input.title,
          description: input.description,
          steps,
          currentStepIndex: steps.length > 0 ? 0 : -1, // Перший етап активний
          createdAt: nowIso(),
          updatedAt: nowIso(),
          finalRewards: input.finalRewards
        };

        set({ epicQuest });
      },

      updateEpicQuest: (input) => {
        const state = get();
        if (!state.epicQuest) {
          console.warn("Epic Quest не існує. Використовуйте createEpicQuest для створення.");
          return;
        }

        const updated: EpicQuest = {
          ...state.epicQuest,
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          updatedAt: nowIso()
        };

        // Оновлюємо етапи, якщо вони надані
        if (input.steps) {
          const newSteps: EpicQuestStep[] = input.steps.map((step, index) => {
            const existingStep = state.epicQuest!.steps.find((s) => s.order === index + 1);
            return {
              id: existingStep?.id || `step-${Date.now()}-${index}`,
              title: step.title,
              description: step.description,
              order: index + 1,
              completed: existingStep?.completed || false,
              completedAt: existingStep?.completedAt
            };
          });
          updated.steps = newSteps;
          // Оновлюємо currentStepIndex
          const firstIncompleteIndex = newSteps.findIndex((s) => !s.completed);
          updated.currentStepIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : -1;
        }

        set({ epicQuest: updated });
      },

      completeEpicQuestStep: (stepId) => {
        const state = get();
        if (!state.epicQuest) return;

        const stepIndex = state.epicQuest.steps.findIndex((s) => s.id === stepId);
        if (stepIndex < 0) return;

        // Перевіряємо, чи це поточний активний етап
        if (stepIndex !== state.epicQuest.currentStepIndex) {
          console.warn("Можна виконати тільки поточний активний етап.");
          return;
        }

        const step = state.epicQuest.steps[stepIndex];
        if (step.completed) return;

        // Позначаємо етап як виконаний
        const updatedSteps = [...state.epicQuest.steps];
        updatedSteps[stepIndex] = {
          ...step,
          completed: true,
          completedAt: nowIso()
        };

        // Знаходимо наступний невиконаний етап
        const nextIncompleteIndex = updatedSteps.findIndex((s, idx) => idx > stepIndex && !s.completed);
        const newCurrentStepIndex = nextIncompleteIndex >= 0 ? nextIncompleteIndex : -1;

        const updatedEpicQuest: EpicQuest = {
          ...state.epicQuest,
          steps: updatedSteps,
          currentStepIndex: newCurrentStepIndex,
          updatedAt: nowIso()
        };

        // Якщо всі етапи виконано, надаємо фінальні винагороди
        if (newCurrentStepIndex === -1 && updatedEpicQuest.finalRewards) {
          const newStats = { ...state.currentStats };
          if (updatedEpicQuest.finalRewards.stats) {
            Object.entries(updatedEpicQuest.finalRewards.stats).forEach(([key, value]) => {
              if (typeof value === "number") {
                const statKey = key as keyof DailyStats;
                if (statKey === "money") {
                  newStats.money += value;
                } else if (statKey === "sleepHours") {
                  newStats.sleepHours = clampSleep(newStats.sleepHours + value);
                } else {
                  newStats[statKey] = clamp(newStats[statKey] + value);
                }
              }
            });
          }

          const xpGain = updatedEpicQuest.finalRewards.xp || 0;
          const diamondsGain = updatedEpicQuest.finalRewards.diamonds || 0;
          const prevProfile = state.profile;
          const newXpTotal = prevProfile.xpTotal + xpGain;
          const newLevel = Math.floor(newXpTotal / 100);

          const xpHistory = [...prevProfile.xpHistory];
          const todayKey = getDateKey();
          const todayXpEntry = xpHistory.find((e) => e.date === todayKey);
          if (todayXpEntry) {
            todayXpEntry.xp += xpGain;
          } else {
            xpHistory.push({ date: todayKey, xp: xpGain });
          }

          set({
            epicQuest: updatedEpicQuest,
            currentStats: newStats,
            profile: {
              level: newLevel,
              xpTotal: newXpTotal,
              xpHistory
            },
            diamonds: state.diamonds + diamondsGain,
            diamondsEarnedTotal: state.diamondsEarnedTotal + diamondsGain
          });

          setTimeout(() => {
            checkAndUpdateAchievements(get, set);
          }, 0);
        } else {
          set({ epicQuest: updatedEpicQuest });
        }
      },

      getEpicQuestProgress: () => {
        const state = get();
        if (!state.epicQuest || state.epicQuest.steps.length === 0) return 0;

        const completedCount = state.epicQuest.steps.filter((s) => s.completed).length;
        return Math.round((completedCount / state.epicQuest.steps.length) * 100);
      },

      resetEpicQuest: () => {
        set({ epicQuest: undefined });
      },

      // Habits: постійні дії без дати
      createHabit: (input) => {
        const state = get();
        const id = `habit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const habit: Habit = {
          id,
          name: input.name,
          description: input.description,
          effect: input.effect,
          createdAt: nowIso()
        };
        set({
          habits: { ...state.habits, [id]: habit }
        });
      },

      updateHabit: (id, input) => {
        const state = get();
        const habit = state.habits[id];
        if (!habit) return;
        const updated: Habit = {
          ...habit,
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.effect !== undefined && { effect: { ...habit.effect, ...input.effect } })
        };
        set({
          habits: { ...state.habits, [id]: updated }
        });
      },

      deleteHabit: (id) => {
        const state = get();
        const { [id]: removed, ...rest } = state.habits;
        set({ habits: rest });
      },

      executeHabit: (id) => {
        const state = get();
        const habit = state.habits[id];
        if (!habit) return;

        // Застосовуємо ефекти на стати
        const newStats = { ...state.currentStats };
        if (habit.effect) {
          Object.entries(habit.effect).forEach(([key, value]) => {
            if (typeof value === "number" && key !== "xp" && key !== "diamonds") {
              const statKey = key as keyof DailyStats;
              if (statKey === "money") {
                newStats.money += value;
              } else if (statKey === "sleepHours") {
                newStats.sleepHours = clampSleep(newStats.sleepHours + value);
              } else {
                newStats[statKey] = clamp(newStats[statKey] + value);
              }
            }
          });
        }

        // v1.1: Додаємо XP та діаманти (обмежено до 10)
        const xpGain = Math.min(10, Math.max(0, habit.effect.xp || 0));
        const diamondsGain = Math.min(10, Math.max(0, habit.effect.diamonds || 0));

        const prevProfile = state.profile;
        const newXpTotal = prevProfile.xpTotal + xpGain;
        const newLevel = Math.floor(newXpTotal / 100);

        const newDiamonds = state.diamonds + diamondsGain;
        const newDiamondsEarnedTotal = state.diamondsEarnedTotal + diamondsGain;

        const xpHistory = [...prevProfile.xpHistory];
        const todayKey = getDateKey();
        const todayXpEntry = xpHistory.find((e) => e.date === todayKey);
        if (todayXpEntry) {
          todayXpEntry.xp += xpGain;
        } else {
          xpHistory.push({ date: todayKey, xp: xpGain });
        }

        // Зберігаємо в історію
        const historyEntry: HabitHistory = {
          id: `hah-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          habitId: id,
          habitName: habit.name,
          date: todayKey,
          executedAt: nowIso(),
          effect: { ...habit.effect }
        };

        set({
          currentStats: newStats,
          habits: state.habits, // Habits не змінюються
          habitHistory: [...state.habitHistory, historyEntry],
          profile: {
            level: newLevel,
            xpTotal: newXpTotal,
            xpHistory
          },
          diamonds: newDiamonds,
          diamondsEarnedTotal: newDiamondsEarnedTotal
        });

        setTimeout(() => {
          checkAndUpdateAchievements(get, set);
        }, 0);
      },

      getHabitHistory: () => {
        return get().habitHistory;
      }
    }),
    {
      name: "game-life-store",
      version: 4, // v1.1: Додано quickActionHistory, lastSavedAt, нові поля квестів
      migrate: (persistedState: any, version: number) => {
        // Міграція з версії 1 до 2
        if (version < 2) {
          // Додаємо поля для досягнень та історії покупок
          if (!persistedState.achievements) {
            persistedState.achievements = {};
          }
          if (!persistedState.purchaseHistory) {
            persistedState.purchaseHistory = [];
          }
          if (!persistedState.lastDayStarted) {
            persistedState.lastDayStarted = null;
          }
        }

        // Міграція з версії 2 до 3
        if (version < 3) {
          // Додаємо поля для тем, головного квесту, другого шансу
          if (persistedState.days) {
            Object.keys(persistedState.days).forEach((dateKey) => {
              const day = persistedState.days[dateKey];
              if (!day.theme) day.theme = "hustle_mode";
              if (!day.mainQuestId) day.mainQuestId = undefined;
              if (!day.xpGained) day.xpGained = undefined;
              if (!day.diamondsEarned) day.diamondsEarned = undefined;
              if (!day.secondChanceUsed) day.secondChanceUsed = false;
            });
          }
          if (persistedState.quests) {
            Object.keys(persistedState.quests).forEach((questId) => {
              const quest = persistedState.quests[questId];
              if (!quest.isMainQuest) quest.isMainQuest = false;
              if (!quest.secondChanceUsed) quest.secondChanceUsed = false;
            });
          }
        }

        // Міграція з версії 3 до 4 (v1.1)
        if (version < 4) {
          // Додаємо архів швидких дій
          if (!persistedState.quickActionHistory) {
            persistedState.quickActionHistory = [];
          }
          // Додаємо час останнього збереження
          if (!persistedState.lastSavedAt) {
            persistedState.lastSavedAt = undefined;
          }
          // Оновлюємо дні: додаємо поля для ранкової рутини
          if (persistedState.days) {
            Object.keys(persistedState.days).forEach((dateKey) => {
              const day = persistedState.days[dateKey];
              if (!day.morningRoutineCompleted) day.morningRoutineCompleted = undefined;
              if (!day.morningRoutineCompletedAt) day.morningRoutineCompletedAt = undefined;
            });
          }
          // Оновлюємо квести: додаємо нові поля v1.1
          if (persistedState.quests) {
            Object.keys(persistedState.quests).forEach((questId) => {
              const quest = persistedState.quests[questId];
              // plannedDate тепер опціональна
              // penaltyDiamonds - нове поле
              if (!quest.penaltyDiamonds) quest.penaltyDiamonds = undefined;
              // completedEarly - нове поле
              if (!quest.completedEarly) quest.completedEarly = undefined;
              if (!quest.earlyCompletionDate) quest.earlyCompletionDate = undefined;
            });
          }
          // Додаємо Epic Quest
          if (!persistedState.epicQuest) {
            persistedState.epicQuest = undefined;
          }
          // Додаємо Habits
          if (!persistedState.habits) {
            persistedState.habits = {};
          }
          if (!persistedState.habitHistory) {
            persistedState.habitHistory = [];
          }
        }

        return persistedState;
      },
      // Partialize - зберігаємо тільки потрібні поля (без функцій)
      partialize: (state) => ({
        currentStats: state.currentStats,
        days: state.days,
        quests: state.quests,
        habits: state.habits, // v1.1: Звички
        habitHistory: state.habitHistory, // v1.1: Архів звичок
        quickActions: state.quickActions,
        quickActionHistory: state.quickActionHistory, // v1.1
        shopItems: state.shopItems,
        profile: state.profile,
        diamonds: state.diamonds,
        diamondsEarnedTotal: state.diamondsEarnedTotal,
        timeMeta: state.timeMeta,
        purchaseHistory: state.purchaseHistory,
        achievements: state.achievements,
        lastDayStarted: state.lastDayStarted,
        lastSavedAt: state.lastSavedAt, // v1.1
        epicQuest: state.epicQuest // Epic Quest
      })
    }
  )
);
