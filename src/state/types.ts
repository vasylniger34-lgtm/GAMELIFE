// Базові типи доменної моделі Game Life

// 7 основних характеристик гравця (вводяться один раз на день)
export interface DailyStats {
  mood: number; // Настрій / Психічний стан (0-100)
  money: number; // Гроші на руках (USD, може бути від'ємним)
  energy: number; // Енергія (0-100)
  motivation: number; // Мотивація (0-100)
  stress: number; // Стрес (0-100)
  momentum: number; // Імпульс (0-100)
  sleepHours: number; // Години сну (0-12)
}

// Типи квестів (v1.1: прибрано "habit", habits тепер окрема система)
export type QuestCategory = "daily" | "main" | "side";

export type QuestStatus = "planned" | "active" | "completed" | "failed" | "archived";

// Квест: завдання, яке користувач створює вручну
// v1.1: Квести тепер постійні дії без дат, доступні завжди
export interface Quest {
  id: string;
  title: string;
  description?: string;
  category: QuestCategory;
  // Дата, для якої призначене завдання (формат YYYY-MM-DD) - опціональна для майбутніх квестів
  plannedDate?: string;
  // Коли завдання стало активним (для сьогоднішнього дня)
  activeDate?: string;
  status: QuestStatus;
  // Винагороди: зміна статів, досвід, діаманти
  rewards: {
    // Зміни статів (можуть бути від'ємними)
    stats?: Partial<DailyStats>;
    // Досвід за виконання
    xp?: number;
    // Діаманти (ігрова валюта)
    diamonds?: number;
  };
  // Штрафи за невиконання (від'ємні зміни статів)
  penalties?: Partial<DailyStats>;
  // Покарання діамантами за невиконання (v1.1)
  penaltyDiamonds?: number;
  createdAt: string;
  executedAt?: string;
  isMainQuest?: boolean; // Чи є це головним квестом дня
  secondChanceUsed?: boolean; // Чи використано другий шанс
  // v1.1: Чи виконано завчасно (для майбутніх квестів)
  completedEarly?: boolean;
  earlyCompletionDate?: string; // Дата фактичного виконання
}

// Статус дня
export type DayStatus = "inactive" | "active" | "finished";

// День: запис про один календарний день
export interface Day {
  id: string;
  date: string; // YYYY-MM-DD
  status: DayStatus;
  startTime?: string; // ISO timestamp
  endTime?: string; // ISO timestamp (автоматично при зміні дати)
  // Початкові показники на старті дня (введені користувачем)
  startStats: DailyStats;
  // Кінцеві показники після завершення дня (останні значення статів)
  endStats?: DailyStats;
  theme?: DayTheme; // Тема дня
  mainQuestId?: string; // ID головного квесту дня
  xpGained?: number; // XP отримано за день
  diamondsEarned?: number; // Діаманти отримано за день
  secondChanceUsed?: boolean; // Чи використано другий шанс сьогодні
  // v1.1: Ранкова рутина виконана
  morningRoutineCompleted?: boolean;
  morningRoutineCompletedAt?: string; // ISO timestamp
}

// Профіль гравця: рівень, досвід
export interface Profile {
  // Поточний рівень (обчислюється з xpTotal)
  level: number;
  // Сумарний досвід за весь час
  xpTotal: number;
  // Історія досвіду (для графіків)
  xpHistory: Array<{ date: string; xp: number }>;
}

// Швидка дія: миттєва дія, що змінює стати
export interface QuickAction {
  id: string;
  name: string;
  description?: string;
  // Зміни статів
  effect: Partial<DailyStats>;
  createdAt: string;
}

// Історія виконання швидких дій
export interface QuickActionHistory {
  id: string;
  quickActionId: string;
  quickActionName: string;
  date: string; // YYYY-MM-DD
  executedAt: string; // ISO timestamp
  effect: Partial<DailyStats>; // Які стати були змінені
}

// Habit: постійна дія без дати, виконується коли користувач натискає
export interface Habit {
  id: string;
  name: string;
  description?: string;
  // Ефекти на статистику (через StatSlider)
  effect: Partial<DailyStats> & {
    xp?: number; // Досвід
    diamonds?: number; // Діаманти
  };
  createdAt: string;
}

// Історія виконання habits
export interface HabitHistory {
  id: string;
  habitId: string;
  habitName: string;
  date: string; // YYYY-MM-DD
  executedAt: string; // ISO timestamp
  effect: Habit["effect"]; // Які стати були змінені
}

// Товар в магазині
export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  cost: number; // Вартість в діамантах
  // Ефект: зміна статів або описова дія (наприклад, "піти на вечірку")
  effect?: Partial<DailyStats>;
  narrativeAction?: string; // Текстова дія (наприклад, "Піти на вечірку")
  createdAt: string;
}

// Метадані часу (для захисту від маніпуляцій)
export interface TimeMeta {
  // Останній відомий timestamp
  lastTimestamp: number;
  // Час останньої активності
  lastActivityAt: number;
  // Прапорець, що час міг бути відмотаний назад
  timeSuspicious: boolean;
}

// Агрегована статистика
export interface AppStatsAggregated {
  totalDays: number;
  completedQuests: number;
  failedQuests: number;
  diamondsEarned: number; // Загальна кількість діамантів, зароблених за весь час
  xpGained: number; // Загальний досвід
}

// Історія покупок в магазині
export interface PurchaseRecord {
  id: string;
  itemId: string;
  itemName: string;
  cost: number; // Діаманти
  purchaseDate: string; // ISO timestamp
}

// Досягнення
export type AchievementId = 
  | "foundation_laid"
  | "quest_initiate"
  | "sleep_streak"
  | "stress_slayer"
  | "money_maker"
  | "momentum_master"
  | "daily_dominator"
  | "habit_hero"
  | "diamond_collector"
  | "ultimate_gl";

// Тема дня
export type DayTheme = 
  | "hustle_mode"
  | "zen_focus"
  | "procrastinator_slayer"
  | "night_owl"
  | "momentum_boost"
  | "mystic_vision";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji або символ
  unlocked: boolean;
  unlockedAt?: string; // ISO timestamp
  progress: number; // Поточний прогрес (0-100)
  target: number; // Цільове значення
  current: number; // Поточне значення
}

// Epic Quest: довгостроковий квест з послідовними етапами
export interface EpicQuestStep {
  id: string;
  title: string;
  description?: string;
  order: number; // Порядок етапу (1, 2, 3...)
  completed: boolean; // Чи виконано етап
  completedAt?: string; // ISO timestamp виконання
}

export interface EpicQuest {
  id: string;
  title: string;
  description?: string;
  steps: EpicQuestStep[]; // Послідовні етапи
  currentStepIndex: number; // Індекс поточного активного етапу (-1 якщо всі виконано)
  createdAt: string;
  updatedAt: string;
  // Винагороди за завершення всього Epic Quest
  finalRewards?: {
    stats?: Partial<DailyStats>;
    xp?: number;
    diamonds?: number;
  };
}
