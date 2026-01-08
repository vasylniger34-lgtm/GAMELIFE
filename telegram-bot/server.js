import express from 'express';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import { checkAndSendNotifications, triggerManualNotification } from './notifications.js';
import { bot } from './bot.js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const PWA_URL = process.env.PWA_URL || 'https://your-pwa-url.com';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for PWA
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Generate user_hash for PWA
 * POST /api/generate-hash
 */
app.post('/api/generate-hash', async (req, res) => {
  try {
    // Generate unique hash
    const userHash = crypto.randomBytes(16).toString('hex');
    
    // Create Telegram deep link
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'game_life_bot';
    const telegramLink = `https://t.me/${botUsername}?start=${userHash}`;
    
    res.json({
      success: true,
      user_hash: userHash,
      telegram_link: telegramLink
    });
  } catch (error) {
    console.error('Error generating hash:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Sync game state from PWA
 * POST /api/sync-state
 */
app.post('/api/sync-state', async (req, res) => {
  try {
    const { user_hash, game_state } = req.body;
    
    if (!user_hash || !game_state) {
      return res.status(400).json({ success: false, error: 'user_hash and game_state are required' });
    }
    
    // Save game state
    const { saveGameState } = await import('./database.js');
    const saved = await saveGameState(user_hash, game_state);
    
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to save game state' });
    }
    
    // Check and send notifications
    setTimeout(() => {
      checkAndSendNotifications(user_hash, bot);
    }, 1000);
    
    res.json({ success: true, message: 'Game state synced successfully' });
  } catch (error) {
    console.error('Error syncing state:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get game state (for PWA sync)
 * GET /api/get-state?user_hash=...
 */
app.get('/api/get-state', async (req, res) => {
  try {
    const { user_hash } = req.query;
    
    if (!user_hash) {
      return res.status(400).json({ success: false, error: 'user_hash is required' });
    }
    
    const { getGameState } = await import('./database.js');
    const gameState = await getGameState(user_hash);
    
    if (!gameState) {
      return res.status(404).json({ success: false, error: 'Game state not found' });
    }
    
    res.json({ success: true, game_state: gameState.game_state, last_saved_at: gameState.last_saved_at });
  } catch (error) {
    console.error('Error getting state:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Manual notification trigger
 * POST /api/send-notification
 */
app.post('/api/send-notification', async (req, res) => {
  try {
    const { user_hash, type, data } = req.body;
    
    if (!user_hash || !type) {
      return res.status(400).json({ success: false, error: 'user_hash and type are required' });
    }
    
    const sent = await triggerManualNotification(user_hash, type, data);
    
    if (!sent) {
      return res.status(500).json({ success: false, error: 'Failed to send notification' });
    }
    
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get connection status
 * GET /api/connection-status?user_hash=...
 */
app.get('/api/connection-status', async (req, res) => {
  try {
    const { user_hash } = req.query;
    
    if (!user_hash) {
      return res.status(400).json({ success: false, error: 'user_hash is required' });
    }
    
    const { getChatIdByUserHash } = await import('./database.js');
    const chatId = await getChatIdByUserHash(user_hash);
    
    res.json({
      success: true,
      connected: !!chatId,
      chat_id: chatId || null
    });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Telegram Bot: @${process.env.TELEGRAM_BOT_USERNAME || 'game_life_bot'}`);
      console.log(`🌐 PWA URL: ${PWA_URL}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
