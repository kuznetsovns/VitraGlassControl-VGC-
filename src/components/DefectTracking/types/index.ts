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
  marking?: string
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
  vitrageData?: any
  segmentDefects?: Record<string, any>
  inspectionStatus?: string
  defectiveSegmentsCount?: number
  totalDefectsCount?: number
  createdAt: Date | string
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
