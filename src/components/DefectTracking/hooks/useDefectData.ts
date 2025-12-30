import { useState, useEffect } from 'react'
import type { ProjectObject, VitrageItem } from '../types'
import { vitrageStorage } from '../../../services/vitrageStorage'
import { defectStorage, type SegmentDefectData } from '../../../services/defectStorage'
import { placedVitrageStorage, type PlacedVitrageData } from '../../../services/placedVitrageStorage'

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
  const [placedVitrages, setPlacedVitrages] = useState<PlacedVitrageData[]>([])

  // Загрузка объектов, витражей и дефектов
  useEffect(() => {
    const loadedObjects = localStorage.getItem('project-objects')
    if (loadedObjects) {
      setObjects(JSON.parse(loadedObjects))
    }

    // Загрузка витражей через сервис
    const loadVitrages = async () => {
      try {
        // Для страницы дефектовки загружаем ТОЛЬКО витражи с дефектами из placed_vitrages
        if (selectedObject?.id) {
          const placedResult = await placedVitrageStorage.getForDefectTracking(selectedObject.id)

          console.log(`🎯 Загружено ${placedResult.data.length} витражей с дефектами из ${placedResult.usingFallback ? 'localStorage' : 'Supabase'}`)
          setPlacedVitrages(placedResult.data)

          // Загружаем оригинальные витражи для получения svgDrawing (если отсутствует в vitrage_data)
          const { data: originalVitrages } = await vitrageStorage.getAll()
          const vitrageMap = new Map(originalVitrages.map(v => [v.id, v]))

          // Преобразуем размещенные витражи в формат VitrageItem для отображения
          const vitrageItems: VitrageItem[] = placedResult.data.map(pv => {
            // Пытаемся получить svgDrawing из vitrage_data, если нет - из оригинального витража
            let svgDrawing = pv.vitrage_data?.svgDrawing
            if (!svgDrawing && pv.vitrage_id) {
              const originalVitrage = vitrageMap.get(pv.vitrage_id)
              if (originalVitrage?.svgDrawing) {
                svgDrawing = originalVitrage.svgDrawing
                console.log(`📐 SVG загружен из оригинального витража для ${pv.vitrage_name}`)
              }
            }

            return {
              id: pv.id || pv.vitrage_id,
              name: pv.vitrage_name,
              marking: pv.full_id || pv.vitrage_name,
              objectId: pv.object_id,
              objectName: selectedObject.name, // Название объекта из выбранного объекта
              rows: pv.vitrage_data?.rows || 1,
              cols: pv.vitrage_data?.cols || 1,
              totalWidth: pv.vitrage_data?.totalWidth || 1000,
              totalHeight: pv.vitrage_data?.totalHeight || 1000,
              segments: pv.vitrage_data?.segments || [],
              svgDrawing: svgDrawing, // SVG-отрисовка из Конструктора или из оригинального витража
              vitrageData: pv.vitrage_data,
              segmentDefects: pv.segment_defects,
              inspectionStatus: pv.inspection_status,
              defectiveSegmentsCount: pv.defective_segments_count,
              totalDefectsCount: pv.total_defects_count,
              createdAt: pv.created_at || new Date().toISOString()
            }
          })

          setVitrages(vitrageItems)
          setStorageSource(placedResult.usingFallback ? 'localStorage' : 'supabase')
        } else {
          // Если объект не выбран, показываем пустой список
          console.log('⚠️ Объект не выбран, витражи не загружаются')
          setVitrages([])
          setPlacedVitrages([])
          setStorageSource('localStorage')
        }
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error)
        setVitrages([])
        setPlacedVitrages([])
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
    // Сначала проверяем, есть ли данные в размещенных витражах
    if (selectedObject?.id && placedVitrages.length > 0) {
      const placedVitrage = placedVitrages.find(pv =>
        pv.id === vitrageId || pv.vitrage_id === vitrageId
      )

      if (placedVitrage?.segment_defects) {
        const segmentIndex = parseInt(segmentId)
        const segmentKey = `segment-${segmentIndex}`
        const segmentData = placedVitrage.segment_defects[segmentKey]

        if (segmentData) {
          return {
            inspectionDate: segmentData.checked_at || new Date().toISOString().split('T')[0],
            inspector: segmentData.checked_by || '',
            siteManager: segmentData.notes?.includes('Прораб:')
              ? segmentData.notes.split('Прораб:')[1]?.trim() || ''
              : '',
            defects: segmentData.defects || []
          }
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
    const segmentIndex = parseInt(segmentId)

    try {
      // Пытаемся сохранить напрямую в placed_vitrages по ID витража
      // vitrageId должен быть ID из placed_vitrages (не vitrage_id типового витража)
      if (selectedObject?.id) {
        // Сначала проверяем в локальном кэше
        let placedVitrage = placedVitrages.find(pv =>
          pv.id === vitrageId || pv.vitrage_id === vitrageId
        )

        // Если не нашли в кэше, пытаемся получить текущие дефекты напрямую из storage
        // Это важно для первого назначения дефектов, когда витраж ещё не в списке с дефектами
        let currentSegmentDefects: Record<string, any> = {}

        if (placedVitrage) {
          currentSegmentDefects = placedVitrage.segment_defects || {}
        }

        // Обновляем дефекты для конкретного сегмента
        const segmentKey = `segment-${segmentIndex}`
        // Определяем статус: fixed (исправлено), defective (с дефектами), ok (без дефектов)
        let segmentStatus: 'ok' | 'defective' | 'fixed' = 'ok'
        if (data.defects.length > 0) {
          segmentStatus = 'defective'
        } else if ((data as any).markAsFixed) {
          segmentStatus = 'fixed' // Явно отмечено как исправленное
        }

        currentSegmentDefects[segmentKey] = {
          defects: data.defects,
          status: segmentStatus,
          notes: `Проверил: ${data.inspector}, Прораб: ${data.siteManager}`,
          checked_at: data.inspectionDate,
          checked_by: data.inspector
        }

        // Сохраняем обновленные дефекты в Supabase/localStorage
        // Используем vitrageId напрямую - это должен быть ID из placed_vitrages
        const { data: updatedVitrage, usingFallback } = await placedVitrageStorage.updateSegmentDefects(
          vitrageId,
          currentSegmentDefects
        )

        // Обновляем статус проверки витража
        if (updatedVitrage) {
          await placedVitrageStorage.updateInspectionStatus(
            vitrageId,
            'in_progress',
            data.inspector,
            `Последняя проверка: ${new Date().toLocaleDateString('ru-RU')}`
          )

          console.log(`✅ Дефекты сохранены для витража ${vitrageId}, сегмент ${segmentIndex}`)
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

        return { success: true, source: usingFallback ? 'localStorage' : 'supabase' }
      }

      // Fallback: используем старый метод сохранения если объект не выбран
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
    placedVitrages
  }
}
