import type { VitrageItem } from '../../types'
import { useCanvasControls } from '../../hooks/useCanvasControls'
import { useSegmentSelection } from '../../hooks/useSegmentSelection'
import type { SegmentDefectData } from '../../../../services/defectStorage'
import { WorkspaceHeader } from './WorkspaceHeader'
import { SvgViewer } from './SvgViewer'
import { DefectPanel } from '../DefectPanel/DefectPanel'

interface DefectWorkspaceProps {
  vitrage: VitrageItem
  onBack: () => void
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
  availableDefects,
  segmentDefectsData,
  loadSegmentData,
  saveSegmentData,
  addNewDefect
}: DefectWorkspaceProps) {
  const canvasControls = useCanvasControls(vitrage.id)
  const segmentSelection = useSegmentSelection(
    vitrage,
    canvasControls.svgContainerRef,
    segmentDefectsData
  )

  return (
    <div className="defect-tracking-fullscreen">
      <WorkspaceHeader
        vitrage={vitrage}
        zoom={canvasControls.zoom}
        onBack={onBack}
        onZoomIn={canvasControls.handleZoomIn}
        onZoomOut={canvasControls.handleZoomOut}
        onResetZoom={canvasControls.handleResetZoom}
      />

      <div className="workspace-layout">
        <SvgViewer
          vitrage={vitrage}
          zoom={canvasControls.zoom}
          pan={canvasControls.pan}
          isPanning={canvasControls.isPanning}
          svgContainerRef={canvasControls.svgContainerRef}
          onWheel={canvasControls.handleWheel}
          onMouseDown={canvasControls.handleCanvasMouseDown}
          onMouseMove={canvasControls.handleCanvasMouseMove}
          onMouseUp={canvasControls.handleCanvasMouseUp}
        />
      </div>

      {/* Панель дефектов */}
      {segmentSelection.showDefectPanel && segmentSelection.selectedSegmentId && (
        <DefectPanel
          selectedSegmentId={segmentSelection.selectedSegmentId}
          selectedVitrage={vitrage}
          availableDefects={availableDefects}
          loadSegmentData={loadSegmentData}
          saveSegmentData={saveSegmentData}
          addNewDefect={addNewDefect}
          onClose={segmentSelection.handleCloseDefectPanel}
        />
      )}
    </div>
  )
}
