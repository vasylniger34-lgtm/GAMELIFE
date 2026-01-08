# Deployment Guide - Game Life Telegram Bot

## Швидкий старт

### 1. Налаштування Telegram Bot

1. Створіть бота через [@BotFather](https://t.me/BotFather)
2. Отримайте токен бота
3. Встановіть username для бота (наприклад: `game_life_bot`)

### 2. Налаштування Supabase (опціонально)

1. Створіть проект на [Supabase](https://supabase.com)
2. Перейдіть в SQL Editor
3. Виконайте SQL з файлу `supabase-schema.sql`
4. Отримайте URL та API ключ з Settings > API

### 3. Налаштування змінних оточення

Створіть файл `.env`:

```env
TELEGRAM_BOT_TOKEN=8380537709:AAGpG4lcFwtLPMNVvQKjO4rwqjuOu1wYEl8
TELEGRAM_BOT_USERNAME=your_bot_username
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
PWA_URL=https://your-pwa-url.com
PORT=3000
NODE_ENV=production
```

### 4. Встановлення залежностей

```bash
cd telegram-bot
npm install
```

### 5. Локальне тестування

```bash
npm run dev
```

## Розгортання на Vercel

### Варіант 1: Vercel CLI

1. Встановіть Vercel CLI:
```bash
npm i -g vercel
```

2. Увійдіть:
```bash
vercel login
```

3. Розгорніть:
```bash
cd telegram-bot
vercel
```

4. Додайте змінні оточення в Vercel Dashboard:
   - Settings > Environment Variables
   - Додайте всі змінні з `.env`

### Варіант 2: GitHub Integration

1. Завантажте код на GitHub
2. Підключіть репозиторій до Vercel
3. Додайте змінні оточення в налаштуваннях проекту
4. Vercel автоматично розгорне проект

## Розгортання на Netlify

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

2. Створіть serverless function в `netlify/functions/server.js`
3. Додайте змінні оточення в Netlify Dashboard

## Налаштування PWA

Додайте в `.env` PWA:
```env
VITE_TELEGRAM_BOT_API_URL=https://your-bot-url.vercel.app
```

Або в `vite.config.ts`:
```typescript
define: {
  'import.meta.env.VITE_TELEGRAM_BOT_API_URL': JSON.stringify('https://your-bot-url.vercel.app')
}
```

## Перевірка роботи

1. Відкрийте PWA
2. Перейдіть в Profile > Telegram Bot
3. Натисніть "Підключити Telegram"
4. Перейдіть за посиланням в Telegram
5. Натисніть `/start` в боті
6. Перевірте статус підключення

## Troubleshooting

### Бот не відповідає
- Перевірте `TELEGRAM_BOT_TOKEN`
- Перевірте, що бот запущений (webhook або polling)

### Помилки бази даних
- Перевірте `SUPABASE_URL` та `SUPABASE_KEY`
- Переконайтеся, що таблиці створені (виконайте `supabase-schema.sql`)

### PWA не підключається
- Перевірте `VITE_TELEGRAM_BOT_API_URL` в PWA
- Перевірте CORS налаштування на сервері

## Моніторинг

Для production рекомендується:
- Логування помилок (Sentry, LogRocket)
- Моніторинг uptime (UptimeRobot)
- Аналітика використання (Telegram Bot Analytics)
