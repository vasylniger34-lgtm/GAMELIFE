import { getGameState, getChatIdByUserHash } from './database.js';
import { sendNotification, formatQuestNotification, formatEpicQuestNotification, formatHabitReminder } from './bot.js';

/**
 * Check and send notifications for a user
 */
export async function checkAndSendNotifications(userHash, bot) {
  try {
    const gameStateData = await getGameState(userHash);
    
    if (!gameStateData || !gameStateData.game_state) {
      console.log(`No game state found for user: ${userHash}`);
      return;
    }

    const state = gameStateData.game_state;
    const lastSavedAt = gameStateData.last_saved_at;
    
    // Check for new day / morning routine
    await checkMorningRoutine(state, lastSavedAt, userHash);
    
    // Check for pending quests
    await checkPendingQuests(state, userHash);
    
    // Check Epic Quest progress
    await checkEpicQuestProgress(state, userHash);
    
    // Check habits reminders (optional - can be triggered manually)
    // await checkHabitsReminders(state, userHash);
    
  } catch (error) {
    console.error(`Error checking notifications for ${userHash}:`, error);
  }
}

/**
 * Check if it's a new day and send morning routine notification
 */
async function checkMorningRoutine(state, lastSavedAt, userHash) {
  if (!lastSavedAt) return;
  
  const today = new Date().toISOString().split('T')[0];
  const lastSavedDate = new Date(lastSavedAt).toISOString().split('T')[0];
  
  // If last saved was yesterday or earlier, it's a new day
  if (lastSavedDate < today) {
    const todayKey = today;
    const todayData = state.days?.[todayKey];
    
    // Check if morning routine not completed
    if (todayData && !todayData.morningRoutineCompleted) {
      await sendNotification(
        userHash,
        `🌅 *Ранкова рутина*\n\n` +
        `Першим ділом:\n` +
        `• Випий стакан води 💧\n` +
        `• Відіжмись 10 разів 💪\n` +
        `• Почисти зуби 🦷\n\n` +
        `Виконай рутину та отримай бонуси!`,
        { type: 'morning_routine' }
      );
    }
  }
}

/**
 * Check for pending/overdue quests
 */
async function checkPendingQuests(state, userHash) {
  const quests = state.quests || {};
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  for (const quest of Object.values(quests)) {
    // Skip completed/failed/archived quests
    if (quest.status === 'completed' || quest.status === 'failed' || quest.status === 'archived') {
      continue;
    }
    
    // Check planned quests with deadline
    if (quest.plannedDate) {
      const deadline = new Date(quest.plannedDate);
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
      
      // Send notification if deadline is today and quest is not completed
      if (quest.plannedDate === today && quest.status !== 'completed') {
        await sendNotification(
          userHash,
          formatQuestNotification(quest),
          { type: 'quest_deadline_today' }
        );
      }
      
      // Send notification if deadline passed (overdue)
      if (deadline < now && quest.status !== 'completed' && quest.status !== 'failed') {
        await sendNotification(
          userHash,
          `⏰ *Квест прострочено!*\n\n` + formatQuestNotification(quest) + `\n\n⚠️ Дедлайн пройшов!`,
          { type: 'quest_overdue' }
        );
      }
    }
    
    // Check permanent quests (no date) - remind once per day
    if (!quest.plannedDate && quest.status === 'active') {
      // This can be triggered manually or on schedule
    }
  }
}

/**
 * Check Epic Quest progress and send notifications on milestones
 */
async function checkEpicQuestProgress(state, userHash) {
  const epicQuest = state.epicQuest;
  
  if (!epicQuest) return;
  
  const completedSteps = epicQuest.steps.filter(s => s.completed).length;
  const totalSteps = epicQuest.steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  
  // Send notification on milestone (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100];
  const lastProgress = epicQuest.lastNotifiedProgress || 0;
  
  for (const milestone of milestones) {
    if (progress >= milestone && lastProgress < milestone) {
      await sendNotification(
        userHash,
        formatEpicQuestNotification(epicQuest, progress),
        { type: 'epic_quest_milestone' }
      );
      
      // Update last notified progress (would need to save this in state)
      break;
    }
  }
  
  // Send notification when Epic Quest is completed
  if (epicQuest.currentStepIndex === -1 && !epicQuest.completedNotified) {
    await sendNotification(
      userHash,
      formatEpicQuestNotification(epicQuest, 100),
      { type: 'epic_quest_completed' }
    );
  }
}

/**
 * Manual notification trigger (called from API)
 */
export async function triggerManualNotification(userHash, type, data) {
  try {
    let message = '';
    
    switch (type) {
      case 'quest':
        message = formatQuestNotification(data);
        break;
      case 'epic_quest':
        const progress = Math.round((data.steps.filter(s => s.completed).length / data.steps.length) * 100);
        message = formatEpicQuestNotification(data, progress);
        break;
      case 'habit':
        message = formatHabitReminder(data);
        break;
      default:
        message = data.message || '🔔 Сповіщення з Game Life';
    }
    
    await sendNotification(userHash, message, { type });
    return true;
  } catch (error) {
    console.error(`Error triggering manual notification:`, error);
    return false;
  }
}
