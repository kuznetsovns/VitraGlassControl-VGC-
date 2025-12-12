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
  corpus?: string
  section?: string
  floor?: string
  rows: number
  cols: number
  totalWidth: number
  totalHeight: number
  segments: VitrageSegment[]
  svgDrawing?: string
  createdAt: Date
  segmentDefects?: Record<string, any>
  inspectionStatus?: string
  defectiveSegmentsCount?: number
  totalDefectsCount?: number
  marking?: string
  vitrageName?: string
  vitrageData?: any
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
