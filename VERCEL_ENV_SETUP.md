# Настройка переменных окружения в Vercel

## Обязательные переменные для Production

### База данных
```
DATABASE_URL=postgresql://postgres.lmhvwogsjqefxiwbsdwn:gtAc6RRYGiOxjZfQ@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://lmhvwogsjqefxiwbsdwn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTI0OTIsImV4cCI6MjA3Nzk4ODQ5Mn0.Nel3deL4tpLJE05FaBaEDW26wIp0x-s2-6devJIMafg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxMjQ5MiwiZXhwIjoyMDc3OTg4NDkyfQ.77sEg84n8tUS1F3hdvGoxnUDuYp4C_ySNsIQ-vFHmVc
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=uploads
```

### Аутентификация
```
NEXTAUTH_URL=https://cleaning-control.vercel.app
NEXTAUTH_SECRET=f8a3d9c7e2b1f4a6d8c9e3b7f1a5d2c8e4b9f6a3d7c1e5b8f2a6d9c3e7b4f1a5
JWT_SECRET=f8a3d9c7e2b1f4a6d8c9e3b7f1a5d2c8e4b9f6a3d7c1e5b8f2a6d9c3e7b4f1a5
```

### Telegram Bot
```
TELEGRAM_BOT_TOKEN=8515686731:AAHeyubpmX7FV1U4w4v9Dyo9EqDLMp3Icfs
TELEGRAM_BOT_USERNAME=cleaning_control_test
```

### URL приложения
```
NEXT_PUBLIC_BASE_URL=https://cleaning-control.vercel.app
```

## Важно!

1. **NEXT_PUBLIC_BASE_URL** - используется для формирования ссылок в Telegram уведомлениях
2. **TELEGRAM_BOT_USERNAME** - имя бота БЕЗ символа @
3. Все переменные с префиксом `NEXT_PUBLIC_` доступны на клиенте
4. После изменения переменных нужно сделать redeploy проекта

## Проверка

После деплоя проверьте:
1. Логин работает
2. Telegram уведомления содержат правильные ссылки
3. Ссылки ведут на https://cleaning-control.vercel.app
