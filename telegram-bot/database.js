import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Using in-memory storage.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// In-memory fallback storage (for development/testing)
const memoryStorage = {
  users: new Map(), // user_hash -> { chat_id, gameState, lastSavedAt }
  chatToUser: new Map(), // chat_id -> user_hash
};

/**
 * Initialize database (check connection)
 */
export async function initDatabase() {
  if (!supabase) {
    console.log('📦 Using in-memory storage (no Supabase configured)');
    return;
  }

  try {
    // Test connection by querying a table
    const { error } = await supabase.from('telegram_users').select('count').limit(1);
    if (error && error.code === '42P01') {
      console.warn('⚠️  Database tables not found. Please run supabase-schema.sql first.');
    } else {
      console.log('✅ Database connected');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

/**
 * Link Telegram chat_id to user_hash
 */
export async function linkUser(chatId, userHash) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('telegram_users')
        .upsert({
          chat_id: chatId.toString(),
          user_hash: userHash,
          linked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'chat_id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error linking user:', error);
      return false;
    }
  } else {
    // In-memory fallback
    memoryStorage.chatToUser.set(chatId.toString(), userHash);
    if (!memoryStorage.users.has(userHash)) {
      memoryStorage.users.set(userHash, { chat_id: chatId.toString(), gameState: null, lastSavedAt: null });
    } else {
      const user = memoryStorage.users.get(userHash);
      user.chat_id = chatId.toString();
    }
    return true;
  }
}

/**
 * Get user_hash by chat_id
 */
export async function getUserHashByChatId(chatId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('user_hash')
        .eq('chat_id', chatId.toString())
        .single();

      if (error) throw error;
      return data?.user_hash || null;
    } catch (error) {
      console.error('Error getting user hash:', error);
      return null;
    }
  } else {
    return memoryStorage.chatToUser.get(chatId.toString()) || null;
  }
}

/**
 * Get chat_id by user_hash
 */
export async function getChatIdByUserHash(userHash) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('chat_id')
        .eq('user_hash', userHash)
        .single();

      if (error) throw error;
      return data?.chat_id || null;
    } catch (error) {
      console.error('Error getting chat id:', error);
      return null;
    }
  } else {
    const user = memoryStorage.users.get(userHash);
    return user?.chat_id || null;
  }
}

/**
 * Save game state for user
 */
export async function saveGameState(userHash, gameState) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('user_game_states')
        .upsert({
          user_hash: userHash,
          game_state: gameState,
          last_saved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_hash' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  } else {
    // In-memory fallback
    if (!memoryStorage.users.has(userHash)) {
      memoryStorage.users.set(userHash, { chat_id: null, gameState: null, lastSavedAt: null });
    }
    const user = memoryStorage.users.get(userHash);
    user.gameState = gameState;
    user.lastSavedAt = new Date().toISOString();
    return true;
  }
}

/**
 * Get game state for user
 */
export async function getGameState(userHash) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_game_states')
        .select('game_state, last_saved_at')
        .eq('user_hash', userHash)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  } else {
    const user = memoryStorage.users.get(userHash);
    return user ? { game_state: user.gameState, last_saved_at: user.lastSavedAt } : null;
  }
}

/**
 * Save notification log
 */
export async function saveNotification(userHash, type, message, sentAt) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('notifications_log')
        .insert({
          user_hash: userHash,
          notification_type: type,
          message: message,
          sent_at: sentAt || new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving notification:', error);
      return false;
    }
  } else {
    // In-memory fallback (optional)
    return true;
  }
}
