-- Создание таблицы для хранения ID сегментов витражей
-- Эта таблица хранит индивидуальные ID для каждого сегмента витража размещенного на плане

-- Удаляем таблицу если она существует
DROP TABLE IF EXISTS vitrage_segment_ids CASCADE;

-- Создаем таблицу vitrage_segment_ids
CREATE TABLE vitrage_segment_ids (
  -- Основные поля
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Связь с размещенным витражом
  placed_vitrage_id UUID NOT NULL REFERENCES placed_vitrages(id) ON DELETE CASCADE,

  -- Идентификатор сегмента в формате "segment-{row}-{col}"
  segment_key VARCHAR(50) NOT NULL,

  -- ID компоненты сегмента (8 полей)
  id_object VARCHAR(100),
  id_corpus VARCHAR(100),
  id_section VARCHAR(100),
  id_floor VARCHAR(100),
  id_apartment VARCHAR(100),
  id_vitrage_number VARCHAR(100),
  id_vitrage_name VARCHAR(100),
  id_vitrage_section VARCHAR(100),

  -- Полный сгенерированный ID сегмента
  full_segment_id VARCHAR(500) GENERATED ALWAYS AS (
    COALESCE(id_object, '') ||
    CASE WHEN id_corpus IS NOT NULL AND id_corpus != '' THEN '-' || id_corpus ELSE '' END ||
    CASE WHEN id_section IS NOT NULL AND id_section != '' THEN '-' || id_section ELSE '' END ||
    CASE WHEN id_floor IS NOT NULL AND id_floor != '' THEN '-' || id_floor ELSE '' END ||
    CASE WHEN id_apartment IS NOT NULL AND id_apartment != '' THEN '-' || id_apartment ELSE '' END ||
    CASE WHEN id_vitrage_number IS NOT NULL AND id_vitrage_number != '' THEN '-' || id_vitrage_number ELSE '' END ||
    CASE WHEN id_vitrage_name IS NOT NULL AND id_vitrage_name != '' THEN '-' || id_vitrage_name ELSE '' END ||
    CASE WHEN id_vitrage_section IS NOT NULL AND id_vitrage_section != '' THEN '-' || id_vitrage_section ELSE '' END
  ) STORED,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Уникальный constraint: один segment_key для одного placed_vitrage
  CONSTRAINT unique_segment_per_vitrage UNIQUE(placed_vitrage_id, segment_key)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_vitrage_segment_ids_placed_vitrage ON vitrage_segment_ids(placed_vitrage_id);
CREATE INDEX idx_vitrage_segment_ids_segment_key ON vitrage_segment_ids(segment_key);
CREATE INDEX idx_vitrage_segment_ids_full_id ON vitrage_segment_ids(full_segment_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_vitrage_segment_ids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at
CREATE TRIGGER update_vitrage_segment_ids_updated_at_trigger
BEFORE UPDATE ON vitrage_segment_ids
FOR EACH ROW
EXECUTE FUNCTION update_vitrage_segment_ids_updated_at();

-- RLS политики
ALTER TABLE vitrage_segment_ids ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (все пользователи могут читать)
CREATE POLICY "Allow read access to all users" ON vitrage_segment_ids
  FOR SELECT USING (true);

-- Политика для вставки (все пользователи могут создавать)
CREATE POLICY "Allow insert for all users" ON vitrage_segment_ids
  FOR INSERT WITH CHECK (true);

-- Политика для обновления (все пользователи могут обновлять)
CREATE POLICY "Allow update for all users" ON vitrage_segment_ids
  FOR UPDATE USING (true) WITH CHECK (true);

-- Политика для удаления (все пользователи могут удалять)
CREATE POLICY "Allow delete for all users" ON vitrage_segment_ids
  FOR DELETE USING (true);

-- Комментарии к таблице и колонкам
COMMENT ON TABLE vitrage_segment_ids IS 'Таблица для хранения индивидуальных ID для каждого сегмента размещенного витража';
COMMENT ON COLUMN vitrage_segment_ids.placed_vitrage_id IS 'Ссылка на размещенный витраж';
COMMENT ON COLUMN vitrage_segment_ids.segment_key IS 'Ключ сегмента в формате segment-{row}-{col}';
COMMENT ON COLUMN vitrage_segment_ids.full_segment_id IS 'Полный сгенерированный ID сегмента';
