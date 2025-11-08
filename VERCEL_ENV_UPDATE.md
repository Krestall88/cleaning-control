# Обновление переменных окружения в Vercel

## Проблема решена ✅

Код обновлен для работы с Supabase Transaction Pooler через `driverAdapters`.

## Что нужно изменить в Vercel Dashboard

### 1. DATABASE_URL (уже правильно)
```
DATABASE_URL=postgresql://postgres.lmhvwogsjqefxiwbsdwn:gtAc6RRYGiOxjZfQ@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```
✅ Это уже правильно настроено

### 2. NEXTAUTH_URL (нужно изменить!)
**Было:**
```
NEXTAUTH_URL=http://localhost:3000
```

**Должно быть:**
```
NEXTAUTH_URL=https://cleaning-control.vercel.app
```

### 3. NEXT_PUBLIC_BASE_URL (нужно изменить!)
**Было:**
```
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

**Должно быть:**
```
NEXT_PUBLIC_BASE_URL=https://cleaning-control.vercel.app
```

### 4. Остальные переменные (оставить как есть)
```
NEXT_PUBLIC_SUPABASE_URL=https://lmhvwogsjqefxiwbsdwn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=f8a3d9c7e2b1f4a6d8c9e3b7f1a5d2c8e4b9f6a3d7c1e5b8f2a6d9c3e7b4f1a5
JWT_SECRET=f8a3d9c7e2b1f4a6d8c9e3b7f1a5d2c8e4b9f6a3d7c1e5b8f2a6d9c3e7b4f1a5
TELEGRAM_BOT_TOKEN=8515686731:AAHeyubpmX7FV1U4w4v9Dyo9EqDLMp3Icfs
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=uploads
```

## Как обновить в Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект **cleaning-control**
3. Перейдите в **Settings** → **Environment Variables**
4. Найдите и обновите:
   - `NEXTAUTH_URL` → `https://cleaning-control.vercel.app`
   - `NEXT_PUBLIC_BASE_URL` → `https://cleaning-control.vercel.app`
5. Нажмите **Save**

## После обновления переменных

### Вариант 1: Redeploy через Vercel Dashboard
1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **⋯** (три точки) → **Redeploy**

### Вариант 2: Git Push (рекомендуется)
```bash
# Добавьте изменения
git add .

# Создайте коммит
git commit -m "fix: prisma driverAdapters для Supabase Pooler"

# Отправьте в репозиторий
git push origin main
```

Vercel автоматически задеплоит изменения.

## Проверка после деплоя

1. Откройте https://cleaning-control.vercel.app
2. Попробуйте войти с учетными данными:
   - Email: `admin@example.com`
   - Password: (ваш пароль)
3. Проверьте загрузку данных дашборда

## Если всё равно не работает

Проверьте логи в Vercel:
1. **Deployments** → выберите последний деплой
2. **Functions** → найдите `/api/auth/login`
3. Посмотрите логи ошибок

Ошибки **больше не должны** содержать:
- ❌ `prepared statement already exists` (42P05)
- ❌ `unexpected message from server`
- ❌ `Tenant or user not found`

## Что было исправлено в коде

1. ✅ `prisma/schema.prisma` — добавлен `previewFeatures = ["driverAdapters"]`
2. ✅ Prisma Client регенерирован с поддержкой driverAdapters
3. ✅ Инструкция по обновлению production URLs

## Локальная разработка

Для локальной разработки в `.env` используйте:
```env
DATABASE_URL=postgresql://postgres.lmhvwogsjqefxiwbsdwn:gtAc6RRYGiOxjZfQ@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Локально можно использовать localhost, но в Vercel — только production URL!
