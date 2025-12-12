// Тестовый скрипт для проверки подключения к Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nnxthhhzumoqathqlipi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ueHRoaGh6dW1vcWF0aHFsaXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTE3OTUsImV4cCI6MjA3MjcyNzc5NX0.YRY2kO3Co_KSegMr9G57jfk9_pjrRUtsJWHXmf5qRnI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔍 Проверка подключения к Supabase...')

  // Проверка таблиц
  console.log('\n📋 Проверка таблицы placed_vitrages:')
  const { data: placedData, error: placedError } = await supabase
    .from('placed_vitrages')
    .select('*')
    .limit(5)

  if (placedError) {
    console.error('❌ Ошибка:', placedError.message)
  } else {
    console.log(`✅ Найдено ${placedData.length} записей`)
    if (placedData.length > 0) {
      console.log('Пример записи:', JSON.stringify(placedData[0], null, 2))
    }
  }

  console.log('\n📋 Проверка таблицы vitrage_segment_ids:')
  const { data: segmentData, error: segmentError } = await supabase
    .from('vitrage_segment_ids')
    .select('*')
    .limit(5)

  if (segmentError) {
    console.error('❌ Ошибка:', segmentError.message)
  } else {
    console.log(`✅ Найдено ${segmentData.length} записей`)
    if (segmentData.length > 0) {
      console.log('Пример записи:', JSON.stringify(segmentData[0], null, 2))
    }
  }

  // Получаем первый объект для теста
  console.log('\n📝 Тест создания витража:')
  const { data: objects } = await supabase.from('objects').select('*').limit(1).single()

  if (!objects) {
    console.log('⚠️ Нет объектов в БД для теста')
    return
  }

  console.log(`Используем объект: ${objects.name} (${objects.id})`)

  const testVitrage = {
    object_id: objects.id,
    vitrage_id: 'test-vitrage-' + Date.now(),
    vitrage_name: 'Тестовый витраж',
    vitrage_data: { rows: 2, cols: 2, totalWidth: 1000, totalHeight: 1000, segments: [] },
    id_object: 'ТестОбъект',
    id_corpus: 'А',
    id_section: '1',
    id_floor: '1'
  }

  const { data: createData, error: createError } = await supabase
    .from('placed_vitrages')
    .insert([testVitrage])
    .select()
    .single()

  if (createError) {
    console.error('❌ Ошибка создания:', createError.message)
    console.error('Детали:', createError)
  } else {
    console.log('✅ Витраж создан:', createData.id)
    console.log('Full ID:', createData.full_id)

    // Удаляем тестовую запись
    await supabase.from('placed_vitrages').delete().eq('id', createData.id)
    console.log('✅ Тестовая запись удалена')
  }
}

testConnection().catch(console.error)
