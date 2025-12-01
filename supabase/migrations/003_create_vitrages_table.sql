-- Создание таблицы для хранения витражей
-- Витражи связаны с объектами через object_id

CREATE TABLE IF NOT EXISTS vitrages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Основная информация о витраже
    name TEXT NOT NULL,                          -- Маркировка витража (например: В-01, ВТ-003)
    site_manager TEXT,                           -- Начальник участка
    creation_date DATE,                          -- Дата создания витража

    -- Связь с объектом
    object_id UUID REFERENCES objects(id) ON DELETE CASCADE,
    object_name TEXT,                            -- Название объекта (денормализация для удобства)

    -- Конфигурация сетки
    rows_count INTEGER NOT NULL DEFAULT 1,       -- Количество рядов
    cols_count INTEGER NOT NULL DEFAULT 1,       -- Количество столбцов

    -- Данные сегментов (JSON массив)
    segments JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Свойства сегментов (JSON объект с ключами по ID сегмента)
    segment_properties JSONB DEFAULT '{}'::jsonb,

    -- Размеры
    total_width INTEGER DEFAULT 600,             -- Общая ширина в пикселях
    total_height INTEGER DEFAULT 400,            -- Общая высота в пикселях

    -- SVG отрисовка витража
    svg_drawing TEXT,                            -- SVG код для отображения

    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_vitrages_object_id ON vitrages(object_id);
CREATE INDEX IF NOT EXISTS idx_vitrages_name ON vitrages(name);
CREATE INDEX IF NOT EXISTS idx_vitrages_created_at ON vitrages(created_at DESC);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_vitrages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vitrages_updated_at ON vitrages;
CREATE TRIGGER trigger_vitrages_updated_at
    BEFORE UPDATE ON vitrages
    FOR EACH ROW
    EXECUTE FUNCTION update_vitrages_updated_at();

-- Включаем Row Level Security
ALTER TABLE vitrages ENABLE ROW LEVEL SECURITY;

-- Политики доступа (публичный доступ для всех пользователей)
DROP POLICY IF EXISTS "Allow public read access on vitrages" ON vitrages;
CREATE POLICY "Allow public read access on vitrages"
    ON vitrages FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on vitrages" ON vitrages;
CREATE POLICY "Allow public insert access on vitrages"
    ON vitrages FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on vitrages" ON vitrages;
CREATE POLICY "Allow public update access on vitrages"
    ON vitrages FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow public delete access on vitrages" ON vitrages;
CREATE POLICY "Allow public delete access on vitrages"
    ON vitrages FOR DELETE
    USING (true);

-- Комментарии к таблице и полям
COMMENT ON TABLE vitrages IS 'Таблица для хранения конфигураций витражей';
COMMENT ON COLUMN vitrages.name IS 'Маркировка витража (например: В-01, ВТ-003)';
COMMENT ON COLUMN vitrages.site_manager IS 'ФИО начальника участка';
COMMENT ON COLUMN vitrages.object_id IS 'ID связанного объекта строительства';
COMMENT ON COLUMN vitrages.rows_count IS 'Количество сегментов по вертикали';
COMMENT ON COLUMN vitrages.cols_count IS 'Количество сегментов по горизонтали';
COMMENT ON COLUMN vitrages.segments IS 'JSON массив с данными сегментов';
COMMENT ON COLUMN vitrages.segment_properties IS 'JSON объект со свойствами сегментов (тип, размеры, формула)';
COMMENT ON COLUMN vitrages.svg_drawing IS 'SVG код для визуализации витража';
