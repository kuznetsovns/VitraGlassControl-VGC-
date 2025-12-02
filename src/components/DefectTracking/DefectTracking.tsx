import { useState } from 'react'
import './DefectTracking.css'
import type { DefectTrackingProps, VitrageItem } from './types'
import { useDefectData } from './hooks/useDefectData'
import { useDefectExport } from './hooks/useDefectExport'
import { DefectWorkspace } from './components/DefectWorkspace/DefectWorkspace'
import { DefectListView } from './components/DefectListView/DefectListView'

export default function DefectTracking({ selectedObject }: DefectTrackingProps) {
  const [selectedVitrageForView, setSelectedVitrageForView] = useState<VitrageItem | null>(null)

  const defectData = useDefectData(selectedObject)
  const exportControls = useDefectExport(
    defectData.filteredVitrages,
    defectData.segmentDefectsData,
    defectData.objects
  )

  const handleVitrageClick = (vitrage: VitrageItem) => {
    setSelectedVitrageForView(vitrage)
  }

  const handleBackToList = () => {
    setSelectedVitrageForView(null)
  }

  // Если выбран витраж для просмотра - показываем полноэкранную отрисовку
  if (selectedVitrageForView) {
    return (
      <DefectWorkspace
        vitrage={selectedVitrageForView}
        onBack={handleBackToList}
        availableDefects={defectData.availableDefects}
        segmentDefectsData={defectData.segmentDefectsData}
        loadSegmentData={defectData.loadSegmentData}
        saveSegmentData={defectData.saveSegmentData}
        addNewDefect={defectData.addNewDefect}
      />
    )
  }

  // Показываем список витражей
  return (
    <DefectListView
      vitrages={defectData.filteredVitrages}
      objects={defectData.objects}
      selectedObject={selectedObject}
      storageSource={defectData.storageSource}
      onVitrageClick={handleVitrageClick}
      showExportMenu={exportControls.showExportMenu}
      setShowExportMenu={exportControls.setShowExportMenu}
      onExportAll={exportControls.handleExportAll}
      onExportSelected={exportControls.handleExportSelected}
      onExportOnlyWithDefects={exportControls.handleExportOnlyWithDefects}
      selectedVitrage={selectedVitrageForView}
    />
  )
}

// Re-export types for backwards compatibility
export type { DefectTrackingProps } from './types'
