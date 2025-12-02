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

    if (result.success) {
      const storageInfo = result.source === 'supabase'
        ? '☁️ Сохранено в облаке'
        : '📦 Сохранено локально'
      alert(`Данные сегмента сохранены!\n${storageInfo}`)
    } else {
      alert('Произошла ошибка при сохранении данных')
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
        <h3>Дефекты сегмента #{selectedSegmentId}</h3>
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

      {/* Кнопка сохранения */}
      <div className="panel-actions">
        <button className="save-segment-btn" onClick={handleSave}>
          💾 Сохранить данные сегмента
        </button>
      </div>
    </div>
  )
}
