// Типы для GraphicsEditor компонента

export type SegmentType = 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door'

export interface VitrageSegment {
  id: string
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
  type: SegmentType
  formula?: string
  label?: string
  selected?: boolean
  // Actual dimensions in mm
  realWidth?: number
  realHeight?: number
  // For merged segments
  merged?: boolean
  mergedWith?: string[] // IDs of segments this was merged with
  rowSpan?: number
  colSpan?: number
  // Stemalit property for glass segments
  isStemalit?: boolean
}

export interface VitrageGrid {
  id: string
  name: string
  rows: number
  cols: number
  segments: VitrageSegment[]
  totalWidth: number
  totalHeight: number
  profileWidth: number
  createdAt: Date
}

export interface EditingDimension {
  segmentId: string
  type: 'width' | 'height'
  x: number
  y: number
  value: number
}

export interface GraphicsEditorProps {
  width?: number
  height?: number
}

export interface CanvasDimensions {
  width: number
  height: number
}
