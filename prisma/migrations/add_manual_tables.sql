-- Создание таблиц для встроенного мануала

-- Таблица разделов мануала
CREATE TABLE IF NOT EXISTS manual_sections (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  content TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Таблица скриншотов мануала
CREATE TABLE IF NOT EXISTS manual_screenshots (
  id TEXT PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  description TEXT NOT NULL,
  alt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_manual_sections_order ON manual_sections("order");
CREATE INDEX IF NOT EXISTS idx_manual_sections_slug ON manual_sections(slug);
CREATE INDEX IF NOT EXISTS idx_manual_screenshots_number ON manual_screenshots(number);

-- Комментарии к таблицам
COMMENT ON TABLE manual_sections IS 'Разделы встроенного руководства пользователя';
COMMENT ON TABLE manual_screenshots IS 'Скриншоты для встроенного руководства пользователя';
