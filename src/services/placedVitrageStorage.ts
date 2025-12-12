import { supabase } from '../lib/supabase'

// Типы данных для размещенных витражей
export interface PlacedVitrageData {
  id?: string
  object_id: string
  floor_plan_id?: string | null
  vitrage_id: string
  vitrage_name: string
  vitrage_data?: any // Полные данные витража
  position_x?: number | null
  position_y?: number | null
  rotation?: number
  scale?: number
  // ID компоненты
  id_object?: string | null
  id_corpus?: string | null
  id_section?: string | null
  id_floor?: string | null
  id_apartment?: string | null
  id_vitrage_number?: string | null
  id_vitrage_name?: string | null
  id_vitrage_section?: string | null
  full_id?: string // Автоматически генерируется в БД
  // Дефекты
  segment_defects?: Record<string, SegmentDefect>
  inspection_status?: 'not_checked' | 'in_progress' | 'checked' | 'approved' | 'rejected'
  inspection_date?: string | null
  inspector_name?: string | null
  inspection_notes?: string | null
  total_defects_count?: number
  defective_segments_count?: number
  // Метаданные
  created_at?: string
  created_by?: string | null
  updated_at?: string
  updated_by?: string | null
}

export interface SegmentDefect {
  defects: string[]
  status: 'ok' | 'defective' | 'not_checked'
  notes?: string
  checked_at?: string
  checked_by?: string
}

// Локальное хранилище как фолбэк
const LOCAL_STORAGE_KEY = 'placed-vitrages'

class LocalStorageService {
  async getAll(objectId?: string): Promise<PlacedVitrageData[]> {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const vitrages = stored ? JSON.parse(stored) : []

      if (objectId) {
        return vitrages.filter((v: PlacedVitrageData) => v.object_id === objectId)
      }

      return vitrages
    } catch (error) {
      console.error('LocalStorage read error:', error)
      return []
    }
  }

  async getById(id: string): Promise<PlacedVitrageData | null> {
    const vitrages = await this.getAll()
    return vitrages.find(v => v.id === id) || null
  }

  async create(data: PlacedVitrageData): Promise<PlacedVitrageData> {
    const vitrages = await this.getAll()
    const newVitrage = {
      ...data,
      id: data.id || Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    vitrages.push(newVitrage)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vitrages))

    return newVitrage
  }

  async update(id: string, data: Partial<PlacedVitrageData>): Promise<PlacedVitrageData | null> {
    const vitrages = await this.getAll()
    const index = vitrages.findIndex(v => v.id === id)

    if (index === -1) return null

    vitrages[index] = {
      ...vitrages[index],
      ...data,
      id: vitrages[index].id, // Сохраняем оригинальный ID
      updated_at: new Date().toISOString()
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(vitrages))
    return vitrages[index]
  }

  async delete(id: string): Promise<boolean> {
    const vitrages = await this.getAll()
    const filtered = vitrages.filter(v => v.id !== id)

    if (filtered.length === vitrages.length) return false

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered))
    return true
  }
}

const localStorageService = new LocalStorageService()

