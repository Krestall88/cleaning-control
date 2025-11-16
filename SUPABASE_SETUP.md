# Настройка Supabase Storage

## Проблема
Фотографии не сохранялись при завершении заданий, так как использовалось локальное хранилище вместо Supabase Storage.

## Решение
Интегрирован Supabase Storage для хранения всех загружаемых файлов (фотографий, вложений).

## Настройка

### 1. Создайте bucket в Supabase

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в раздел **Storage**
3. Создайте новый bucket с именем `uploads`
4. Настройте политики доступа:

```sql
-- Политика для загрузки (authenticated users)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Политика для чтения (public access)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Политика для удаления (authenticated users)
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
```

### 2. Настройте переменные окружения

Добавьте в файл `.env`:

```env
# ==============================================
# SUPABASE STORAGE
# ==============================================
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="uploads"
```

**Где найти ключи:**
- Откройте ваш проект в Supabase Dashboard
- Перейдите в **Settings** → **API**
- Скопируйте:
  - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Telegram Bot Username

Добавьте в `.env` username вашего Telegram бота (без @):

```env
TELEGRAM_BOT_USERNAME="your_bot_username"
```

Это необходимо для корректной работы привязки Telegram аккаунтов.

## Что было исправлено

### 1. Создан Supabase клиент (`src/lib/supabase.ts`)
- Функция `uploadToSupabase()` для загрузки файлов
- Функция `deleteFromSupabase()` для удаления файлов
- Автоматическая генерация уникальных имен файлов
- Поддержка как File, так и Buffer

### 2. Обновлены API endpoints

**`/api/upload`** - загрузка фотографий:
- ✅ Теперь использует Supabase Storage вместо локального хранилища
- ✅ Возвращает публичный URL из Supabase

**`/api/photos/upload`** - загрузка фотоотчетов:
- ✅ Загружает файлы в Supabase Storage
- ✅ Создает записи в базе данных с URL из Supabase

**`/api/reporting/tasks/[id]/attachments`** - вложения к задачам:
- ✅ Загружает файлы в Supabase Storage
- ✅ Сохраняет публичные URL в базе данных

### 3. Telegram привязка
- ✅ Добавлена поддержка `TELEGRAM_BOT_USERNAME`
- ✅ Исправлена роль `DEPUTY_ADMIN` в проверках доступа

## Возврат заданий в работу

Для возврата завершенных заданий в статус "в работе" (чтобы заново завершить их с фото):

```bash
npm run reset-completed-tasks
```

Этот скрипт:
- Сбрасывает статус всех завершенных задач на `NEW`
- Удаляет связанные фотоотчеты
- Удаляет комментарии к задачам
- Очищает данные о завершении

## Проверка работы

1. Войдите в систему как менеджер
2. Откройте задание
3. Загрузите фотографию при завершении
4. Проверьте, что:
   - Фото загрузилось без ошибок
   - Фото отображается в фотоотчетах
   - URL фото начинается с `https://...supabase.co/storage/...`

## Важно для Vercel

При деплое на Vercel убедитесь, что все переменные окружения добавлены в настройках проекта:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `TELEGRAM_BOT_USERNAME`

## Troubleshooting

### Ошибка "Supabase URL или Service Role Key не настроены"
- Проверьте, что переменные окружения добавлены в `.env`
- Перезапустите dev сервер: `npm run dev`

### Фото не загружается
- Проверьте политики доступа в Supabase Storage
- Убедитесь, что bucket `uploads` создан
- Проверьте логи в консоли браузера и сервера

### Telegram не привязывается
- Добавьте `TELEGRAM_BOT_USERNAME` в `.env`
- Проверьте, что бот запущен и отвечает на команды
- Убедитесь, что код привязки не истек (действителен 15 минут)
