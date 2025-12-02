// Floor plan related types
export interface Wall {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
  type: 'exterior' | 'interior' | 'load-bearing'
}

export interface Room {
  id: string
  name: string
  walls: string[] // Wall IDs that form this room
  area?: number
}

export interface VitrageGrid {
  id: string
  name: string
  rows: number
  cols: number
  segments: unknown[] // Simplified for floor plan usage
  totalWidth: number
  totalHeight: number
  profileWidth: number
  createdAt: Date
}

export interface SegmentIDMapping {
  [segmentId: string]: {
    object: string
    corpus: string
    section: string
    floor: string
    apartment: string
    vitrageNumber: string
    vitrageName: string
    vitrageSection: string
  }
}

export interface PlacedVitrage {
  id: string
  vitrageId: string // Reference to VitrageGrid
  x: number
  y: number
  rotation: number // 0, 90, 180, 270 degrees
  wallId?: string // Wall this vitrage is attached to
  scale: number
  segmentIDs?: SegmentIDMapping // Custom IDs for each segment
}

export interface FloorPlan {
  id: string
  name: string
  corpus: string
  section: string
  floor: number
  walls: Wall[]
  rooms: Room[]
  placedVitrages: PlacedVitrage[]
  scale: number // mm per pixel
  backgroundImage?: string // Base64 image data
  backgroundOpacity?: number
  createdAt: Date
  updatedAt: Date
  buildingName?: string // Legacy field for backward compatibility
}

export interface FloorPlanEditorProps {
  width?: number
  height?: number
  selectedObject?: { id: string; name: string } | null
}

export interface CanvasDimensions {
  width: number
  height: number
}

export interface DragOffset {
  x: number
  y: number
}

export interface MousePosition {
  x: number
  y: number
}

export interface NewPlanData {
  name: string
  corpus: string
  section: string
  floor: number
}

export interface Filters {
  name: string
  corpus: string
  section: string
  floor: string
}
