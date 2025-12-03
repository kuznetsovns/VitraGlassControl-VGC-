-- Создание таблицы для размещенных витражей с ID и дефектами
-- Эта таблица связывает витражи из спецификации с планами этажей и хранит их ID характеристики

-- Удаляем таблицу если она существует
DROP TABLE IF EXISTS placed_vitrages CASCADE;

-- Создаем таблицу placed_vitrages
CREATE TABLE placed_vitrages (
  -- Основные поля
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Связь с объектом и планом этажа
  object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE SET NULL,

  -- Ссылка на витраж из спецификации
  vitrage_id VARCHAR(255) NOT NULL, -- ID витража из типовых витражей
  vitrage_name VARCHAR(255) NOT NULL, -- Название витража (В-01, В-02 и т.д.)
  vitrage_data JSONB, -- Полные данные витража (размеры, сегменты и т.д.)

  -- Позиция на плане этажа
  position_x DECIMAL(10,2),
  position_y DECIMAL(10,2),
  rotation INTEGER DEFAULT 0, -- 0, 90, 180, 270 градусов
  scale DECIMAL(5,3) DEFAULT 1.0, -- Масштаб витража на плане

  -- ID характеристики (8 компонентов)
  id_object VARCHAR(100), -- Объект (Зил18, Примавера14)
  id_corpus VARCHAR(100), -- Корпус (А, Б, 1, 2)
  id_section VARCHAR(100), -- Секция (1, 2, 3)
  id_floor VARCHAR(100), -- Этаж (1, 2, 3)
  id_apartment VARCHAR(100), -- Квартира (101, 102, 201)
  id_vitrage_number VARCHAR(100), -- Номер витража (1, 2, 3)
  id_vitrage_name VARCHAR(100), -- Название витража (В1, Окно, Дверь)
  id_vitrage_section VARCHAR(100), -- Секция витража (A, B, 1)

  -- Полный сгенерированный ID
  full_id VARCHAR(500) GENERATED ALWAYS AS (
    COALESCE(id_object, '') ||
    CASE WHEN id_corpus IS NOT NULL AND id_corpus != '' THEN '-' || id_corpus ELSE '' END ||
    CASE WHEN id_section IS NOT NULL AND id_section != '' THEN '-' || id_section ELSE '' END ||
    CASE WHEN id_floor IS NOT NULL AND id_floor != '' THEN '-' || id_floor ELSE '' END ||
    CASE WHEN id_apartment IS NOT NULL AND id_apartment != '' THEN '-' || id_apartment ELSE '' END ||
    CASE WHEN id_vitrage_number IS NOT NULL AND id_vitrage_number != '' THEN '-' || id_vitrage_number ELSE '' END ||
    CASE WHEN id_vitrage_name IS NOT NULL AND id_vitrage_name != '' THEN '-' || id_vitrage_name ELSE '' END ||
    CASE WHEN id_vitrage_section IS NOT NULL AND id_vitrage_section != '' THEN '-' || id_vitrage_section ELSE '' END
  ) STORED,

  -- Дефекты для каждого сегмента витража
  segment_defects JSONB DEFAULT '{}'::JSONB,
  -- Формат: {
  --   "segment-0-0": {
  --     "defects": ["Скол", "Царапина"],
  --     "status": "defective", // "ok" | "defective" | "not_checked"
  --     "notes": "Требует замены",
  --     "checked_at": "2024-01-15T10:30:00Z",
  --     "checked_by": "Иванов И.И."
  --   },
  --   "segment-0-1": { ... }
  -- }

  -- Статус проверки витража
  inspection_status VARCHAR(20) DEFAULT 'not_checked' CHECK (
    inspection_status IN ('not_checked', 'in_progress', 'checked', 'approved', 'rejected')
  ),
  inspection_date TIMESTAMP,
  inspector_name VARCHAR(255),
  inspection_notes TEXT,

  -- Общее количество дефектов
  total_defects_count INTEGER DEFAULT 0,
  defective_segments_count INTEGER DEFAULT 0,

  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_placed_vitrages_object_id ON placed_vitrages(object_id);
CREATE INDEX idx_placed_vitrages_floor_plan_id ON placed_vitrages(floor_plan_id);
CREATE INDEX idx_placed_vitrages_vitrage_id ON placed_vitrages(vitrage_id);
CREATE INDEX idx_placed_vitrages_full_id ON placed_vitrages(full_id);
CREATE INDEX idx_placed_vitrages_id_components ON placed_vitrages(
  id_object, id_corpus, id_section, id_floor, id_apartment
);
CREATE INDEX idx_placed_vitrages_inspection_status ON placed_vitrages(inspection_status);
CREATE INDEX idx_placed_vitrages_total_defects ON placed_vitrages(total_defects_count);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_placed_vitrages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at
CREATE TRIGGER update_placed_vitrages_updated_at_trigger
BEFORE UPDATE ON placed_vitrages
FOR EACH ROW
EXECUTE FUNCTION update_placed_vitrages_updated_at();

-- Функция для подсчета дефектов при обновлении
CREATE OR REPLACE FUNCTION update_placed_vitrages_defects_count()
RETURNS TRIGGER AS $$
DECLARE
  segment_key TEXT;
  segment_data JSONB;
  defective_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Подсчитываем дефектные сегменты и общее количество дефектов
  FOR segment_key, segment_data IN SELECT * FROM jsonb_each(NEW.segment_defects)
  LOOP
    IF segment_data->>'status' = 'defective' THEN
      defective_count := defective_count + 1;
      IF jsonb_typeof(segment_data->'defects') = 'array' THEN
        total_count := total_count + jsonb_array_length(segment_data->'defects');
      END IF;
    END IF;
  END LOOP;

  NEW.defective_segments_count := defective_count;
  NEW.total_defects_count := total_count;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для подсчета дефектов
CREATE TRIGGER update_placed_vitrages_defects_count_trigger
BEFORE INSERT OR UPDATE OF segment_defects ON placed_vitrages
FOR EACH ROW
EXECUTE FUNCTION update_placed_vitrages_defects_count();

-- RLS политики
ALTER TABLE placed_vitrages ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (все пользователи могут читать)
CREATE POLICY "Allow read access to all users" ON placed_vitrages
  FOR SELECT USING (true);

-- Политика для вставки (все пользователи могут создавать)
CREATE POLICY "Allow insert for all users" ON placed_vitrages
  FOR INSERT WITH CHECK (true);

-- Политика для обновления (все пользователи могут обновлять)
CREATE POLICY "Allow update for all users" ON placed_vitrages
  FOR UPDATE USING (true) WITH CHECK (true);

-- Политика для удаления (все пользователи могут удалять)
CREATE POLICY "Allow delete for all users" ON placed_vitrages
  FOR DELETE USING (true);

-- Комментарии к таблице и колонкам
COMMENT ON TABLE placed_vitrages IS 'Таблица для хранения размещенных витражей с ID характеристиками и дефектами';
COMMENT ON COLUMN placed_vitrages.object_id IS 'Ссылка на объект строительства';
COMMENT ON COLUMN placed_vitrages.floor_plan_id IS 'Ссылка на план этажа (опционально)';
COMMENT ON COLUMN placed_vitrages.vitrage_id IS 'ID витража из типовых витражей';
COMMENT ON COLUMN placed_vitrages.vitrage_name IS 'Название витража (В-01, В-02 и т.д.)';
COMMENT ON COLUMN placed_vitrages.vitrage_data IS 'Полные данные витража в формате JSON';
COMMENT ON COLUMN placed_vitrages.full_id IS 'Полный сгенерированный ID витража';
COMMENT ON COLUMN placed_vitrages.segment_defects IS 'JSON с дефектами для каждого сегмента';
COMMENT ON COLUMN placed_vitrages.inspection_status IS 'Статус проверки витража';
COMMENT ON COLUMN placed_vitrages.total_defects_count IS 'Общее количество дефектов во всех сегментах';
COMMENT ON COLUMN placed_vitrages.defective_segments_count IS 'Количество дефектных сегментов';