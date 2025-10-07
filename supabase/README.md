# Supabase Database Migrations

## Применение миграции

Для создания таблицы `objects` в вашей базе данных Supabase:

1. Откройте SQL Editor в Supabase Dashboard:
   https://supabase.com/dashboard/project/obuizvrafoehfolpfpvz/sql/new

2. Скопируйте и выполните содержимое файла:
   `migrations/001_create_objects_table.sql`

3. Нажмите кнопку "Run" для выполнения миграции

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

## Загрузка фотографий

Для хранения фотографий рекомендуется использовать Supabase Storage:

1. Создайте bucket `object-photos` в Storage
2. Загрузите фото через Storage API
3. Сохраните публичный URL в поле `photo_url`

```typescript
// Загрузка фото
const file = event.target.files[0]
const { data, error } = await supabase.storage
  .from('object-photos')
  .upload(`${objectId}/${file.name}`, file)

// Получение публичного URL
const { data: { publicUrl } } = supabase.storage
  .from('object-photos')
  .getPublicUrl(`${objectId}/${file.name}`)
```
