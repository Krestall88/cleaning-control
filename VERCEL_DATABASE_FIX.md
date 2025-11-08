# Исправление ошибки 42P05 на Vercel

## Проблема
Ошибка `prepared statement "sX" already exists` (PostgreSQL код 42P05) возникает при использовании Prisma с Supabase Transaction Pooler на Vercel.

## Причина
- Supabase Transaction Pooler работает в режиме транзакций
- Prisma по умолчанию использует prepared statements
- В Transaction mode каждый запрос — новая транзакция, но Prisma пытается переиспользовать prepared statements → конфликт

## Решение

### 1. Обновлена конфигурация Prisma
Файл `prisma/schema.prisma` теперь содержит `directUrl` для поддержки pgbouncer режима.

### 2. Настройка DATABASE_URL в Vercel

**ВАЖНО:** В переменных окружения Vercel установите DATABASE_URL с параметром `?pgbouncer=true`:

```
DATABASE_URL="postgresql://postgres.XXXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### Где взять правильный URL:
1. Откройте Supabase Dashboard → Project Settings → Database
2. Найдите раздел **Connection Pooling** (не Direct Connection!)
3. Выберите режим **Transaction**
4. Скопируйте Connection string
5. **Добавьте в конец**: `?pgbouncer=true`

#### Пример правильного URL:
```
postgresql://postgres.lmhvwogsjqefxiwbsdwn:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### Правильный URL:
#### postgresql://postgres.lmhvwogsjqefxiwbsdwn:mxK1vH91xsQ7HmI7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

### 3. НЕ ИСПОЛЬЗУЙТЕ эти параметры:
❌ `connection_limit=1` — создает проблемы с prepared statements  
❌ `pool_timeout=15` — не нужен для Transaction mode  
❌ Direct Connection URL (порт 5432) — только для миграций

### 4. Настройка в Vercel Dashboard

1. Перейдите в **Settings** → **Environment Variables**
2. Найдите переменную `DATABASE_URL`
3. Обновите значение на URL с `?pgbouncer=true`
4. Сохраните изменения
5. **Redeploy** проект (не нужно делать git push)

### 5. Проверка после деплоя

✅ Логин должен работать  
✅ Данные дашборда должны загружаться  
✅ В логах не должно быть ошибок 42P05  

## Дополнительно

### Если нужны миграции на Vercel
Создайте отдельную переменную `DIRECT_URL` с Direct Connection (порт 5432):
```
DIRECT_URL="postgresql://postgres.XXXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

И обновите `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Локальная разработка
Для локальной разработки можно использовать Direct Connection (без pgbouncer):
```
DATABASE_URL="postgresql://postgres.XXXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

## Что было исправлено в коде

1. ✅ `prisma/schema.prisma` — добавлен `directUrl` для поддержки pgbouncer
2. ✅ `src/lib/prisma.ts` — оптимизировано логирование для production
3. ✅ Все API routes уже используют единый `prisma` клиент из `@/lib/prisma`

## Следующие шаги

1. Обновите `DATABASE_URL` в Vercel с параметром `?pgbouncer=true`
2. Redeploy проект
3. Проверьте работу логина и загрузку данных
