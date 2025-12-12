import { useState, useEffect } from 'react'
import type { ProjectObject, VitrageItem } from '../types'
import { vitrageStorage } from '../../../services/vitrageStorage'
import { defectStorage, type SegmentDefectData } from '../../../services/defectStorage'
import { defectVitrageStorage, type DefectVitrageData } from '../../../services/defectVitrageStorage'

export function useDefectData(selectedObject?: { id: string; name: string } | null) {
  const [objects, setObjects] = useState<ProjectObject[]>([])
  const [vitrages, setVitrages] = useState<VitrageItem[]>([])
  const [filteredVitrages, setFilteredVitrages] = useState<VitrageItem[]>([])

  const [availableDefects, setAvailableDefects] = useState<string[]>([
    'Царапины',
    'Сколы',
    'Трещины',
    'Загрязнения',
    'Деформация',
    'Разгерметизация',
    'Запотевание',
    'Некачественный монтаж'
  ])
  const [selectedDefects, setSelectedDefects] = useState<string[]>([])

  const [segmentDefectsData, setSegmentDefectsData] = useState<Map<string, SegmentDefectData>>(new Map())
  const [storageSource, setStorageSource] = useState<'supabase' | 'localStorage'>('localStorage')
  const [defectVitrages, setDefectVitrages] = useState<DefectVitrageData[]>([])

  // Загрузка объектов, витражей и дефектов
  useEffect(() => {
    const loadedObjects = localStorage.getItem('project-objects')
    if (loadedObjects) {
      setObjects(JSON.parse(loadedObjects))
    }

    // Загрузка витражей через сервис
    const loadVitrages = async () => {
      try {
        // Для страницы дефектовки загружаем витражи из defect_vitrages
        if (selectedObject?.id) {
          const defectResult = await defectVitrageStorage.getByObjectId(selectedObject.id)

          console.log(`🎯 Загружено ${defectResult.data.length} витражей для дефектовки из Supabase`)
          setDefectVitrages(defectResult.data)

          // Преобразуем дефектовочные витражи в формат VitrageItem для отображения
          const vitrageItems: VitrageItem[] = defectResult.data.map(dv => ({
            id: dv.id || dv.vitrage_id,
            name: dv.vitrage_name,
            marking: dv.full_id || dv.vitrage_name,
            objectId: dv.object_id,
            objectName: selectedObject?.name,
            corpus: dv.id_corpus || undefined,
            section: dv.id_section || undefined,
            floor: dv.id_floor || undefined,
            vitrageName: dv.vitrage_name,
            vitrageData: dv.vitrage_data,
            rows: dv.vitrage_data?.rows || 1,
            cols: dv.vitrage_data?.cols || 1,
            totalWidth: dv.vitrage_data?.totalWidth || 1000,
            totalHeight: dv.vitrage_data?.totalHeight || 1000,
            segments: dv.vitrage_data?.segments || [],
            svgDrawing: dv.vitrage_data?.svgDrawing,
            segmentDefects: dv.segment_defects,
            inspectionStatus: dv.inspection_status,
            siteManager: dv.supervisor_name,
            creationDate: dv.created_at ? new Date(dv.created_at).toLocaleDateString('ru-RU') : undefined,
            defectiveSegmentsCount: dv.defective_segments_count,
            totalDefectsCount: dv.total_defects_count,
            createdAt: dv.created_at ? new Date(dv.created_at) : new Date()
          }))

          setVitrages(vitrageItems)
          setStorageSource('supabase')
        } else {
          // Если объект не выбран, показываем пустой список
          console.log('⚠️ Объект не выбран, витражи не загружаются')
          setVitrages([])
          setDefectVitrages([])
          setStorageSource('localStorage')
        }
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error)
        setVitrages([])
        setDefectVitrages([])
      }
    }

    // Загрузка типов дефектов через сервис
    const loadDefectTypes = async () => {
      try {
        const { data } = await defectStorage.getDefectTypes()
        setAvailableDefects(data.map(d => d.name))
      } catch (error) {
        console.error('Ошибка при загрузке типов дефектов:', error)
      }
    }

    // Загрузка данных о дефектах через сервис
    const loadDefectsData = async () => {
      try {
        const { data } = await defectStorage.getAll()
        setSegmentDefectsData(data)
      } catch (error) {
        console.error('Ошибка при загрузке данных дефектов:', error)
      }
    }

    loadVitrages()
    loadDefectTypes()
    loadDefectsData()
  }, [selectedObject])

  // Фильтрация витражей по выбранному объекту
  useEffect(() => {
    // На странице дефектовки показываем только витражи, которые уже были отфильтрованы по дефектам
    // Дополнительная фильтрация по объекту не нужна, так как витражи уже загружены для конкретного объекта
    setFilteredVitrages(vitrages)
  }, [vitrages])

  // Функция для добавления нового типа дефекта
  const addNewDefect = async (newDefectName: string) => {
    if (newDefectName.trim() && !availableDefects.includes(newDefectName.trim())) {
      try {
        await defectStorage.addDefectType(newDefectName.trim())
        setAvailableDefects(prev => [...prev, newDefectName.trim()])
        setSelectedDefects(prev => [...prev, newDefectName.trim()])
        return true
      } catch (error) {
        console.error('Ошибка при добавлении типа дефекта:', error)
        return false
      }
    }
    return false
  }

  // Функция для загрузки данных сегмента
  const loadSegmentData = (vitrageId: string, segmentId: string) => {
    console.log('🔍 Загрузка данных сегмента:', { vitrageId, segmentId })

    // Сначала проверяем, есть ли данные в дефектовочных витражах
    if (selectedObject?.id && defectVitrages.length > 0) {
      const defectVitrage = defectVitrages.find(dv =>
        dv.id === vitrageId || dv.vitrage_id === vitrageId
      )

      console.log('🎯 Найден defectVitrage:', !!defectVitrage, defectVitrage?.id)

      if (defectVitrage?.segment_defects) {
        // segmentId может быть в формате "segment-0-1" или просто "0"
        // Нужно найти соответствующий ключ в segment_defects
        let segmentKey = segmentId

        // Если segmentId содержит "segment-", используем его как есть
        if (!segmentId.startsWith('segment-')) {
          segmentKey = `segment-${segmentId}`
        }

        console.log('🔑 Ищем ключ:', segmentKey, 'в', Object.keys(defectVitrage.segment_defects))
        const segmentData = defectVitrage.segment_defects[segmentKey]

        if (segmentData) {
          console.log('✅ Данные сегмента найдены:', segmentData)

          // Извлекаем siteManager из notes
          let siteManager = ''
          if (segmentData.notes) {
            const match = segmentData.notes.match(/Начальник участка:\s*(.+?)(?:,|$)/)
            if (match) {
              siteManager = match[1].trim()
            }
          }

          return {
            inspectionDate: segmentData.checked_at || new Date().toISOString().split('T')[0],
            inspector: segmentData.checked_by || '',
            siteManager,
            defects: segmentData.defects || []
          }
        } else {
          console.log('⚠️ Данные сегмента не найдены по ключу:', segmentKey)
        }
      }
    }

    // Затем проверяем локальное состояние
    const key = `${vitrageId}-${segmentId}`
    const savedData = segmentDefectsData.get(key)

    if (savedData) {
      return {
        inspectionDate: savedData.inspectionDate,
        inspector: savedData.inspector,
        siteManager: savedData.siteManager,
        defects: savedData.defects
      }
    }

    // Значения по умолчанию
    return {
      inspectionDate: new Date().toISOString().split('T')[0],
      inspector: '',
      siteManager: '',
      defects: []
    }
  }

  // Функция для сохранения данных сегмента
  const saveSegmentData = async (
    vitrageId: string,
    segmentId: string,
    data: {
      inspectionDate: string
      inspector: string
      siteManager: string
      defects: string[]
    }
  ) => {
    const key = `${vitrageId}-${segmentId}`

    // Парсим segmentId в зависимости от формата
    let segmentKey = segmentId
    if (!segmentId.startsWith('segment-')) {
      segmentKey = `segment-${segmentId}`
    }

    // Извлекаем индекс из segmentKey для совместимости со старым кодом
    const segmentIndexMatch = segmentKey.match(/segment-(\d+)/)
    const segmentIndex = segmentIndexMatch ? parseInt(segmentIndexMatch[1]) : parseInt(segmentId)

    try {
      console.log('💾 Попытка сохранить дефекты сегмента:', { vitrageId, segmentId, segmentKey, selectedObjectId: selectedObject?.id, defectVitragesCount: defectVitrages.length })

      // Если выбран объект и есть дефектовочные витражи, сохраняем в defect_vitrages
      if (selectedObject?.id && defectVitrages.length > 0) {
        console.log('🔍 Ищем витраж в defectVitrages...')
        console.log('📋 Доступные ID:', defectVitrages.map(dv => ({ id: dv.id, vitrage_id: dv.vitrage_id })))

        // Находим витраж для дефектовки по ID
        const defectVitrage = defectVitrages.find(dv =>
          dv.id === vitrageId || dv.vitrage_id === vitrageId
        )

        console.log('🎯 Найденный витраж:', defectVitrage ? 'Найден' : 'НЕ найден', defectVitrage?.id)

        if (defectVitrage && defectVitrage.id) {
          // Получаем текущие дефекты сегментов или создаем новый объект
          const currentSegmentDefects = defectVitrage.segment_defects || {}

          // Обновляем дефекты для конкретного сегмента
          currentSegmentDefects[segmentKey] = {
            defects: data.defects,
            status: data.defects.length > 0 ? 'defective' : 'ok',
            notes: `Проверил: ${data.inspector}, Начальник участка: ${data.siteManager}`,
            checked_at: data.inspectionDate,
            checked_by: data.inspector
          }

          // Сохраняем обновленные дефекты в Supabase
          const { data: updatedVitrage } = await defectVitrageStorage.updateSegmentDefects(
            defectVitrage.id,
            currentSegmentDefects
          )

          // Обновляем статус проверки витража
          if (updatedVitrage) {
            await defectVitrageStorage.updateInspectionStatus(
              defectVitrage.id,
              'in_progress',
              data.inspector,
              data.siteManager,
              `Последняя проверка: ${new Date().toLocaleDateString('ru-RU')}`
            )
          }

          // Обновляем локальное состояние
          const newData: SegmentDefectData = {
            vitrageId,
            segmentIndex,
            ...data
          }

          setSegmentDefectsData(prev => {
            const newMap = new Map(prev)
            newMap.set(key, newData)
            return newMap
          })

          return { success: true, source: 'supabase' }
        } else {
          console.warn('⚠️ Витраж не найден в defectVitrages, используем localStorage')
        }
      } else {
        console.warn('⚠️ Условие не выполнено:', { hasObject: !!selectedObject?.id, hasDefectVitrages: defectVitrages.length > 0 })
      }

      // Иначе используем старый метод сохранения
      console.log('📝 Сохраняем через defectStorage (localStorage)')
      const { source } = await defectStorage.saveSegmentDefects(
        vitrageId,
        segmentIndex,
        data
      )

      // Обновляем локальное состояние
      const newData: SegmentDefectData = {
        vitrageId,
        segmentIndex,
        ...data
      }

      setSegmentDefectsData(prev => {
        const newMap = new Map(prev)
        newMap.set(key, newData)
        return newMap
      })

      return { success: true, source }
    } catch (error) {
      console.error('Ошибка при сохранении дефектов:', error)
      return { success: false, source: 'localStorage' as const }
    }
  }

  return {
    objects,
    vitrages,
    filteredVitrages,
    availableDefects,
    selectedDefects,
    setSelectedDefects,
    segmentDefectsData,
    storageSource,
    addNewDefect,
    loadSegmentData,
    saveSegmentData,
    defectVitrages
  }
}
