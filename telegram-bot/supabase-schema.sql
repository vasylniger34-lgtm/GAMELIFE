-- Supabase Database Schema for Game Life Telegram Bot

-- Telegram users table (links chat_id to user_hash)
CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id TEXT PRIMARY KEY,
  user_hash TEXT UNIQUE NOT NULL,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User game states table
CREATE TABLE IF NOT EXISTS user_game_states (
  user_hash TEXT PRIMARY KEY,
  game_state JSONB NOT NULL,
  last_saved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications log table
CREATE TABLE IF NOT EXISTS notifications_log (
  id SERIAL PRIMARY KEY,
  user_hash TEXT NOT NULL,
  notification_type TEXT,
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_hash ON telegram_users(user_hash);
CREATE INDEX IF NOT EXISTS idx_game_states_hash ON user_game_states(user_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_hash ON notifications_log(user_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications_log(sent_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_telegram_users_updated_at BEFORE UPDATE ON telegram_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_states_updated_at BEFORE UPDATE ON user_game_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
