# Исправление проблем с Supabase Storage и Telegram

## Проблема
Фотографии не загружаются, Telegram не привязывается, несмотря на правильные переменные окружения.

## Решение

### 1. Настройка Supabase Storage (КРИТИЧНО!)

#### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на https://app.supabase.com
2. Выберите проект `lmhvwogsjqefxiwbsdwn`

#### Шаг 2: Создайте bucket (если еще не создан)
1. Перейдите в **Storage** → **Buckets**
2. Нажмите **New bucket**
3. Название: `uploads`
4. **ВАЖНО:** Включите **Public bucket** (переключатель должен быть ON)
5. Нажмите **Create bucket**

#### Шаг 3: Настройте политики доступа
1. Перейдите в **SQL Editor** (боковое меню)
2. Нажмите **New query**
3. Скопируйте и выполните SQL из файла `supabase-storage-policies.sql`:

```sql
-- Удаляем старые политики
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role all" ON storage.objects;

-- Политика для загрузки
CREATE POLICY "Allow all uploads to uploads bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

-- Политика для чтения
CREATE POLICY "Allow public read from uploads bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Политика для обновления
CREATE POLICY "Allow all updates to uploads bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- Политика для удаления
CREATE POLICY "Allow all deletes from uploads bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads');
```

4. Нажмите **Run** (или F5)
5. Убедитесь, что запрос выполнился без ошибок

#### Шаг 4: Проверьте настройки bucket
1. Вернитесь в **Storage** → **Buckets**
2. Нажмите на bucket `uploads`
3. Перейдите в **Settings** (вкладка справа)
4. Убедитесь, что:
   - **Public bucket**: ON (включено)
   - **File size limit**: 10 MB или больше
   - **Allowed MIME types**: оставьте пустым (разрешить все) или добавьте `image/*`

### 2. Проверка переменных окружения в Vercel

Откройте [Vercel Dashboard](https://vercel.com) → ваш проект → **Settings** → **Environment Variables**

Убедитесь, что все переменные добавлены **для всех окружений** (Production, Preview, Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://lmhvwogsjqefxiwbsdwn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTI0OTIsImV4cCI6MjA3Nzk4ODQ5Mn0.Nel3deL4tpLJE05FaBaEDW26wIp0x-s2-6devJIMafg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxMjQ5MiwiZXhwIjoyMDc3OTg4NDkyfQ.77sEg84n8tUS1F3hdvGoxnUDuYp4C_ySNsIQ-vFHmVc
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=uploads
TELEGRAM_BOT_USERNAME=ваш_бот_username
```

**После добавления переменных сделайте Redeploy!**

### 3. Локальная настройка (.env файл)

Убедитесь, что ваш `.env` файл содержит:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://lmhvwogsjqefxiwbsdwn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTI0OTIsImV4cCI6MjA3Nzk4ODQ5Mn0.Nel3deL4tpLJE05FaBaEDW26wIp0x-s2-6devJIMafg"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxMjQ5MiwiZXhwIjoyMDc3OTg4NDkyfQ.77sEg84n8tUS1F3hdvGoxnUDuYp4C_ySNsIQ-vFHmVc"
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="uploads"

# Telegram
TELEGRAM_BOT_TOKEN="8515686731:AAHeyubpmX7FV1U4w4v9Dyo9EqDLMp3Icfs"
TELEGRAM_BOT_USERNAME="ваш_реальный_username"
```

### 4. Возврат заданий в работу

Теперь скрипт работает:

```bash
npm run reset-completed-tasks
```

Или альтернативная команда:

```bash
npm run reset-tasks
```

### 5. Тестирование

#### Локально:
```bash
npm run dev
```

1. Войдите как менеджер
2. Откройте задание
3. Завершите с фото
4. Проверьте консоль браузера (F12) на ошибки
5. Проверьте, что фото появилось в фотоотчетах

#### На Vercel:
1. Сделайте Redeploy после добавления переменных
2. Дождитесь успешной сборки
3. Протестируйте загрузку фото
4. Проверьте логи в Vercel Dashboard → Functions → Logs

### 6. Отладка проблем

#### Фото не загружается - проверьте:

1. **Консоль браузера (F12)**:
   - Есть ли ошибки при загрузке?
   - Какой статус ответа от `/api/upload`?

2. **Логи Vercel**:
   - Перейдите в Functions → Logs
   - Найдите запросы к `/api/upload`
   - Посмотрите на ошибки

3. **Supabase Storage**:
   - Откройте Storage → uploads
   - Проверьте, появляются ли файлы в папке `photos`
   - Если файлы есть, но не отображаются - проблема в политиках доступа

4. **Политики доступа**:
   - Выполните проверочный запрос в SQL Editor:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage';
   ```
   - Должно быть 4 политики для bucket 'uploads'

#### Telegram не привязывается - проверьте:

1. **Username бота**:
   - Откройте Telegram
   - Найдите вашего бота
   - Проверьте username (без @)
   - Добавьте его в `TELEGRAM_BOT_USERNAME`

2. **Код привязки**:
   - Код действителен 15 минут
   - Генерируйте новый код если истек

3. **Бот запущен**:
   - Проверьте, что бот отвечает на команды
   - Отправьте `/start` боту

### 7. Частые ошибки

#### "Supabase URL или Service Role Key не настроены"
- Проверьте `.env` файл
- Перезапустите dev сервер
- На Vercel: проверьте переменные и сделайте Redeploy

#### "Policy violation" или "403 Forbidden"
- Политики доступа не настроены
- Выполните SQL из `supabase-storage-policies.sql`
- Убедитесь, что bucket PUBLIC

#### "Bucket not found"
- Создайте bucket `uploads` в Supabase Storage
- Проверьте название (должно быть точно `uploads`)

#### Фото загружается, но не отображается
- Bucket должен быть PUBLIC
- Проверьте политику для SELECT
- Откройте URL фото в браузере напрямую

---

## Контрольный чек-лист

- [ ] Bucket `uploads` создан в Supabase
- [ ] Bucket настроен как PUBLIC
- [ ] SQL политики выполнены
- [ ] Все переменные добавлены в Vercel
- [ ] Сделан Redeploy на Vercel
- [ ] Переменные добавлены в локальный `.env`
- [ ] `TELEGRAM_BOT_USERNAME` указан правильно
- [ ] Скрипт `npm run reset-completed-tasks` работает
- [ ] Тест загрузки фото прошел успешно
- [ ] Telegram привязка работает

---

## Если ничего не помогло

1. Проверьте логи в реальном времени:
   ```bash
   # Локально
   npm run dev
   # Смотрите терминал
   ```

2. Откройте консоль браузера (F12) → Network
   - Найдите запрос к `/api/upload`
   - Посмотрите Request/Response
   - Скопируйте ошибку

3. Проверьте Supabase Dashboard → Logs
   - Storage logs
   - API logs

4. Попробуйте загрузить файл вручную через Supabase UI:
   - Storage → uploads → Upload file
   - Если не работает - проблема в настройках Supabase
