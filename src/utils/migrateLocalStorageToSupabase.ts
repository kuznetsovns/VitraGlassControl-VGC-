import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import type { PlacedVitrageData } from '../services/placedVitrageStorage'

const LOCAL_STORAGE_KEY = 'placed-vitrages'

/**
 * Миграция витражей из localStorage в Supabase
 * Эта функция нужна для переноса старых витражей которые были созданы
 * до исправления UUID и сохранены только локально
 */
export async function migrateLocalStorageToSupabase(): Promise<{
  success: boolean
  migrated: number
  errors: number
  details: string[]
}> {
  const details: string[] = []
  let migrated = 0
  let errors = 0

  try {
    console.log('🔄 Starting migration from localStorage to Supabase...')
    details.push('Starting migration from localStorage to Supabase...')

    // Читаем данные из localStorage
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!stored) {
      console.log('📭 No data in localStorage to migrate')
      details.push('No data in localStorage to migrate')
      return { success: true, migrated: 0, errors: 0, details }
    }

    const localVitrages: PlacedVitrageData[] = JSON.parse(stored)
    console.log(`📦 Found ${localVitrages.length} vitrages in localStorage`)
    details.push(`Found ${localVitrages.length} vitrages in localStorage`)

    if (localVitrages.length === 0) {
      return { success: true, migrated: 0, errors: 0, details }
    }

    // Получаем все витражи из Supabase для проверки дубликатов
    const { data: existingVitrages } = await supabase
      .from('placed_vitrages')
      .select('vitrage_id, object_id, floor_plan_id, position_x, position_y')

    const existingSet = new Set(
      (existingVitrages || []).map(v =>
        `${v.object_id}-${v.floor_plan_id}-${v.vitrage_id}-${v.position_x}-${v.position_y}`
      )
    )

    // Мигрируем каждый витраж
    for (const vitrage of localVitrages) {
      try {
        // Проверяем не существует ли уже такой витраж в Supabase
        const key = `${vitrage.object_id}-${vitrage.floor_plan_id}-${vitrage.vitrage_id}-${vitrage.position_x}-${vitrage.position_y}`

        if (existingSet.has(key)) {
          console.log(`⏭️ Skipping duplicate vitrage: ${vitrage.vitrage_name}`)
          details.push(`Skipped duplicate: ${vitrage.vitrage_name}`)
          continue
        }

        // Проверяем валидность UUID для object_id
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vitrage.object_id)

        if (!isValidUUID) {
          console.warn(`⚠️ Skipping vitrage with invalid object_id: ${vitrage.object_id}`)
          details.push(`Skipped invalid object_id: ${vitrage.vitrage_name} (${vitrage.object_id})`)
          errors++
          continue
        }

        // Создаем новый UUID для витража если текущий невалиден
        let newId = vitrage.id
        const isValidVitrageId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vitrage.id || '')

        if (!isValidVitrageId) {
          newId = uuidv4()
          console.log(`🆔 Generating new UUID for vitrage: ${vitrage.vitrage_name}`)
          details.push(`Generated new UUID for: ${vitrage.vitrage_name}`)
        }

        // Создаем новый UUID для floor_plan_id если нужно
        let newFloorPlanId = vitrage.floor_plan_id
        if (newFloorPlanId) {
          const isValidFloorPlanId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newFloorPlanId)
          if (!isValidFloorPlanId) {
            newFloorPlanId = uuidv4()
            console.log(`🆔 Generating new UUID for floor_plan_id: ${vitrage.vitrage_name}`)
          }
        }

        // Подготавливаем данные для вставки
        const dataToInsert = {
          ...vitrage,
          id: newId,
          floor_plan_id: newFloorPlanId,
          total_defects_count: vitrage.total_defects_count || 0,
          defective_segments_count: vitrage.defective_segments_count || 0,
          segment_defects: vitrage.segment_defects || {},
          inspection_status: vitrage.inspection_status || 'not_checked'
        }

        // Вставляем в Supabase
        const { error } = await supabase
          .from('placed_vitrages')
          .insert([dataToInsert])

        if (error) {
          console.error(`❌ Error migrating vitrage ${vitrage.vitrage_name}:`, error)
          details.push(`Error migrating ${vitrage.vitrage_name}: ${error.message}`)
          errors++
        } else {
          console.log(`✅ Migrated vitrage: ${vitrage.vitrage_name}`)
          details.push(`Migrated: ${vitrage.vitrage_name}`)
          migrated++
        }
      } catch (err) {
        console.error(`❌ Exception migrating vitrage:`, err)
        details.push(`Exception: ${err instanceof Error ? err.message : String(err)}`)
        errors++
      }
    }

    console.log(`🎉 Migration complete: ${migrated} migrated, ${errors} errors`)
    details.push(`Migration complete: ${migrated} migrated, ${errors} errors`)

    return {
      success: errors === 0,
      migrated,
      errors,
      details
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    details.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      migrated,
      errors: errors + 1,
      details
    }
  }
}

/**
 * Очистить localStorage после успешной миграции
 * ВНИМАНИЕ: Используйте только после подтверждения что все данные в Supabase!
 */
export async function clearLocalStorageAfterMigration(): Promise<void> {
  if (confirm('Вы уверены что хотите очистить локальные данные? Убедитесь что миграция прошла успешно!')) {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    console.log('🗑️ LocalStorage cleared')
  }
}
