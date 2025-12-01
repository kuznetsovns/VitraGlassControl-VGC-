-- Создание таблицы для хранения сегментов витражей
-- Сегменты связаны с витражами через vitrage_id (Foreign Key)
-- Это позволяет редактировать сегменты независимо в Спецификации Витражей

CREATE TABLE IF NOT EXISTS vitrage_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Связь с витражом
    vitrage_id UUID NOT NULL REFERENCES vitrages(id) ON DELETE CASCADE,

    -- Позиция сегмента в сетке витража
    segment_index INTEGER NOT NULL,             -- Индекс сегмента (0, 1, 2, ...)
    row_index INTEGER NOT NULL DEFAULT 0,       -- Номер ряда (0-based)
    col_index INTEGER NOT NULL DEFAULT 0,       -- Номер столбца (0-based)

    -- Обозначение и тип
    label TEXT,                                 -- Обозначение сегмента (СП-1, В-01)
    fill_type TEXT NOT NULL DEFAULT 'Пустой',   -- Тип заполнения

    -- Размеры в миллиметрах
    width NUMERIC(10,2),                        -- Ширина в мм
    height NUMERIC(10,2),                       -- Высота в мм

    -- Формула стекла
    formula TEXT,                               -- Формула (например: 4М1-16-4М1)

    -- Дополнительные свойства для объединённых сегментов
    is_merged BOOLEAN DEFAULT false,            -- Является ли объединённым
    row_span INTEGER DEFAULT 1,                 -- Количество рядов при объединении
    col_span INTEGER DEFAULT 1,                 -- Количество столбцов при объединении
    is_hidden BOOLEAN DEFAULT false,            -- Скрыт ли (часть объединённого)
    merged_into_id UUID,                        -- ID сегмента, в который объединён

    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Уникальность: один сегмент с определённым индексом на витраж
    UNIQUE(vitrage_id, segment_index)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_vitrage_segments_vitrage_id ON vitrage_segments(vitrage_id);
CREATE INDEX IF NOT EXISTS idx_vitrage_segments_position ON vitrage_segments(vitrage_id, row_index, col_index);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_vitrage_segments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vitrage_segments_updated_at ON vitrage_segments;
CREATE TRIGGER trigger_vitrage_segments_updated_at
    BEFORE UPDATE ON vitrage_segments
    FOR EACH ROW
    EXECUTE FUNCTION update_vitrage_segments_updated_at();

-- Включаем Row Level Security
ALTER TABLE vitrage_segments ENABLE ROW LEVEL SECURITY;

-- Политики доступа (публичный доступ)
DROP POLICY IF EXISTS "Allow public read access on vitrage_segments" ON vitrage_segments;
CREATE POLICY "Allow public read access on vitrage_segments"
    ON vitrage_segments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public insert access on vitrage_segments" ON vitrage_segments;
CREATE POLICY "Allow public insert access on vitrage_segments"
    ON vitrage_segments FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on vitrage_segments" ON vitrage_segments;
CREATE POLICY "Allow public update access on vitrage_segments"
    ON vitrage_segments FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow public delete access on vitrage_segments" ON vitrage_segments;
CREATE POLICY "Allow public delete access on vitrage_segments"
    ON vitrage_segments FOR DELETE
    USING (true);

-- Комментарии
COMMENT ON TABLE vitrage_segments IS 'Таблица для хранения сегментов витражей с возможностью редактирования';
COMMENT ON COLUMN vitrage_segments.vitrage_id IS 'ID витража (Foreign Key на vitrages)';
COMMENT ON COLUMN vitrage_segments.segment_index IS 'Порядковый индекс сегмента в витраже';
COMMENT ON COLUMN vitrage_segments.label IS 'Обозначение сегмента (СП-1, ВР-2)';
COMMENT ON COLUMN vitrage_segments.fill_type IS 'Тип заполнения: Пустой, Стеклопакет, Стемалит, Вент решётка, Створка, Дверной блок, Сэндвич-панель';
COMMENT ON COLUMN vitrage_segments.width IS 'Ширина сегмента в миллиметрах';
COMMENT ON COLUMN vitrage_segments.height IS 'Высота сегмента в миллиметрах';
COMMENT ON COLUMN vitrage_segments.formula IS 'Формула стеклопакета (например: 4М1-16-4М1)';

-- Представление для получения витражей со всеми сегментами
CREATE OR REPLACE VIEW vitrages_with_segments AS
SELECT
    v.id,
    v.name,
    v.site_manager,
    v.creation_date,
    v.object_id,
    v.object_name,
    v.rows_count,
    v.cols_count,
    v.total_width,
    v.total_height,
    v.svg_drawing,
    v.created_at,
    v.updated_at,
    COALESCE(
        json_agg(
            json_build_object(
                'id', vs.id,
                'segment_index', vs.segment_index,
                'row_index', vs.row_index,
                'col_index', vs.col_index,
                'label', vs.label,
                'type', vs.fill_type,
                'width', vs.width,
                'height', vs.height,
                'formula', vs.formula,
                'is_merged', vs.is_merged,
                'row_span', vs.row_span,
                'col_span', vs.col_span,
                'is_hidden', vs.is_hidden
            ) ORDER BY vs.segment_index
        ) FILTER (WHERE vs.id IS NOT NULL),
        '[]'::json
    ) AS segments_data
FROM vitrages v
LEFT JOIN vitrage_segments vs ON v.id = vs.vitrage_id
GROUP BY v.id;

COMMENT ON VIEW vitrages_with_segments IS 'Представление витражей с агрегированными данными сегментов';
