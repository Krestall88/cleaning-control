# Обновление локального .env для работы со скриптами

## Проблема
Скрипты не могут подключиться к базе данных локально.

## Решение

Откройте файл `.env` и обновите `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres.lmhvwogsjqefxiwbsdwn:gtAc6RRYGiOxjZfQ@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Это тот же URL, что и в Vercel, он будет работать и локально.

## После обновления

Запустите скрипт генерации реалистичных данных:

```bash
npx tsx scripts/seed-realistic-full.ts
```
