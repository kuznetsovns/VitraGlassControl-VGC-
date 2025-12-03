-- Проверка существования таблицы floor_plans и её структуры
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'floor_plans'
ORDER BY
    ordinal_position;

-- Проверка существующих политик RLS
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'floor_plans';

-- Проверка индексов
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'floor_plans';