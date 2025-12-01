-- Проверка и создание таблицы только если её нет
CREATE TABLE IF NOT EXISTS public.objects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    customer TEXT,
    address TEXT,
    corpus_count INTEGER DEFAULT 1,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Создание индексов только если их нет
CREATE INDEX IF NOT EXISTS idx_objects_name ON public.objects(name);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON public.objects(created_at DESC);

-- Включение RLS если еще не включено
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

-- Создание политик только если их нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
        AND policyname = 'Anyone can read objects'
    ) THEN
        CREATE POLICY "Anyone can read objects"
            ON public.objects
            FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
        AND policyname = 'Anyone can insert objects'
    ) THEN
        CREATE POLICY "Anyone can insert objects"
            ON public.objects
            FOR INSERT
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
        AND policyname = 'Anyone can update objects'
    ) THEN
        CREATE POLICY "Anyone can update objects"
            ON public.objects
            FOR UPDATE
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'objects'
        AND policyname = 'Anyone can delete objects'
    ) THEN
        CREATE POLICY "Anyone can delete objects"
            ON public.objects
            FOR DELETE
            USING (true);
    END IF;
END $$;