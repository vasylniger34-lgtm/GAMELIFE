# Game Life 1.1 - Telegram Bot

Telegram Bot для сповіщень про квести, звички та Epic Quests в Game Life PWA.

## Функціонал

- 🔗 Підключення PWA до Telegram через унікальний `user_hash`
- 📝 Сповіщення про квести та дедлайни
- 🔄 Нагадування про звички
- ⚔️ Прогрес Epic Quest
- 🌅 Ранкова рутина
- 💾 Синхронізація стану гри з сервером

## Встановлення

1. Встановіть залежності:
```bash
npm install
```

2. Створіть файл `.env` на основі `.env.example`:
```bash
cp .env.example .env
```

3. Заповніть `.env`:
- `TELEGRAM_BOT_TOKEN` - токен бота (вже вказано)
- `TELEGRAM_BOT_USERNAME` - username бота (без @)
- `SUPABASE_URL` та `SUPABASE_KEY` - для збереження даних (опціонально)
- `PWA_URL` - URL вашого PWA

## Налаштування Supabase (опціонально)

Якщо використовуєте Supabase, створіть таблиці:

```sql
-- Telegram users
CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id TEXT PRIMARY KEY,
  user_hash TEXT UNIQUE NOT NULL,
  linked_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game states
CREATE TABLE IF NOT EXISTS user_game_states (
  user_hash TEXT PRIMARY KEY,
  game_state JSONB NOT NULL,
  last_saved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications log
CREATE TABLE IF NOT EXISTS notifications_log (
  id SERIAL PRIMARY KEY,
  user_hash TEXT NOT NULL,
  notification_type TEXT,
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telegram_users_hash ON telegram_users(user_hash);
CREATE INDEX IF NOT EXISTS idx_game_states_hash ON user_game_states(user_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_hash ON notifications_log(user_hash);
```

## Запуск

### Локально
```bash
npm run dev
```

### Production (Vercel/Netlify)
Налаштуйте `vercel.json` або `netlify.toml` для serverless функцій.

## API Endpoints

- `POST /api/generate-hash` - Генерація user_hash та Telegram посилання
- `POST /api/sync-state` - Синхронізація стану гри
- `GET /api/get-state` - Отримання стану гри
- `POST /api/send-notification` - Ручна відправка сповіщення
- `GET /api/connection-status` - Статус підключення
- `GET /health` - Health check

## Інтеграція з PWA

Додайте в PWA кнопку "Підключити Telegram" яка:

1. Викликає `POST /api/generate-hash`
2. Отримує `telegram_link`
3. Відкриває посилання в Telegram
4. Після підключення синхронізує стан через `POST /api/sync-state`

## Розгортання

### Vercel
1. Встановіть Vercel CLI: `npm i -g vercel`
2. Запустіть: `vercel`
3. Додайте змінні оточення в Vercel Dashboard

### Netlify
1. Створіть `netlify.toml`:
```toml
[build]
  command = "npm install"
  functions = "functions"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

## Логування

Всі помилки логуються в консоль. Для production використовуйте сервіси типу Sentry.

## Масштабованість

Код написаний з урахуванням майбутнього масштабування:
- Підтримка множинних користувачів
- Асинхронна обробка сповіщень
- Можливість додавання черги сповіщень (Bull/BullMQ)
