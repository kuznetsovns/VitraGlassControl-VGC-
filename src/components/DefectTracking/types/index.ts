export interface ProjectObject {
  id: string
  name: string
  versions: ObjectVersion[]
  createdAt: Date
}

export interface ObjectVersion {
  id: string
  name: string
  createdAt: Date
}

export interface VitrageItem {
  id: string
  name: string
  siteManager?: string
  creationDate?: string
  objectId: string
  objectName?: string
  versionId?: string
  rows: number
  cols: number
  totalWidth: number
  totalHeight: number
  segments: VitrageSegment[]
  svgDrawing?: string
  createdAt: Date
}

export interface VitrageSegment {
  id: string
  type: string
  width?: number
  height?: number
  formula?: string
  label?: string
  hidden?: boolean
  merged?: boolean
  rowSpan?: number
  colSpan?: number
  mergedInto?: number
}

export interface DefectTrackingProps {
  selectedObject?: { id: string; name: string } | null
}
