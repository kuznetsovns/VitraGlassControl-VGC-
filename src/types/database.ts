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

// Типы для таблицы placed_vitrages
export interface DatabasePlacedVitrage {
  id: string
  object_id: string
  floor_plan_id: string | null
  vitrage_id: string
  vitrage_name: string
  vitrage_data: any
  position_x: number | null
  position_y: number | null
  rotation: number
  scale: number
  id_object: string | null
  id_corpus: string | null
  id_section: string | null
  id_floor: string | null
  id_apartment: string | null
  id_vitrage_number: string | null
  id_vitrage_name: string | null
  id_vitrage_section: string | null
  full_id: string
  segment_defects: any
  inspection_status: string
  inspection_date: string | null
  inspector_name: string | null
  inspection_notes: string | null
  total_defects_count: number
  defective_segments_count: number
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface DatabasePlacedVitrageInsert {
  object_id: string
  floor_plan_id?: string | null
  vitrage_id: string
  vitrage_name: string
  vitrage_data?: any
  position_x?: number | null
  position_y?: number | null
  rotation?: number
  scale?: number
  id_object?: string | null
  id_corpus?: string | null
  id_section?: string | null
  id_floor?: string | null
  id_apartment?: string | null
  id_vitrage_number?: string | null
  id_vitrage_name?: string | null
  id_vitrage_section?: string | null
  segment_defects?: any
  inspection_status?: string
  inspection_date?: string | null
  inspector_name?: string | null
  inspection_notes?: string | null
  created_by?: string | null
  updated_by?: string | null
}

export interface DatabasePlacedVitrageUpdate {
  floor_plan_id?: string | null
  vitrage_name?: string
  vitrage_data?: any
  position_x?: number | null
  position_y?: number | null
  rotation?: number
  scale?: number
  id_object?: string | null
  id_corpus?: string | null
  id_section?: string | null
  id_floor?: string | null
  id_apartment?: string | null
  id_vitrage_number?: string | null
  id_vitrage_name?: string | null
  id_vitrage_section?: string | null
  segment_defects?: any
  inspection_status?: string
  inspection_date?: string | null
  inspector_name?: string | null
  inspection_notes?: string | null
  updated_by?: string | null
}

// Типы для таблицы vitrage_segment_ids
export interface DatabaseVitrageSegmentId {
  id: string
  placed_vitrage_id: string
  segment_key: string
  id_object: string | null
  id_corpus: string | null
  id_section: string | null
  id_floor: string | null
  id_apartment: string | null
  id_vitrage_number: string | null
  id_vitrage_name: string | null
  id_vitrage_section: string | null
  full_segment_id: string
  created_at: string
  updated_at: string
}

export interface DatabaseVitrageSegmentIdInsert {
  placed_vitrage_id: string
  segment_key: string
  id_object?: string | null
  id_corpus?: string | null
  id_section?: string | null
  id_floor?: string | null
  id_apartment?: string | null
  id_vitrage_number?: string | null
  id_vitrage_name?: string | null
  id_vitrage_section?: string | null
}

export interface DatabaseVitrageSegmentIdUpdate {
  id_object?: string | null
  id_corpus?: string | null
  id_section?: string | null
  id_floor?: string | null
  id_apartment?: string | null
  id_vitrage_number?: string | null
  id_vitrage_name?: string | null
  id_vitrage_section?: string | null
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
      placed_vitrages: {
        Row: DatabasePlacedVitrage
        Insert: DatabasePlacedVitrageInsert
        Update: DatabasePlacedVitrageUpdate
      }
      vitrage_segment_ids: {
        Row: DatabaseVitrageSegmentId
        Insert: DatabaseVitrageSegmentIdInsert
        Update: DatabaseVitrageSegmentIdUpdate
      }
    }
  }
}
