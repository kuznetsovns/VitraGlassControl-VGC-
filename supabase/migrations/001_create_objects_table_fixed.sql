-- Удаляем существующую таблицу и триггеры, если они есть
DROP TRIGGER IF EXISTS set_updated_at ON public.objects;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP TABLE IF EXISTS public.objects CASCADE;

-- Создание таблицы для объектов строительства
CREATE TABLE public.objects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    address TEXT,
    corpus_count INTEGER DEFAULT 1,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_objects_name ON public.objects(name);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON public.objects(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.objects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Включение Row Level Security (RLS)
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Anyone can read objects" ON public.objects;
DROP POLICY IF EXISTS "Anyone can insert objects" ON public.objects;
DROP POLICY IF EXISTS "Anyone can update objects" ON public.objects;
DROP POLICY IF EXISTS "Anyone can delete objects" ON public.objects;

-- Политика: все могут читать объекты
CREATE POLICY "Anyone can read objects"
    ON public.objects
    FOR SELECT
    USING (true);

-- Политика: все могут создавать объекты
CREATE POLICY "Anyone can insert objects"
    ON public.objects
    FOR INSERT
    WITH CHECK (true);

-- Политика: все могут обновлять объекты
CREATE POLICY "Anyone can update objects"
    ON public.objects
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Политика: все могут удалять объекты
CREATE POLICY "Anyone can delete objects"
    ON public.objects
    FOR DELETE
    USING (true);

-- Комментарии к таблице и полям
COMMENT ON TABLE public.objects IS 'Таблица объектов строительства';
COMMENT ON COLUMN public.objects.id IS 'Уникальный идентификатор объекта';
COMMENT ON COLUMN public.objects.name IS 'Название объекта';
COMMENT ON COLUMN public.objects.customer IS 'Заказчик';
COMMENT ON COLUMN public.objects.address IS 'Адрес объекта';
COMMENT ON COLUMN public.objects.corpus_count IS 'Количество корпусов';
COMMENT ON COLUMN public.objects.photo_url IS 'URL фотографии объекта';
COMMENT ON COLUMN public.objects.created_at IS 'Дата и время создания';
COMMENT ON COLUMN public.objects.updated_at IS 'Дата и время последнего обновления';