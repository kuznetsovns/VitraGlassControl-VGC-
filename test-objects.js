// Проверка объектов в Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nnxthhhzumoqathqlipi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ueHRoaGh6dW1vcWF0aHFsaXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTE3OTUsImV4cCI6MjA3MjcyNzc5NX0.YRY2kO3Co_KSegMr9G57jfk9_pjrRUtsJWHXmf5qRnI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkObjects() {
  console.log('🔍 Проверка объектов в Supabase...\n')

  const { data, error } = await supabase
    .from('objects')
    .select('*')

  if (error) {
    console.error('❌ Ошибка:', error.message)
  } else {
    console.log(`✅ Найдено ${data.length} объектов`)
    data.forEach(obj => {
      console.log(`  - ${obj.name} (ID: ${obj.id})`)
    })
  }
}

checkObjects().catch(console.error)
