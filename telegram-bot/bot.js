import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import {
  linkUser,
  getUserHashByChatId,
  getChatIdByUserHash,
  getGameState,
  saveNotification
} from './database.js';
import { checkAndSendNotifications } from './notifications.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'game_life_bot';
const pwaUrl = process.env.PWA_URL || 'https://your-pwa-url.com';

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = new TelegramBot(token, { polling: true });

/**
 * Handle /start command with user_hash
 */
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userHash = match?.[1]; // Extract user_hash from /start <user_hash>

  if (!userHash) {
    bot.sendMessage(
      chatId,
      `👋 Привіт! Я бот для Game Life 1.1.\n\n` +
      `Для підключення перейдіть у PWA та натисніть кнопку "Підключити Telegram".\n\n` +
      `Після цього ви отримуватимете сповіщення про:\n` +
      `📝 Квести\n` +
      `🔄 Звички\n` +
      `⚔️ Epic Quests`
    );
    return;
  }

  try {
    // Link chat_id to user_hash
    const linked = await linkUser(chatId, userHash);
    
    if (linked) {
      bot.sendMessage(
        chatId,
        `✅ *Підключення успішне!*\n\n` +
        `Тепер ви будете отримувати сповіщення про:\n` +
        `📝 Квести та дедлайни\n` +
        `🔄 Нагадування про звички\n` +
        `⚔️ Прогрес Epic Quest\n\n` +
        `Відкрити PWA: [Game Life](${pwaUrl})`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🎮 Відкрити Game Life', url: pwaUrl }
            ]]
          }
        }
      );
      
      // Immediately check for pending notifications
      setTimeout(() => {
        checkAndSendNotifications(userHash, bot);
      }, 1000);
    } else {
      bot.sendMessage(chatId, '❌ Помилка підключення. Спробуйте ще раз.');
    }
  } catch (error) {
    console.error('Error in /start handler:', error);
    bot.sendMessage(chatId, '❌ Помилка сервера. Спробуйте пізніше.');
  }
});

/**
 * Handle /status command
 */
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const userHash = await getUserHashByChatId(chatId);

  if (!userHash) {
    bot.sendMessage(
      chatId,
      '❌ Ви не підключені. Використайте /start з вашим user_hash.'
    );
    return;
  }

  const gameState = await getGameState(userHash);
  
  if (!gameState || !gameState.game_state) {
    bot.sendMessage(
      chatId,
      '📊 *Статус*\n\n' +
      'Підключення: ✅\n' +
      'Дані гри: ⏳ Очікування синхронізації',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const state = gameState.game_state;
  const questsCount = Object.keys(state.quests || {}).length;
  const habitsCount = Object.keys(state.habits || {}).length;
  const epicQuest = state.epicQuest;
  const progress = epicQuest 
    ? Math.round((epicQuest.steps.filter(s => s.completed).length / epicQuest.steps.length) * 100)
    : 0;

  bot.sendMessage(
    chatId,
    `📊 *Статус Game Life*\n\n` +
    `Підключення: ✅\n` +
    `Квестів: ${questsCount}\n` +
    `Звичок: ${habitsCount}\n` +
    `Epic Quest: ${epicQuest ? `${progress}%` : 'Не створено'}\n` +
    `Останнє оновлення: ${gameState.last_saved_at ? new Date(gameState.last_saved_at).toLocaleString('uk-UA') : 'Немає'}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Відкрити PWA', url: pwaUrl }
        ]]
      }
    }
  );
});

/**
 * Handle /help command
 */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `📖 *Доступні команди:*\n\n` +
    `/start <user_hash> - Підключити бота\n` +
    `/status - Перевірити статус\n` +
    `/help - Показати цю довідку\n\n` +
    `*Сповіщення:*\n` +
    `Бот надсилає сповіщення про:\n` +
    `• Новий день та ранкову рутину\n` +
    `• Невиконані квести\n` +
    `• Прогрес Epic Quest\n` +
    `• Нагадування про звички`,
    { parse_mode: 'Markdown' }
  );
});

/**
 * Send notification to user
 */
export async function sendNotification(userHash, message, options = {}) {
  try {
    const chatId = await getChatIdByUserHash(userHash);
    
    if (!chatId) {
      console.warn(`No chat_id found for user_hash: ${userHash}`);
      return false;
    }

    const defaultOptions = {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Відкрити Game Life', url: pwaUrl }
        ]]
      },
      ...options
    };

    await bot.sendMessage(chatId, message, defaultOptions);
    
    // Log notification
    await saveNotification(userHash, options.type || 'general', message, new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error(`Error sending notification to ${userHash}:`, error);
    return false;
  }
}

/**
 * Format quest notification
 */
export function formatQuestNotification(quest) {
  const deadline = quest.plannedDate 
    ? `\n📅 *Дедлайн:* ${new Date(quest.plannedDate).toLocaleDateString('uk-UA')}`
    : '';
  
  const rewards = [];
  if (quest.rewards?.xp) rewards.push(`⭐ +${quest.rewards.xp} XP`);
  if (quest.rewards?.diamonds) rewards.push(`💎 +${quest.rewards.diamonds}`);
  
  const rewardsText = rewards.length > 0 ? `\n🎁 *Винагороди:* ${rewards.join(', ')}` : '';

  return `📝 *На тебе чекає квест:*\n\n` +
    `*${quest.title}*\n` +
    (quest.description ? `${quest.description}\n` : '') +
    deadline +
    rewardsText;
}

/**
 * Format Epic Quest progress notification
 */
export function formatEpicQuestNotification(epicQuest, progress) {
  const currentStep = epicQuest.currentStepIndex >= 0 
    ? epicQuest.steps[epicQuest.currentStepIndex]
    : null;

  if (epicQuest.currentStepIndex === -1) {
    return `🎉 *Epic Quest завершено!*\n\n` +
      `*${epicQuest.title}*\n\n` +
      `Всі етапи виконано! Вітаємо з досягненням! 🏆`;
  }

  return `⚔️ *Прогрес Epic Quest*\n\n` +
    `*${epicQuest.title}*\n\n` +
    `📊 Прогрес: *${progress}%*\n\n` +
    (currentStep 
      ? `📌 *Поточний етап:*\n${currentStep.title}${currentStep.description ? `\n${currentStep.description}` : ''}`
      : '');
}

/**
 * Format habit reminder
 */
export function formatHabitReminder(habit) {
  return `🔄 *Нагадування про звичку*\n\n` +
    `*${habit.name}*\n` +
    (habit.description ? `${habit.description}\n` : '') +
    `\nЧас виконати звичку! 💪`;
}

export { bot };