// Основной сервис для работы с размещенными витражами
export const placedVitrageStorage = {
  // Получить все витражи для объекта
  async getByObjectId(objectId: string): Promise<{
    data: PlacedVitrageData[],
    error: any,
    usingFallback: boolean
  }> {
    try {
      console.log('📍 Fetching placed vitrages for object:', objectId)

      const { data, error } = await supabase
        .from('placed_vitrages')
        .select('*')
        .eq('object_id', objectId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log(`✅ Loaded ${data?.length || 0} placed vitrages from Supabase`)
      return {
        data: data || [],
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback for placed vitrages')
      const data = await localStorageService.getAll(objectId)
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Получить витражи по плану этажа
  async getByFloorPlanId(floorPlanId: string): Promise<{
    data: PlacedVitrageData[],
    error: any,
    usingFallback: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('placed_vitrages')
        .select('*')
        .eq('floor_plan_id', floorPlanId)
        .order('position_x', { ascending: true })
        .order('position_y', { ascending: true })

      if (error) throw error

      return {
        data: data || [],
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback')
      const allVitrages = await localStorageService.getAll()
      const data = allVitrages.filter(v => v.floor_plan_id === floorPlanId)
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Получить витражи для дефектовки (все витражи с назначенными ID)
  async getForDefectTracking(objectId: string): Promise<{
    data: PlacedVitrageData[],
    error: any,
    usingFallback: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('placed_vitrages')
        .select('*')
        .eq('object_id', objectId)
        .order('full_id', { ascending: true })

      if (error) throw error

      // Фильтруем только витражи с назначенными ID
      const vitragesWithIds = (data || []).filter(vitrage => {
        // Проверяем что есть full_id (значит ID назначен)
        return vitrage.full_id && vitrage.full_id.length > 0
      })

      console.log(`🎯 Filtered ${vitragesWithIds.length} vitrages with IDs from ${data?.length || 0} total`)

      return {
        data: vitragesWithIds,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback')
      const data = await localStorageService.getAll(objectId)

      // Фильтруем только витражи с назначенными ID
      const vitragesWithIds = data.filter(vitrage => {
        return vitrage.full_id && vitrage.full_id.length > 0
      })

      // Сортируем по full_id
      vitragesWithIds.sort((a, b) => (a.full_id || '').localeCompare(b.full_id || ''))

      return {
        data: vitragesWithIds,
        error: null,
        usingFallback: true
      }
    }
  },

  // Создать новый размещенный витраж
  async create(vitrageData: PlacedVitrageData): Promise<{
    data: PlacedVitrageData | null,
    error: any,
    usingFallback: boolean
  }> {
    try {
      console.log('📝 Creating placed vitrage:', vitrageData.vitrage_name)

      // Инициализируем счетчики дефектов если не заданы
      const dataToInsert = {
        ...vitrageData,
        total_defects_count: vitrageData.total_defects_count || 0,
        defective_segments_count: vitrageData.defective_segments_count || 0,
        segment_defects: vitrageData.segment_defects || {},
        inspection_status: vitrageData.inspection_status || 'not_checked'
      }

      const { data, error } = await supabase
        .from('placed_vitrages')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Placed vitrage created in Supabase')
      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback to create')
      const dataToInsert = {
        ...vitrageData,
        total_defects_count: vitrageData.total_defects_count || 0,
        defective_segments_count: vitrageData.defective_segments_count || 0,
        segment_defects: vitrageData.segment_defects || {},
        inspection_status: vitrageData.inspection_status || 'not_checked'
      }
      const data = await localStorageService.create(dataToInsert)
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Обновить ID характеристики витража
  async updateVitrageId(
    vitrageId: string,
    idData: Partial<PlacedVitrageData>
  ): Promise<{
    data: PlacedVitrageData | null,
    error: any,
    usingFallback: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('placed_vitrages')
        .update({
          id_object: idData.id_object,
          id_corpus: idData.id_corpus,
          id_section: idData.id_section,
          id_floor: idData.id_floor,
          id_apartment: idData.id_apartment,
          id_vitrage_number: idData.id_vitrage_number,
          id_vitrage_name: idData.id_vitrage_name,
          id_vitrage_section: idData.id_vitrage_section,
          updated_at: new Date().toISOString()
        })
        .eq('id', vitrageId)
        .select()
        .single()

      if (error) throw error

      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback to update')
      const data = await localStorageService.update(vitrageId, idData)
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Обновить дефекты сегментов
  async updateSegmentDefects(
    vitrageId: string,
    segmentDefects: Record<string, SegmentDefect>
  ): Promise<{
    data: PlacedVitrageData | null,
    error: any,
    usingFallback: boolean
  }> {
    try {
      // Подсчитываем количество дефектов
      let totalDefectsCount = 0
      let defectiveSegmentsCount = 0

      for (const segmentKey in segmentDefects) {
        const segment = segmentDefects[segmentKey]
        if (segment.defects && segment.defects.length > 0) {
          defectiveSegmentsCount++
          totalDefectsCount += segment.defects.length
        }
      }

      const { data, error } = await supabase
        .from('placed_vitrages')
        .update({
          segment_defects: segmentDefects,
          total_defects_count: totalDefectsCount,
          defective_segments_count: defectiveSegmentsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', vitrageId)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Updated defects for vitrage ${vitrageId}: ${totalDefectsCount} defects in ${defectiveSegmentsCount} segments`)

      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback')

      // Подсчитываем для localStorage тоже
      let totalDefectsCount = 0
      let defectiveSegmentsCount = 0

      for (const segmentKey in segmentDefects) {
        const segment = segmentDefects[segmentKey]
        if (segment.defects && segment.defects.length > 0) {
          defectiveSegmentsCount++
          totalDefectsCount += segment.defects.length
        }
      }

      const data = await localStorageService.update(vitrageId, {
        segment_defects: segmentDefects,
        total_defects_count: totalDefectsCount,
        defective_segments_count: defectiveSegmentsCount
      })
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Обновить статус проверки
  async updateInspectionStatus(
    vitrageId: string,
    status: PlacedVitrageData['inspection_status'],
    inspectorName?: string,
    notes?: string
  ): Promise<{
    data: PlacedVitrageData | null,
    error: any,
    usingFallback: boolean
  }> {
    try {
      const updateData: any = {
        inspection_status: status,
        updated_at: new Date().toISOString()
      }

      if (status === 'checked' || status === 'approved' || status === 'rejected') {
        updateData.inspection_date = new Date().toISOString()
      }

      if (inspectorName) {
        updateData.inspector_name = inspectorName
      }

      if (notes) {
        updateData.inspection_notes = notes
      }

      const { data, error } = await supabase
        .from('placed_vitrages')
        .update(updateData)
        .eq('id', vitrageId)
        .select()
        .single()

      if (error) throw error

      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback')
      const data = await localStorageService.update(vitrageId, {
        inspection_status: status,
        inspection_date: new Date().toISOString(),
        inspector_name: inspectorName,
        inspection_notes: notes
      })
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Обновить весь витраж
  async update(
    vitrageId: string,
    updateData: Partial<PlacedVitrageData>
  ): Promise<{
    data: PlacedVitrageData | null,
    error: any,
    usingFallback: boolean
  }> {
    try {
      const { data, error } = await supabase
        .from('placed_vitrages')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', vitrageId)
        .select()
        .single()

      if (error) throw error

      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback')
      const data = await localStorageService.update(vitrageId, updateData)
      return {
        data,
        error: null,
        usingFallback: true
      }
    }
  },

  // Удалить витраж
  async delete(vitrageId: string): Promise<{
    error: any,
    usingFallback: boolean
  }> {
    try {
      const { error } = await supabase
        .from('placed_vitrages')
        .delete()
        .eq('id', vitrageId)

      if (error) throw error

      return {
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Using localStorage fallback')
      await localStorageService.delete(vitrageId)
      return {
        error: null,
        usingFallback: true
      }
    }
  },

  // Получить статистику по дефектам для объекта
  async getDefectsStatistics(objectId: string): Promise<{
    totalVitrages: number,
    checkedVitrages: number,
    defectiveVitrages: number,
    totalDefects: number,
    data?: PlacedVitrageData[],
    error?: any
  }> {
    try {
      const { data, error } = await supabase
        .from('placed_vitrages')
        .select('*')
        .eq('object_id', objectId)

      if (error) throw error

      const stats = {
        totalVitrages: data?.length || 0,
        checkedVitrages: 0,
        defectiveVitrages: 0,
        totalDefects: 0,
        data
      }

      data?.forEach(vitrage => {
        if (vitrage.inspection_status === 'checked' ||
            vitrage.inspection_status === 'approved' ||
            vitrage.inspection_status === 'rejected') {
          stats.checkedVitrages++
        }

        if ((vitrage.total_defects_count || 0) > 0) {
          stats.defectiveVitrages++
          stats.totalDefects += vitrage.total_defects_count || 0
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting defects statistics:', error)
      return {
        totalVitrages: 0,
        checkedVitrages: 0,
        defectiveVitrages: 0,
        totalDefects: 0,
        error
      }
    }
  }
}