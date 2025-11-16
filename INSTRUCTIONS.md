# Инструкции по настройке после исправления

## Что было исправлено

### 1. ✅ Загрузка фотографий в Supabase Storage
**Проблема:** Фотографии сохранялись локально и не отображались в фотоотчетах.  
**Решение:** Интегрирован Supabase Storage для хранения всех фотографий.

### 2. ✅ Привязка Telegram ID
**Проблема:** Telegram ID не сохранялся, уведомления не приходили.  
**Решение:** Добавлена поддержка `TELEGRAM_BOT_USERNAME` в переменных окружения.

---

## Шаги для настройки

### Шаг 1: Обновите .env файл

Добавьте следующие переменные в ваш `.env` файл:

```env
# ==============================================
# SUPABASE STORAGE
# ==============================================
NEXT_PUBLIC_SUPABASE_URL="https://lmhvwogsjqefxiwbsdwn.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTI0OTIsImV4cCI6MjA3Nzk4ODQ5Mn0.Nel3deL4tpLJE05FaBaEDW26wIp0x-s2-6devJIMafg"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaHZ3b2dzanFlZnhpd2JzZHduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQxMjQ5MiwiZXhwIjoyMDc3OTg4NDkyfQ.77sEg84n8tUS1F3hdvGoxnUDuYp4C_ySNsIQ-vFHmVc"
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="uploads"

# ==============================================
# TELEGRAM BOT
# ==============================================
TELEGRAM_BOT_TOKEN="8515686731:AAHeyubpmX7FV1U4w4v9Dyo9EqDLMp3Icfs"
# ВАЖНО: Добавьте username вашего бота (без @)
TELEGRAM_BOT_USERNAME="ваш_бот_username"
```

**❗ Замените `ваш_бот_username` на реальный username вашего Telegram бота!**

### Шаг 2: Настройте Supabase Storage

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите проект `lmhvwogsjqefxiwbsdwn`
3. Перейдите в **Storage** → **Buckets**
4. Создайте bucket с именем `uploads` (если его нет)
5. Настройте политики доступа (см. `SUPABASE_SETUP.md`)

### Шаг 3: Верните задания в работу

Чтобы заново завершить задания с фотографиями, выполните:

```bash
npm run reset-completed-tasks
```

Этот скрипт:
- Вернет все завершенные задания в статус "Новая"
- Удалит старые фотоотчеты (которые не сохранились)
- Очистит данные о завершении

### Шаг 4: Перезапустите приложение

```bash
npm run dev
```

### Шаг 5: Проверьте работу

#### Проверка загрузки фото:
1. Войдите как менеджер
2. Откройте любое задание
3. Завершите задание с загрузкой фото
4. Проверьте:
   - ✅ Фото загрузилось без ошибок
   - ✅ Фото отображается в фотоотчетах
   - ✅ URL фото начинается с `https://lmhvwogsjqefxiwbsdwn.supabase.co/storage/...`

#### Проверка Telegram привязки:
1. Откройте профиль пользователя
2. Нажмите "Привязать Telegram"
3. Скопируйте код привязки
4. Отправьте боту команду `/bind КОД`
5. Проверьте:
   - ✅ Бот ответил подтверждением
   - ✅ В профиле отображается привязанный Telegram
   - ✅ Приходят уведомления о новых задачах

---

## Для деплоя на Vercel

Добавьте все переменные окружения в настройках проекта Vercel:

1. Откройте проект в [Vercel Dashboard](https://vercel.com)
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
   - `TELEGRAM_BOT_USERNAME`
4. Сделайте redeploy проекта

---

## Troubleshooting

### Ошибка "Supabase URL или Service Role Key не настроены"
- Проверьте `.env` файл
- Убедитесь, что переменные добавлены без кавычек
- Перезапустите dev сервер

### Фото не загружается
- Проверьте, что bucket `uploads` создан в Supabase
- Проверьте политики доступа в Storage
- Посмотрите логи в консоли браузера (F12)

### Telegram не привязывается
- Добавьте `TELEGRAM_BOT_USERNAME` в `.env`
- Проверьте, что бот запущен
- Убедитесь, что код не истек (15 минут)

### Фото не отображается в фотоотчетах
- Проверьте, что задание завершено со статусом "COMPLETED"
- Откройте раздел "Фотоотчеты" в меню
- Проверьте фильтры (объект, дата)

---

## Дополнительная информация

Подробная документация:
- `SUPABASE_SETUP.md` - настройка Supabase Storage
- `TELEGRAM_NOTIFICATIONS_SETUP.md` - настройка Telegram уведомлений
- `TELEGRAM_DEBUG_GUIDE.md` - отладка Telegram бота

---

## Контакты для поддержки

Если возникли проблемы:
1. Проверьте логи в консоли браузера (F12)
2. Проверьте логи сервера в терминале
3. Посмотрите документацию в папке проекта
