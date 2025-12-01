-- Создание таблиц для системы дефектовки
-- Связь: defects -> vitrage_segments -> vitrages -> objects

-- Таблица типов дефектов (справочник)
CREATE TABLE IF NOT EXISTS defect_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,                   -- Название дефекта (Царапины, Сколы, и т.д.)
    description TEXT,                            -- Описание дефекта
    severity TEXT DEFAULT 'medium',              -- Уровень серьёзности: low, medium, high, critical
    is_active BOOLEAN DEFAULT true,              -- Активен ли тип дефекта
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Начальные типы дефектов
INSERT INTO defect_types (name, description, severity) VALUES
    ('Царапины', 'Царапины на поверхности стекла или профиля', 'low'),
    ('Сколы', 'Сколы на краях стекла или профиля', 'medium'),
    ('Трещины', 'Трещины в стекле', 'critical'),
    ('Загрязнения', 'Загрязнения поверхности', 'low'),
    ('Деформация', 'Деформация профиля или конструкции', 'high'),
    ('Разгерметизация', 'Нарушение герметичности стеклопакета', 'critical'),
    ('Запотевание', 'Запотевание внутри стеклопакета', 'high'),
    ('Некачественный монтаж', 'Дефекты монтажа конструкции', 'medium')
ON CONFLICT (name) DO NOTHING;

-- Таблица дефектов сегментов витражей
CREATE TABLE IF NOT EXISTS segment_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Связь с витражом и сегментом
    vitrage_id UUID NOT NULL REFERENCES vitrages(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,              -- Индекс сегмента в витраже

    -- Информация об осмотре
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector TEXT,                              -- ФИО проверяющего
    site_manager TEXT,                           -- ФИО начальника участка

    -- Метаданные
    notes TEXT,                                  -- Примечания
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Уникальность: один осмотр сегмента в дату
    UNIQUE(vitrage_id, segment_index, inspection_date)
);

-- Таблица связи дефектов с осмотрами (многие-ко-многим)
CREATE TABLE IF NOT EXISTS segment_defect_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_defect_id UUID NOT NULL REFERENCES segment_defects(id) ON DELETE CASCADE,
    defect_type_id UUID NOT NULL REFERENCES defect_types(id) ON DELETE CASCADE,

    -- Дополнительная информация о конкретном дефекте
    quantity INTEGER DEFAULT 1,                  -- Количество дефектов данного типа
    location TEXT,                               -- Локализация на сегменте
    photo_url TEXT,                              -- URL фото дефекта

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(segment_defect_id, defect_type_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_segment_defects_vitrage_id ON segment_defects(vitrage_id);
CREATE INDEX IF NOT EXISTS idx_segment_defects_inspection_date ON segment_defects(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_segment_defect_items_segment_defect_id ON segment_defect_items(segment_defect_id);
CREATE INDEX IF NOT EXISTS idx_segment_defect_items_defect_type_id ON segment_defect_items(defect_type_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_segment_defects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_segment_defects_updated_at ON segment_defects;
CREATE TRIGGER trigger_segment_defects_updated_at
    BEFORE UPDATE ON segment_defects
    FOR EACH ROW
    EXECUTE FUNCTION update_segment_defects_updated_at();

-- Включаем Row Level Security
ALTER TABLE defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_defect_items ENABLE ROW LEVEL SECURITY;

-- Политики доступа для defect_types (публичный доступ)
DROP POLICY IF EXISTS "Allow public read access on defect_types" ON defect_types;
CREATE POLICY "Allow public read access on defect_types"
    ON defect_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on defect_types" ON defect_types;
CREATE POLICY "Allow public insert access on defect_types"
    ON defect_types FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on defect_types" ON defect_types;
CREATE POLICY "Allow public update access on defect_types"
    ON defect_types FOR UPDATE USING (true);

-- Политики доступа для segment_defects
DROP POLICY IF EXISTS "Allow public read access on segment_defects" ON segment_defects;
CREATE POLICY "Allow public read access on segment_defects"
    ON segment_defects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on segment_defects" ON segment_defects;
CREATE POLICY "Allow public insert access on segment_defects"
    ON segment_defects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on segment_defects" ON segment_defects;
CREATE POLICY "Allow public update access on segment_defects"
    ON segment_defects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on segment_defects" ON segment_defects;
CREATE POLICY "Allow public delete access on segment_defects"
    ON segment_defects FOR DELETE USING (true);

-- Политики доступа для segment_defect_items
DROP POLICY IF EXISTS "Allow public read access on segment_defect_items" ON segment_defect_items;
CREATE POLICY "Allow public read access on segment_defect_items"
    ON segment_defect_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on segment_defect_items" ON segment_defect_items;
CREATE POLICY "Allow public insert access on segment_defect_items"
    ON segment_defect_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on segment_defect_items" ON segment_defect_items;
CREATE POLICY "Allow public update access on segment_defect_items"
    ON segment_defect_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access on segment_defect_items" ON segment_defect_items;
CREATE POLICY "Allow public delete access on segment_defect_items"
    ON segment_defect_items FOR DELETE USING (true);

-- Представление для получения дефектов с информацией о витраже
CREATE OR REPLACE VIEW defects_with_vitrage_info AS
SELECT
    sd.id,
    sd.vitrage_id,
    sd.segment_index,
    sd.inspection_date,
    sd.inspector,
    sd.site_manager,
    sd.notes,
    sd.created_at,
    sd.updated_at,
    v.name AS vitrage_name,
    v.object_id,
    v.object_name,
    COALESCE(
        json_agg(
            json_build_object(
                'defect_type_id', sdi.defect_type_id,
                'defect_name', dt.name,
                'severity', dt.severity,
                'quantity', sdi.quantity,
                'location', sdi.location,
                'photo_url', sdi.photo_url
            )
        ) FILTER (WHERE sdi.id IS NOT NULL),
        '[]'::json
    ) AS defects
FROM segment_defects sd
JOIN vitrages v ON sd.vitrage_id = v.id
LEFT JOIN segment_defect_items sdi ON sd.id = sdi.segment_defect_id
LEFT JOIN defect_types dt ON sdi.defect_type_id = dt.id
GROUP BY sd.id, v.name, v.object_id, v.object_name;

-- Комментарии к таблицам
COMMENT ON TABLE defect_types IS 'Справочник типов дефектов';
COMMENT ON TABLE segment_defects IS 'Записи осмотров сегментов витражей';
COMMENT ON TABLE segment_defect_items IS 'Дефекты, обнаруженные при осмотре сегмента';
COMMENT ON COLUMN segment_defects.vitrage_id IS 'ID витража (FK на vitrages)';
COMMENT ON COLUMN segment_defects.segment_index IS 'Индекс сегмента в витраже';
COMMENT ON COLUMN segment_defects.inspection_date IS 'Дата осмотра';
COMMENT ON COLUMN segment_defects.inspector IS 'ФИО проверяющего';
COMMENT ON COLUMN segment_defects.site_manager IS 'ФИО начальника участка';
