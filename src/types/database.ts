// Типы для базы данных Supabase

export interface DatabaseObject {
  id: string
  name: string
  customer: string | null
  address: string | null
  corpus_count: number
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseObjectInsert {
  name: string
  customer?: string | null
  address?: string | null
  corpus_count?: number
  photo_url?: string | null
}

export interface DatabaseObjectUpdate {
  name?: string
  customer?: string | null
  address?: string | null
  corpus_count?: number
  photo_url?: string | null
}

// Типы для таблицы floor_plans
export interface DatabaseFloorPlan {
  id: string
  object_id: string
  corpus: string
  section: string | null
  floor: number
  name: string
  description: string | null
  image_url: string | null
  image_data: string | null
  image_type: string | null
  scale: number
  width: number | null
  height: number | null
  background_opacity: number
  grid_visible: boolean
  placed_vitrages: any
  walls: any
  rooms: any
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DatabaseFloorPlanInsert {
  object_id: string
  corpus: string
  section?: string | null
  floor: number
  name: string
  description?: string | null
  image_url?: string | null
  image_data?: string | null
  image_type?: string | null
  scale?: number
  width?: number | null
  height?: number | null
  background_opacity?: number
  grid_visible?: boolean
  placed_vitrages?: any
  walls?: any
  rooms?: any
}

export interface DatabaseFloorPlanUpdate {
  corpus?: string
  section?: string | null
  floor?: number
  name?: string
  description?: string | null
  image_url?: string | null
  image_data?: string | null
  image_type?: string | null
  scale?: number
  width?: number | null
  height?: number | null
  background_opacity?: number
  grid_visible?: boolean
  placed_vitrages?: any
  walls?: any
  rooms?: any
}

// Типы для Supabase Database
export interface Database {
  public: {
    Tables: {
      objects: {
        Row: DatabaseObject
        Insert: DatabaseObjectInsert
        Update: DatabaseObjectUpdate
      }
      floor_plans: {
        Row: DatabaseFloorPlan
        Insert: DatabaseFloorPlanInsert
        Update: DatabaseFloorPlanUpdate
      }
    }
  }
}
