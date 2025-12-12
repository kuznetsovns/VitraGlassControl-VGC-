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

  const handleSaveAndBack = async () => {
    // Данные уже сохранены через saveSegmentData при каждом изменении
    // Показываем уведомление и возвращаемся к списку
    alert('Дефекты успешно сохранены!')
    setSelectedVitrageForView(null)
  }

  const handleVitrageDelete = async (vitrage: VitrageItem) => {
    try {
      // Импортируем defectVitrageStorage динамически
      const { defectVitrageStorage } = await import('../../services/defectVitrageStorage')

      const { error } = await defectVitrageStorage.delete(vitrage.id)

      if (error) {
        alert('Ошибка при удалении витража из дефектовки')
        console.error('Delete error:', error)
      } else {
        alert(`Витраж "${vitrage.name}" удален из дефектовки`)
        // Перезагружаем страницу чтобы обновить список
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting vitrage:', error)
      alert('Произошла ошибка при удалении')
    }
  }

  // Если выбран витраж для просмотра - показываем полноэкранную отрисовку
  if (selectedVitrageForView) {
    return (
      <DefectWorkspace
        vitrage={selectedVitrageForView}
        onBack={handleBackToList}
        onSaveAndBack={handleSaveAndBack}
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
      segmentDefectsData={defectData.segmentDefectsData}
      onVitrageClick={handleVitrageClick}
      onVitrageDelete={handleVitrageDelete}
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
