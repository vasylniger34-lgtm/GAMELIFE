// Push Notifications Service

const notificationMessages = [
  "Не забудь про головний квест, чемпіоне!",
  "Діаманти чекають, не витрачай час.",
  "Перевір квести та піднімай рівень!",
  "Стрес низький? Тисни сьогодні сильніше!",
  "Твій майбутній я спостерігає... врази їх.",
  "XP голодний. Годуй його квестами.",
  "Малі перемоги сьогодні = великі перемоги завтра.",
  "Ще один квест може змінити твій день!",
  "Залишайся дисциплінованим, заробляй діаманти, завершуй проекти.",
  "Прокрастинація — ворог. Атакуй зараз!"
];

const morningMessage = "Доброго ранку! Час взяти життя під контроль!";

let notificationPermission: NotificationPermission = "default";
let notificationInterval: number | null = null;

// Запит дозволу на сповіщення
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    notificationPermission = "granted";
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    return permission === "granted";
  }

  return false;
};

// Перевірка, чи можна надсилати сповіщення (не 00:00-08:00)
const canSendNotification = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour < 24; // Не надсилаємо з 00:00 до 08:00
};

// Надсилання сповіщення
const sendNotification = (message: string, title: string = "Game Life") => {
  if (notificationPermission !== "granted") return;
  if (!canSendNotification()) return;

  try {
    new Notification(title, {
      body: message,
      icon: "/icon-192x192.png", // Якщо є іконка
      badge: "/icon-192x192.png",
      tag: "game-life-notification",
      requireInteraction: false
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// Надсилання ранкового привітання
export const sendMorningGreeting = () => {
  if (notificationPermission !== "granted") return;
  if (!canSendNotification()) return;

  sendNotification(morningMessage, "Game Life - Доброго ранку!");
};

// Запуск періодичних сповіщень (кожні 1-2 години)
export const startNotificationSchedule = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  // Надсилаємо сповіщення кожні 1.5 години (90 хвилин)
  notificationInterval = window.setInterval(() => {
    if (canSendNotification()) {
      const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
      sendNotification(randomMessage);
    }
  }, 90 * 60 * 1000); // 90 хвилин
};

// Зупинка періодичних сповіщень
export const stopNotificationSchedule = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};

// Ініціалізація сповіщень (викликається при завантаженні додатку)
export const initNotifications = async () => {
  // Запитуємо дозвіл при першому відвідуванні
  await requestNotificationPermission();

  // Запускаємо розклад сповіщень
  startNotificationSchedule();

  // Надсилаємо ранкове привітання, якщо це ранок
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 12) {
    sendMorningGreeting();
  }
};
