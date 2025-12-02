import { useState, useEffect } from 'react'
import type { VitrageItem, ProjectObject } from '../types'
import type { SegmentDefectData } from '../../../services/defectStorage'
import { exportDefectsToExcel } from '../utils/csvExport'

export function useDefectExport(
  filteredVitrages: VitrageItem[],
  segmentDefectsData: Map<string, SegmentDefectData>,
  objects: ProjectObject[]
) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Закрытие меню экспорта при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showExportMenu && !target.closest('.export-dropdown')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showExportMenu])

  const handleExportAll = () => {
    if (filteredVitrages.length === 0) {
      alert('Нет данных для экспорта')
      return
    }
    const date = new Date().toISOString().split('T')[0]
    exportDefectsToExcel(filteredVitrages, `defects_all_vitrages_${date}.csv`, segmentDefectsData, objects)
    setShowExportMenu(false)
  }

  const handleExportSelected = (selectedVitrage: VitrageItem | null) => {
    if (!selectedVitrage) {
      alert('Выберите витраж для экспорта')
      return
    }
    const date = new Date().toISOString().split('T')[0]
    exportDefectsToExcel([selectedVitrage], `defects_${selectedVitrage.name}_${date}.csv`, segmentDefectsData, objects)
    setShowExportMenu(false)
  }

  const handleExportOnlyWithDefects = () => {
    // Экспортировать только витражи с дефектами
    const vitragesWithDefects = filteredVitrages.filter(vitrage => {
      for (let i = 0; i < vitrage.segments.length; i++) {
        const key = `${vitrage.id}-${i + 1}`
        const defectData = segmentDefectsData.get(key)
        if (defectData?.defects?.length > 0) {
          return true
        }
      }
      return false
    })

    if (vitragesWithDefects.length === 0) {
      alert('Нет витражей с дефектами для экспорта')
      return
    }

    const date = new Date().toISOString().split('T')[0]
    exportDefectsToExcel(vitragesWithDefects, `defects_with_issues_${date}.csv`, segmentDefectsData, objects)
    setShowExportMenu(false)
  }

  return {
    showExportMenu,
    setShowExportMenu,
    handleExportAll,
    handleExportSelected,
    handleExportOnlyWithDefects
  }
}
