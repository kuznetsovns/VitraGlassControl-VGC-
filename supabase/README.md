# Supabase Database Migrations

## Применение миграций

### Таблица `objects` (объекты строительства)

1. Откройте SQL Editor в Supabase Dashboard:
   https://supabase.com/dashboard/project/nnxthhhzumoqathqlipi/sql/new

2. Скопируйте и выполните содержимое файла:
   `migrations/001_create_objects_table.sql`

### Таблица `floor_plans` (планы этажей)

1. Откройте SQL Editor в Supabase Dashboard:
   https://supabase.com/dashboard/project/nnxthhhzumoqathqlipi/sql/new

2. Скопируйте и выполните содержимое файла:
   `migrations/006_create_floor_plans_table.sql`

3. Нажмите кнопку "Run" для выполнения миграций

## Структура таблицы `objects`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор (автогенерируемый) |
| `name` | TEXT | Название объекта (обязательное) |
| `customer` | TEXT | Заказчик |
| `address` | TEXT | Адрес объекта |
| `corpus_count` | INTEGER | Количество корпусов (по умолчанию 1) |
| `photo_url` | TEXT | URL фотографии объекта |
| `created_at` | TIMESTAMP | Дата создания (автоматическая) |
| `updated_at` | TIMESTAMP | Дата обновления (автоматическая) |

## Политики доступа (RLS)

Таблица настроена с Row Level Security (RLS):
- ✅ Все пользователи могут читать объекты
- ✅ Все пользователи могут создавать объекты
- ✅ Все пользователи могут обновлять объекты
- ✅ Все пользователи могут удалять объекты

## Использование в коде

```typescript
import { supabase } from './lib/supabase'

// Получить все объекты
const { data, error } = await supabase
  .from('objects')
  .select('*')
  .order('created_at', { ascending: false })

// Создать новый объект
const { data, error } = await supabase
  .from('objects')
  .insert({
    name: 'Жилой комплекс "Рассвет"',
    customer: 'ООО "СтройИнвест"',
    address: 'г. Москва, ул. Ленина, 1',
    corpus_count: 3,
    photo_url: 'https://example.com/photo.jpg'
  })

// Обновить объект
const { data, error } = await supabase
  .from('objects')
  .update({ corpus_count: 4 })
  .eq('id', 'uuid-here')

// Удалить объект
const { data, error } = await supabase
  .from('objects')
  .delete()
  .eq('id', 'uuid-here')
```

## Структура таблицы `floor_plans`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор |
| `object_id` | UUID | Ссылка на объект (внешний ключ) |
| `corpus` | VARCHAR(100) | Корпус (например, "Корпус 1") |
| `section` | VARCHAR(100) | Секция корпуса (опционально) |
| `floor` | INTEGER | Номер этажа |
| `name` | VARCHAR(255) | Название плана |
| `description` | TEXT | Описание (опционально) |
| `image_url` | TEXT | URL изображения плана |
| `image_data` | TEXT | Base64 изображение |
| `image_type` | VARCHAR(50) | MIME тип изображения |
| `scale` | DECIMAL | Масштаб (мм на пиксель) |
| `width` | INTEGER | Ширина плана в пикселях |
| `height` | INTEGER | Высота плана в пикселях |
| `background_opacity` | DECIMAL | Прозрачность фона (0.0-1.0) |
| `grid_visible` | BOOLEAN | Показывать сетку |
| `placed_vitrages` | JSONB | Размещенные витражи |
| `walls` | JSONB | Данные о стенах |
| `rooms` | JSONB | Данные о помещениях |
| `created_at` | TIMESTAMP | Дата создания |
| `updated_at` | TIMESTAMP | Дата обновления |

## Использование сервиса `floorPlanStorage`

```typescript
import { floorPlanStorage } from './services/floorPlanStorage'

// Получить все планы для объекта
const { data, error } = await floorPlanStorage.getAll(objectId)

// Получить планы для корпуса
const { data, error } = await floorPlanStorage.getByObjectAndCorpus(
  objectId,
  'Корпус 1'
)

// Получить план конкретного этажа
const { data, error } = await floorPlanStorage.getByObjectCorpusFloor(
  objectId,
  'Корпус 1',
  3 // этаж
)

// Создать новый план этажа
const { data, error } = await floorPlanStorage.create({
  object_id: objectId,
  corpus: 'Корпус 1',
  floor: 3,
  name: 'План 3-го этажа',
  description: 'План типового этажа',
  scale: 10, // 10 мм на пиксель
  grid_visible: true
})

// Обновить размещенные витражи
const { data, error } = await floorPlanStorage.updatePlacedVitrages(
  planId,
  vitrages
)
```

## Загрузка изображений планов

Изображения планов можно хранить двумя способами:

### 1. Base64 в базе данных (рекомендуется для небольших изображений)

```typescript
const file = event.target.files[0]
const reader = new FileReader()
reader.onloadend = async () => {
  const base64 = reader.result as string
  await floorPlanStorage.create({
    // ...другие поля
    image_data: base64,
    image_type: file.type
  })
}
reader.readAsDataURL(file)
```

### 2. Supabase Storage (рекомендуется для больших файлов)

```typescript
// Загрузка в Storage
const file = event.target.files[0]
const { data, error } = await supabase.storage
  .from('floor-plans')
  .upload(`${objectId}/${corpus}/floor_${floor}.png`, file)

// Получение URL
const { data: { publicUrl } } = supabase.storage
  .from('floor-plans')
  .getPublicUrl(`${objectId}/${corpus}/floor_${floor}.png`)

// Сохранение URL в базе
await floorPlanStorage.create({
  // ...другие поля
  image_url: publicUrl
})
```
