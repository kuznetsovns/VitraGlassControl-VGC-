# Миграции Supabase

Этот каталог содержит SQL миграции для создания и обновления структуры базы данных в Supabase.

## Применение миграций

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в раздел **SQL Editor**
4. Скопируйте содержимое миграции (начиная с `001_` и далее по порядку)
5. Вставьте в редактор и нажмите **Run**
6. Повторите для каждой миграции по порядку

### Вариант 2: Через Supabase CLI

```bash
# Установите Supabase CLI если еще не установлен
npm install -g supabase

# Войдите в аккаунт
supabase login

# Свяжите проект
supabase link --project-ref your-project-ref

# Примените все миграции
supabase db push
```

## Список миграций

### 001_create_objects_table.sql
Создает таблицу `objects` для хранения строительных объектов.

### 002_create_table_if_not_exists.sql
Обновляет таблицу objects с проверкой существования.

### 003_create_vitrages_table.sql
Создает таблицу `vitrages` для хранения типовых витражей.

### 004_create_vitrage_segments_table.sql
Создает таблицу `vitrage_segments` для хранения сегментов витражей.

### 005_create_defects_tables.sql
Создает таблицы для хранения дефектов витражей.

### 006_create_floor_plans_table.sql
Создает таблицу `floor_plans` для хранения планов этажей.

### 007_create_placed_vitrages_table.sql
Создает таблицу `placed_vitrages` для хранения размещенных витражей с ID и дефектами.

**Основные поля:**
- Связь с объектом и планом этажа
- Позиция и трансформация (x, y, rotation, scale)
- 8-компонентный ID (объект, корпус, секция, этаж, квартира, номер витража, название, секция витража)
- Автоматически генерируемый `full_id`
- Дефекты сегментов в формате JSONB
- Статус проверки и метаданные инспекции
- Автоматические счетчики дефектов

**Особенности:**
- RLS политики для доступа всех пользователей
- Триггеры для автоматического обновления `updated_at`
- Триггеры для подсчета дефектов
- Индексы для быстрого поиска

### 008_create_vitrage_segment_ids_table.sql
Создает таблицу `vitrage_segment_ids` для хранения индивидуальных ID каждого сегмента витража.

**Основные поля:**
- `placed_vitrage_id` - ссылка на размещенный витраж
- `segment_key` - ключ сегмента (segment-{row}-{col})
- 8 компонентов ID (как в placed_vitrages)
- Автоматически генерируемый `full_segment_id`

**Особенности:**
- Уникальный constraint для каждого сегмента витража
- RLS политики
- Индексы для быстрого поиска

## Проверка успешного применения

После применения миграций проверьте создание таблиц:

```sql
-- Проверка таблиц
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- Проверка структуры placed_vitrages
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'placed_vitrages';

-- Проверка структуры vitrage_segment_ids
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vitrage_segment_ids';
```

## Структура данных

### PlacedVitrage
Размещенный витраж на плане этажа с полным ID и дефектами.

### VitrageSegmentId
Индивидуальный ID для каждого сегмента витража.

### Связи
- `placed_vitrages.object_id` → `objects.id`
- `placed_vitrages.floor_plan_id` → `floor_plans.id`
- `vitrage_segment_ids.placed_vitrage_id` → `placed_vitrages.id`

## Откат миграций

Если нужно откатить миграцию, используйте SQL команды DROP:

```sql
-- Откат 008
DROP TABLE IF EXISTS vitrage_segment_ids CASCADE;

-- Откат 007
DROP TABLE IF EXISTS placed_vitrages CASCADE;
```

**⚠️ ВНИМАНИЕ:** Откат миграций удалит все данные в соответствующих таблицах!
