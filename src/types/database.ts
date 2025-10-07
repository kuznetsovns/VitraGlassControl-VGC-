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

// Типы для Supabase Database
export interface Database {
  public: {
    Tables: {
      objects: {
        Row: DatabaseObject
        Insert: DatabaseObjectInsert
        Update: DatabaseObjectUpdate
      }
    }
  }
}
