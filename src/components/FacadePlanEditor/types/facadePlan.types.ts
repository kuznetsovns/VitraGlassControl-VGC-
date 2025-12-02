// Facade plan specific types
import type { Wall, Room, PlacedVitrage } from '../../FloorPlanEditor/types'

export interface FacadePlan {
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
  backgroundScale?: number // 0.1 to 3.0 - масштаб фонового изображения
  createdAt: Date
  updatedAt: Date
  buildingName?: string // Legacy field for backward compatibility
}

export interface FacadePlanEditorProps {
  width?: number
  height?: number
}

export interface BackgroundScaleState {
  tempImage: string | null
  tempScale: number
  showDialog: boolean
}

export interface CanvasDimensions {
  width: number
  height: number
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

export interface BackgroundOffset {
  x: number
  y: number
}
