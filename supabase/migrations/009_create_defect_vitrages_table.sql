-- Таблица для дефектовки витражей
-- Хранит витражи с назначенными ID и дефектами для каждого сегмента

CREATE TABLE IF NOT EXISTS defect_vitrages (
  -- Основные поля
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id UUID NOT NULL REFERENCES objects(id) ON DELETE CASCADE,

  -- Ссылка на размещенный витраж (опционально, если витраж размещен на плане)
  placed_vitrage_id UUID REFERENCES placed_vitrages(id) ON DELETE SET NULL,

  -- Информация о витраже
  vitrage_id VARCHAR(100) NOT NULL,  -- ID витража из библиотеки
  vitrage_name VARCHAR(255) NOT NULL,
  vitrage_data JSONB NOT NULL,  -- Данные витража (rows, cols, segments, etc.)

  -- 8-компонентный ID витража
  id_object VARCHAR(100),
  id_corpus VARCHAR(100),
  id_section VARCHAR(100),
  id_floor VARCHAR(100),
  id_apartment VARCHAR(100),
  id_vitrage_number VARCHAR(100),
  id_vitrage_name VARCHAR(100),
  id_vitrage_section VARCHAR(100),

  -- Автоматически генерируемый полный ID (заполняется триггером)
  full_id VARCHAR(500),

  -- Дефекты сегментов (ключ - segment-row-col, значение - объект с дефектами)
  segment_defects JSONB DEFAULT '{}'::jsonb,

  -- Статистика дефектов
  total_defects_count INTEGER DEFAULT 0,
  defective_segments_count INTEGER DEFAULT 0,

  -- Статус проверки
  inspection_status VARCHAR(50) DEFAULT 'not_checked',
  -- not_checked | in_progress | checked | approved | rejected

  inspection_date TIMESTAMP,
  inspector_name VARCHAR(255),
  supervisor_name VARCHAR(255),  -- Начальник участка
  inspection_notes TEXT,

  -- Метаданные
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(255),

  -- Индексы для быстрого поиска
  CONSTRAINT defect_vitrages_object_id_idx UNIQUE(object_id, full_id)
);

-- Индексы
CREATE INDEX idx_defect_vitrages_object_id ON defect_vitrages(object_id);
CREATE INDEX idx_defect_vitrages_placed_vitrage_id ON defect_vitrages(placed_vitrage_id);
CREATE INDEX idx_defect_vitrages_full_id ON defect_vitrages(full_id);
CREATE INDEX idx_defect_vitrages_inspection_status ON defect_vitrages(inspection_status);

-- Функция для генерации full_id
CREATE OR REPLACE FUNCTION generate_defect_vitrage_full_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Генерируем full_id из 8 компонентов, пропуская пустые значения
  IF NEW.id_object IS NOT NULL AND NEW.id_corpus IS NOT NULL AND
     NEW.id_section IS NOT NULL AND NEW.id_floor IS NOT NULL THEN

    NEW.full_id := CONCAT_WS('-',
      NULLIF(NEW.id_object, ''),
      NULLIF(NEW.id_corpus, ''),
      NULLIF(NEW.id_section, ''),
      NULLIF(NEW.id_floor, ''),
      NULLIF(NEW.id_apartment, ''),
      NULLIF(NEW.id_vitrage_number, ''),
      NULLIF(NEW.id_vitrage_name, ''),
      NULLIF(NEW.id_vitrage_section, '')
    );
  ELSE
    NEW.full_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для генерации full_id при вставке и обновлении
CREATE TRIGGER trigger_generate_defect_vitrage_full_id
  BEFORE INSERT OR UPDATE ON defect_vitrages
  FOR EACH ROW
  EXECUTE FUNCTION generate_defect_vitrage_full_id();

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_defect_vitrages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_defect_vitrages_updated_at
  BEFORE UPDATE ON defect_vitrages
  FOR EACH ROW
  EXECUTE FUNCTION update_defect_vitrages_updated_at();

-- Row Level Security (RLS)
ALTER TABLE defect_vitrages ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Enable read access for all users" ON defect_vitrages
  FOR SELECT USING (true);

-- Политика: все могут вставлять
CREATE POLICY "Enable insert access for all users" ON defect_vitrages
  FOR INSERT WITH CHECK (true);

-- Политика: все могут обновлять
CREATE POLICY "Enable update access for all users" ON defect_vitrages
  FOR UPDATE USING (true);

-- Политика: все могут удалять
CREATE POLICY "Enable delete access for all users" ON defect_vitrages
  FOR DELETE USING (true);

-- Комментарии
COMMENT ON TABLE defect_vitrages IS 'Витражи с дефектами для дефектовки';
COMMENT ON COLUMN defect_vitrages.full_id IS 'Автоматически генерируемый полный ID из 8 компонентов';
COMMENT ON COLUMN defect_vitrages.segment_defects IS 'JSONB объект с дефектами для каждого сегмента';
COMMENT ON COLUMN defect_vitrages.inspection_status IS 'Статус проверки: not_checked, in_progress, checked, approved, rejected';
