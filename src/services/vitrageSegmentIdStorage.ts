import { supabase } from '../lib/supabase'
import type {
  DatabaseVitrageSegmentId,
  DatabaseVitrageSegmentIdInsert,
  DatabaseVitrageSegmentIdUpdate
} from '../types/database'

// Тип для маппинга ID сегментов
export interface SegmentIDData {
  object: string
  corpus: string
  section: string
  floor: string
  apartment: string
  vitrageNumber: string
  vitrageName: string
  vitrageSection: string
}

export type SegmentIDMapping = Record<string, SegmentIDData> // "segment-0-0" -> SegmentIDData

// Локальное хранилище как фолбэк
const LOCAL_STORAGE_KEY = 'vitrage-segment-ids'

class LocalStorageService {
  async getByPlacedVitrageId(placedVitrageId: string): Promise<SegmentIDMapping> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const allMappings = stored ? JSON.parse(stored) : {}
      return allMappings[placedVitrageId] || {}
    } catch (error) {
      console.error('LocalStorage read error:', error)
      return {}
    }
  }

  async save(placedVitrageId: string, segmentIDs: SegmentIDMapping): Promise<void> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const allMappings = stored ? JSON.parse(stored) : {}
      allMappings[placedVitrageId] = segmentIDs
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allMappings))
    } catch (error) {
      console.error('LocalStorage write error:', error)
    }
  }

  async delete(placedVitrageId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const allMappings = stored ? JSON.parse(stored) : {}
      delete allMappings[placedVitrageId]
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allMappings))
    } catch (error) {
      console.error('LocalStorage delete error:', error)
    }
  }
}

const localStorageService = new LocalStorageService()

// Основной сервис для работы с ID сегментов
export const vitrageSegmentIdStorage = {
  // Получить все ID сегментов для размещенного витража
  async getByPlacedVitrageId(placedVitrageId: string): Promise<{
    data: SegmentIDMapping
    error: any
    usingFallback: boolean
  }> {
    try {
      console.log('📍 Fetching segment IDs for placed vitrage:', placedVitrageId)

      const { data, error } = await supabase
        .from('vitrage_segment_ids')
        .select('*')
        .eq('placed_vitrage_id', placedVitrageId)

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      // Преобразуем массив в маппинг
      const mapping: SegmentIDMapping = {}
      data?.forEach((row: DatabaseVitrageSegmentId) => {
        mapping[row.segment_key] = {
          object: row.id_object || '',
          corpus: row.id_corpus || '',
          section: row.id_section || '',
          floor: row.id_floor || '',
          apartment: row.id_apartment || '',
          vitrageNumber: row.id_vitrage_number || '',
          vitrageName: row.id_vitrage_name || '',
          vitrageSection: row.id_vitrage_section || ''
        }
      })

      console.log(`✅ Loaded ${Object.keys(mapping).length} segment IDs from Supabase`)
      return {
        data: mapping,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback for segment IDs')
      const data = await localStorageService.getByPlacedVitrageId(placedVitrageId)
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Сохранить ID сегментов для размещенного витража
  async saveForPlacedVitrage(
    placedVitrageId: string,
    segmentIDs: SegmentIDMapping
  ): Promise<{
    error: any
    usingFallback: boolean
  }> {
    try {
      console.log(`📝 Saving ${Object.keys(segmentIDs).length} segment IDs for placed vitrage:`, placedVitrageId)

      // Удаляем существующие ID
      await supabase
        .from('vitrage_segment_ids')
        .delete()
        .eq('placed_vitrage_id', placedVitrageId)

      // Создаем новые записи
      const rows: DatabaseVitrageSegmentIdInsert[] = Object.entries(segmentIDs).map(([segmentKey, idData]) => ({
        placed_vitrage_id: placedVitrageId,
        segment_key: segmentKey,
        id_object: idData.object || null,
        id_corpus: idData.corpus || null,
        id_section: idData.section || null,
        id_floor: idData.floor || null,
        id_apartment: idData.apartment || null,
        id_vitrage_number: idData.vitrageNumber || null,
        id_vitrage_name: idData.vitrageName || null,
        id_vitrage_section: idData.vitrageSection || null
      }))

      if (rows.length > 0) {
        const { error } = await supabase
          .from('vitrage_segment_ids')
          .insert(rows)

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }
      }

      console.log('✅ Segment IDs saved to Supabase')
      return {
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback to save segment IDs')
      await localStorageService.save(placedVitrageId, segmentIDs)
      return {
        error: null,
        usingFallback: true
      }
    }
  },

  // Удалить ID сегментов для размещенного витража
  async deleteForPlacedVitrage(placedVitrageId: string): Promise<{
    error: any
    usingFallback: boolean
  }> {
    try {
      const { error } = await supabase
        .from('vitrage_segment_ids')
        .delete()
        .eq('placed_vitrage_id', placedVitrageId)

      if (error) throw error

      console.log('✅ Segment IDs deleted from Supabase')
      return {
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback to delete')
      await localStorageService.delete(placedVitrageId)
      return {
        error: null,
        usingFallback: true
      }
    }
  }
}
