import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Типы данных для дефектовки витражей
export interface DefectVitrageData {
  id?: string
  object_id: string
  placed_vitrage_id?: string | null

  // Информация о витраже
  vitrage_id: string
  vitrage_name: string
  vitrage_data: {
    rows: number
    cols: number
    totalWidth: number
    totalHeight: number
    segments: any[]
    svgDrawing?: string
  }

  // 8-компонентный ID
  id_object?: string | null
  id_corpus?: string | null
  id_section?: string | null
  id_floor?: string | null
  id_apartment?: string | null
  id_vitrage_number?: string | null
  id_vitrage_name?: string | null
  id_vitrage_section?: string | null
  full_id?: string // Генерируется автоматически в БД

  // Дефекты
  segment_defects?: Record<string, SegmentDefect>
  total_defects_count?: number
  defective_segments_count?: number

  // Проверка
  inspection_status?: 'not_checked' | 'in_progress' | 'checked' | 'approved' | 'rejected'
  inspection_date?: string | null
  inspector_name?: string | null
  supervisor_name?: string | null
  inspection_notes?: string | null

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

// Сервис для работы с дефектовкой витражей
export const defectVitrageStorage = {
  // Получить все витражи для дефектовки объекта
  async getByObjectId(objectId: string): Promise<{
    data: DefectVitrageData[]
    error: any
  }> {
    try {
      console.log('🔍 Loading defect vitrages for object:', objectId)

      const { data, error } = await supabase
        .from('defect_vitrages')
        .select('*')
        .eq('object_id', objectId)
        .order('full_id', { ascending: true })

      if (error) {
        console.error('❌ Supabase error loading defect vitrages:', error)
        throw error
      }

      console.log(`📦 Loaded ${data?.length || 0} defect vitrages from Supabase`)

      return {
        data: data || [],
        error: null
      }
    } catch (error) {
      console.error('⚠️ Exception loading defect vitrages:', error)
      return {
        data: [],
        error
      }
    }
  },

  // Получить витраж для дефектовки по ID
  async getById(id: string): Promise<{
    data: DefectVitrageData | null
    error: any
  }> {
    try {
      const { data, error } = await supabase
        .from('defect_vitrages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('Error loading defect vitrage:', error)
      return {
        data: null,
        error
      }
    }
  },

  // Создать или обновить витраж для дефектовки
  async upsert(vitrageData: DefectVitrageData): Promise<{
    data: DefectVitrageData | null
    error: any
  }> {
    try {
      console.log('💾 Upserting defect vitrage:', vitrageData.vitrage_name)

      // Проверяем есть ли уже такой витраж (по object_id и full_id)
      if (vitrageData.full_id) {
        const { data: existing } = await supabase
          .from('defect_vitrages')
          .select('id')
          .eq('object_id', vitrageData.object_id)
          .eq('full_id', vitrageData.full_id)
          .maybeSingle()

        if (existing) {
          console.log('📝 Updating existing defect vitrage:', existing.id)
          // Обновляем существующий
          const { data, error } = await supabase
            .from('defect_vitrages')
            .update({
              ...vitrageData,
              id: existing.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single()

          if (error) throw error

          console.log('✅ Defect vitrage updated')
          return { data, error: null }
        }
      }

      // Создаем новый
      console.log('📝 Creating new defect vitrage')
      const dataToInsert = {
        ...vitrageData,
        id: vitrageData.id || uuidv4(),
        total_defects_count: vitrageData.total_defects_count || 0,
        defective_segments_count: vitrageData.defective_segments_count || 0,
        segment_defects: vitrageData.segment_defects || {},
        inspection_status: vitrageData.inspection_status || 'not_checked'
      }

      const { data, error } = await supabase
        .from('defect_vitrages')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error creating defect vitrage:', error)
        throw error
      }

      console.log('✅ Defect vitrage created:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('⚠️ Exception upserting defect vitrage:', error)
      return {
        data: null,
        error
      }
    }
  },

  // Обновить дефекты сегментов
  async updateSegmentDefects(
    vitrageId: string,
    segmentDefects: Record<string, SegmentDefect>
  ): Promise<{
    data: DefectVitrageData | null
    error: any
  }> {
    try {
      console.log('🔧 Updating segment defects for defect vitrage:', vitrageId)
      console.log('📋 Segment defects:', segmentDefects)

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

      console.log(`📊 Defects count: ${totalDefectsCount} defects in ${defectiveSegmentsCount} segments`)

      const { data, error } = await supabase
        .from('defect_vitrages')
        .update({
          segment_defects: segmentDefects,
          total_defects_count: totalDefectsCount,
          defective_segments_count: defectiveSegmentsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', vitrageId)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error updating defects:', error)
        throw error
      }

      console.log(`✅ Updated defects for defect vitrage ${vitrageId}: ${totalDefectsCount} defects in ${defectiveSegmentsCount} segments`)

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('⚠️ Exception updating defects:', error)
      return {
        data: null,
        error
      }
    }
  },

  // Обновить статус проверки
  async updateInspectionStatus(
    vitrageId: string,
    status: DefectVitrageData['inspection_status'],
    inspectorName?: string,
    supervisorName?: string,
    notes?: string
  ): Promise<{
    data: DefectVitrageData | null
    error: any
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

      if (supervisorName) {
        updateData.supervisor_name = supervisorName
      }

      if (notes) {
        updateData.inspection_notes = notes
      }

      const { data, error } = await supabase
        .from('defect_vitrages')
        .update(updateData)
        .eq('id', vitrageId)
        .select()
        .single()

      if (error) throw error

      return {
        data,
        error: null
      }
    } catch (error) {
      console.error('Error updating inspection status:', error)
      return {
        data: null,
        error
      }
    }
  },

  // Удалить витраж из дефектовки
  async delete(vitrageId: string): Promise<{
    error: any
  }> {
    try {
      const { error } = await supabase
        .from('defect_vitrages')
        .delete()
        .eq('id', vitrageId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting defect vitrage:', error)
      return { error }
    }
  },

  // Получить статистику по дефектам для объекта
  async getDefectsStatistics(objectId: string): Promise<{
    totalVitrages: number
    checkedVitrages: number
    defectiveVitrages: number
    totalDefects: number
    data?: DefectVitrageData[]
    error?: any
  }> {
    try {
      const { data, error } = await supabase
        .from('defect_vitrages')
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
