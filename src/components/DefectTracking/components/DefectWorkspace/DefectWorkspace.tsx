import { useEffect, useState } from 'react'
import type { VitrageItem } from '../../types'
import { useCanvasControls } from '../../hooks/useCanvasControls'
import type { SegmentDefectData } from '../../../../services/defectStorage'
import { WorkspaceHeader } from './WorkspaceHeader'
import { VitrageGridRenderer } from './VitrageGridRenderer'
import { DefectPanel } from '../DefectPanel/DefectPanel'

interface DefectWorkspaceProps {
  vitrage: VitrageItem
  onBack: () => void
  onSaveAndBack: () => void
  availableDefects: string[]
  segmentDefectsData: Map<string, SegmentDefectData>
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
}

export function DefectWorkspace({
  vitrage,
  onBack,
  onSaveAndBack,
  availableDefects,
  segmentDefectsData,
  loadSegmentData,
  saveSegmentData,
  addNewDefect
}: DefectWorkspaceProps) {
  const canvasControls = useCanvasControls(vitrage.id)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [showDefectPanel, setShowDefectPanel] = useState(false)

  // Проверяем, есть ли дефекты у этого витража
  const hasDefects = Array.from(segmentDefectsData.entries()).some(
    ([key, data]) => key.startsWith(vitrage.id) && data.defects.length > 0
  )

  // Обработка клика на сегмент
  const handleSegmentClick = (segmentIndex: number) => {
    setSelectedSegmentId(String(segmentIndex))
    setShowDefectPanel(true)
  }

  // Закрытие панели дефектов
  const handleCloseDefectPanel = () => {
    setSelectedSegmentId(null)
    setShowDefectPanel(false)
  }

  // Обработка клавиши Escape для выхода из дефектовки
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Если открыта панель дефектов, закрываем её
        if (showDefectPanel) {
          handleCloseDefectPanel()
        } else {
          // Если панель закрыта, выходим из дефектовки
          onBack()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDefectPanel, onBack])

  return (
    <div className="defect-tracking-fullscreen">
      <WorkspaceHeader
        vitrage={vitrage}
        zoom={canvasControls.zoom}
        hasDefects={hasDefects}
        onBack={onBack}
        onSaveAndBack={onSaveAndBack}
        onZoomIn={canvasControls.handleZoomIn}
        onZoomOut={canvasControls.handleZoomOut}
        onResetZoom={canvasControls.handleResetZoom}
      />

      <div className={`workspace-container ${showDefectPanel ? 'with-panel' : ''}`}>
        <div className="workspace-layout">
          <VitrageGridRenderer
            vitrage={vitrage}
            zoom={canvasControls.zoom}
            pan={canvasControls.pan}
            isPanning={canvasControls.isPanning}
            svgContainerRef={canvasControls.svgContainerRef}
            workspaceRef={canvasControls.workspaceRef}
            segmentDefectsData={segmentDefectsData}
            selectedSegmentId={selectedSegmentId}
            onSegmentClick={handleSegmentClick}
            onWheel={canvasControls.handleWheel}
            onMouseDown={canvasControls.handleCanvasMouseDown}
            onMouseMove={canvasControls.handleCanvasMouseMove}
            onMouseUp={canvasControls.handleCanvasMouseUp}
          />
        </div>

        {/* Панель дефектов */}
        {showDefectPanel && selectedSegmentId && (
          <DefectPanel
            selectedSegmentId={selectedSegmentId}
            selectedVitrage={vitrage}
            availableDefects={availableDefects}
            loadSegmentData={loadSegmentData}
            saveSegmentData={saveSegmentData}
            addNewDefect={addNewDefect}
            onClose={handleCloseDefectPanel}
          />
        )}
      </div>
    </div>
  )
}
