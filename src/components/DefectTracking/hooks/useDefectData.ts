import { useState, useEffect } from 'react'
import type { ProjectObject, VitrageItem } from '../types'
import { vitrageStorage } from '../../../services/vitrageStorage'
import { defectStorage, type SegmentDefectData } from '../../../services/defectStorage'

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

  // Загрузка объектов, витражей и дефектов
  useEffect(() => {
    const loadedObjects = localStorage.getItem('project-objects')
    if (loadedObjects) {
      setObjects(JSON.parse(loadedObjects))
    }

    // Загрузка витражей через сервис
    const loadVitrages = async () => {
      try {
        const { data, source } = await vitrageStorage.getAll()
        setVitrages(data as VitrageItem[])
        setStorageSource(source)
        console.log(`📋 Витражи загружены из ${source}:`, data.length)
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error)
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
  }, [])

  // Фильтрация витражей по выбранному объекту
  useEffect(() => {
    let filtered = vitrages

    if (selectedObject) {
      filtered = filtered.filter(v => v.objectId === selectedObject.id)
    }

    setFilteredVitrages(filtered)
  }, [selectedObject, vitrages])

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
      // Сохраняем через сервис (Supabase или localStorage)
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
    saveSegmentData
  }
}
