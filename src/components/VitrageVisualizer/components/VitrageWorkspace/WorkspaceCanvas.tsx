import React from 'react'
import type { CreatedVitrage, SegmentProperties } from '../../types'
import { VitrageGrid } from '../SVGCanvas'

interface WorkspaceCanvasProps {
  vitrage: CreatedVitrage
  segmentProperties: SegmentProperties
  selectedSegment: number | null
  selectedSegments: Set<number>
  onSegmentClick: (segmentId: number, ctrlKey: boolean) => void
  zoom: number
  pan: { x: number; y: number }
  isPanning: boolean
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

export function WorkspaceCanvas({
  vitrage,
  segmentProperties,
  selectedSegment,
  selectedSegments,
  onSegmentClick,
  zoom,
  pan,
  isPanning,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp
}: WorkspaceCanvasProps) {
  return (
    <div
      className="grid-visualization-workspace"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        overflow: 'auto'
      }}
    >
      <VitrageGrid
        vitrage={vitrage}
        segmentProperties={segmentProperties}
        selectedSegment={selectedSegment}
        selectedSegments={selectedSegments}
        onSegmentClick={onSegmentClick}
        zoom={zoom}
        pan={pan}
        isPanning={isPanning}
      />
    </div>
  )
}
