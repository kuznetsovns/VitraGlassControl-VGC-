import { useState, useEffect } from 'react'
import type { VitrageItem } from '../../types'
import { SegmentInfo } from './SegmentInfo'
import { InspectionForm } from './InspectionForm'
import { DefectSelector } from './DefectSelector'

interface DefectPanelProps {
  selectedSegmentId: string
  selectedVitrage: VitrageItem
  availableDefects: string[]
  loadSegmentData: (vitrageId: string, segmentId: string) => {
    inspectionDate: string
    inspector: string
    siteManager: string
    defects: string[]
  }
  saveSegmentData: (
    vitrageId: string,
    segmentId: string,
    data: {
      inspectionDate: string
      inspector: string
      siteManager: string
      defects: string[]
    }
  ) => Promise<{ success: boolean; source: 'supabase' | 'localStorage' }>
  addNewDefect: (name: string) => Promise<boolean>
  onClose: () => void
}

export function DefectPanel({
  selectedSegmentId,
  selectedVitrage,
  availableDefects,
  loadSegmentData,
  saveSegmentData,
  addNewDefect,
  onClose
}: DefectPanelProps) {
  const [inspectionDate, setInspectionDate] = useState('')
  const [inspector, setInspector] = useState('')
  const [siteManager, setSiteManager] = useState('')
  const [selectedDefects, setSelectedDefects] = useState<string[]>([])

  // Get display ID for the segment
  const getDisplayId = () => {
    const match = selectedSegmentId.match(/segment-(\d+)-(\d+)/)
    if (match) {
      const row = parseInt(match[1])
      const col = parseInt(match[2])
      const index = row * selectedVitrage.cols + col
      const segment = selectedVitrage.segments[index]
      if (segment && segment.id) {
        return segment.id
      }
    }
    return selectedSegmentId
  }

  // Загрузка данных сегмента при монтировании или изменении
  useEffect(() => {
    const data = loadSegmentData(selectedVitrage.id, selectedSegmentId)
    setInspectionDate(data.inspectionDate)
    setInspector(data.inspector)
    setSiteManager(data.siteManager)
    setSelectedDefects(data.defects)
  }, [selectedSegmentId, selectedVitrage.id, loadSegmentData])

  const handleToggleDefect = (defect: string) => {
    setSelectedDefects(prev =>
      prev.includes(defect)
        ? prev.filter(d => d !== defect)
        : [...prev, defect]
    )
  }

  const handleSave = async () => {
    const result = await saveSegmentData(
      selectedVitrage.id,
      selectedSegmentId,
      {
        inspectionDate,
        inspector,
        siteManager,
        defects: selectedDefects
      }
    )

    if (!result.success) {
      console.error('Ошибка при сохранении данных сегмента')
    } else {
      console.log(`✅ Данные сегмента сохранены (${result.source})`)
      onClose() // Закрываем панель после успешного сохранения
    }
  }

  // Отметить все дефекты как исправленные (очистить список дефектов)
  const handleMarkAsFixed = async () => {
    const result = await saveSegmentData(
      selectedVitrage.id,
      selectedSegmentId,
      {
        inspectionDate: new Date().toISOString().split('T')[0], // Текущая дата
        inspector,
        siteManager,
        defects: [], // Очищаем все дефекты
        markAsFixed: true // Флаг что сегмент исправлен
      } as any
    )

    if (result.success) {
      setSelectedDefects([]) // Очищаем локальное состояние
      setInspectionDate(new Date().toISOString().split('T')[0])
      console.log(`✅ Дефекты отмечены как исправленные (${result.source})`)
      onClose() // Закрываем панель после успешного сохранения
    } else {
      console.error('Ошибка при отметке дефектов как исправленных')
    }
  }

  const handleKeyPressInspection = (e: React.KeyboardEvent<HTMLInputElement>, nextInputId?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (nextInputId) {
        const nextInput = document.getElementById(nextInputId) as HTMLInputElement
        if (nextInput) {
          nextInput.focus()
        }
      }
    }
  }

  return (
    <div className="defect-panel">
      <div className="defect-panel-header">
        <h3>Дефекты сегмента #{getDisplayId()}</h3>
        <button className="close-panel-btn" onClick={onClose}>×</button>
      </div>

      <div className="defect-panel-content">
        <SegmentInfo
          selectedSegmentId={selectedSegmentId}
          selectedVitrage={selectedVitrage}
        />

        <InspectionForm
          inspectionDate={inspectionDate}
          inspector={inspector}
          siteManager={siteManager}
          onInspectionDateChange={setInspectionDate}
          onInspectorChange={setInspector}
          onSiteManagerChange={setSiteManager}
          onKeyPress={handleKeyPressInspection}
        />

        <DefectSelector
          availableDefects={availableDefects}
          selectedDefects={selectedDefects}
          onToggleDefect={handleToggleDefect}
          onAddNewDefect={addNewDefect}
        />
      </div>

      {/* Кнопки действий */}
      <div className="panel-actions">
        <button className="save-segment-btn" onClick={handleSave}>
          💾 Сохранить
        </button>
        {selectedDefects.length > 0 && (
          <button className="fixed-segment-btn" onClick={handleMarkAsFixed}>
            ✅ Исправлено
          </button>
        )}
      </div>
    </div>
  )
}
