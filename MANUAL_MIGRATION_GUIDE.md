# Инструкция по применению миграции для мануала в Supabase

## Шаг 1: Применить SQL миграцию

1. Откройте Supabase Dashboard для проекта `cleaning_control`
2. Перейдите в раздел **SQL Editor**
3. Скопируйте содержимое файла `prisma/migrations/add_manual_tables.sql`
4. Вставьте в SQL Editor и нажмите **Run**

Это создаст две таблицы:
- `manual_sections` — разделы мануала
- `manual_screenshots` — скриншоты мануала

## Шаг 2: Заполнить таблицы данными

После применения миграции нужно заполнить таблицы контентом:

```bash
cd c:\Users\Тайм\Documents\cleaning_control
npx tsx scripts/seed-manual.ts
```

Этот скрипт:
- Прочитает все `.md` файлы из папки `docs/`
- Создаст записи в таблице `manual_sections`
- Создаст записи в таблице `manual_screenshots`

## Шаг 3: Проверить результат

После выполнения seed-скрипта проверьте в Supabase:

```sql
-- Проверить разделы
SELECT id, slug, title, "order" FROM manual_sections ORDER BY "order";

-- Проверить скриншоты
SELECT id, number, filename, description FROM manual_screenshots ORDER BY number;
```

## Шаг 4: Проверить API

После деплоя на Vercel проверьте эндпоинты:

- `GET /api/manual/sections` — должен вернуть список разделов
- `GET /api/manual/sections/{slug}` — должен вернуть конкретный раздел
- `GET /api/manual/screenshots` — должен вернуть список скриншотов

## Примечания

- Миграция безопасна и использует `IF NOT EXISTS`, можно запускать повторно
- SQL fallback в API роутах позволяет работать даже если Prisma делегат не сгенерирован
- Все роуты работают в Node.js runtime для совместимости с Prisma
