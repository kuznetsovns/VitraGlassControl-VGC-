import { supabase } from '../lib/supabase'
import type { ProjectObject } from '../components/MainPage'

const STORAGE_KEY = 'project-objects'

// Helper to convert database object to ProjectObject
function dbToProjectObject(dbObj: any): ProjectObject {
  return {
    id: dbObj.id,
    name: dbObj.name,
    customer: dbObj.customer || '',
    address: dbObj.address || '',
    buildingsCount: dbObj.corpus_count || 1,
    image: dbObj.photo_url || undefined,
    createdAt: new Date(dbObj.created_at),
    updatedAt: new Date(dbObj.updated_at)
  }
}

// Helper to convert ProjectObject to database object
function projectObjectToDb(obj: Partial<ProjectObject>) {
  return {
    id: obj.id,
    name: obj.name,
    customer: obj.customer || null,
    address: obj.address || null,
    corpus_count: obj.buildingsCount || 1,
    photo_url: obj.image || null
  }
}

// LocalStorage fallback functions
class LocalStorageService {
  private getObjects(): ProjectObject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      const objects = JSON.parse(data)
      // Convert date strings back to Date objects
      return objects.map((obj: any) => ({
        ...obj,
        createdAt: new Date(obj.createdAt),
        updatedAt: new Date(obj.updatedAt)
      }))
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return []
    }
  }

  private saveObjects(objects: ProjectObject[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(objects))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      throw error
    }
  }

  async getAll(): Promise<ProjectObject[]> {
    return this.getObjects().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getById(id: string): Promise<ProjectObject | null> {
    const objects = this.getObjects()
    return objects.find(obj => obj.id === id) || null
  }

  async create(objectData: Omit<ProjectObject, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectObject> {
    const objects = this.getObjects()
    const newObject: ProjectObject = {
      ...objectData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    objects.push(newObject)
    this.saveObjects(objects)
    return newObject
  }

  async update(id: string, updates: Partial<ProjectObject>): Promise<ProjectObject> {
    const objects = this.getObjects()
    const index = objects.findIndex(obj => obj.id === id)
    if (index === -1) {
      throw new Error('Object not found')
    }
    objects[index] = {
      ...objects[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    }
    this.saveObjects(objects)
    return objects[index]
  }

  async delete(id: string): Promise<void> {
    const objects = this.getObjects()
    const filtered = objects.filter(obj => obj.id !== id)
    if (filtered.length === objects.length) {
      throw new Error('Object not found')
    }
    this.saveObjects(filtered)
  }
}

const localStorageService = new LocalStorageService()

// Main service with Supabase + localStorage fallback
export const objectStorage = {
  async getAll(): Promise<{ data: ProjectObject[], error: any, usingFallback: boolean }> {
    try {
      console.log('🔄 Attempting to fetch objects from Supabase...')
      console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ Successfully fetched from Supabase:', data?.length || 0, 'objects')
      return {
        data: data?.map(dbToProjectObject) || [],
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      const data = await localStorageService.getAll()
      console.log('📦 Using localStorage, found', data.length, 'objects')
      return { data, error: null, usingFallback: true }
    }
  },

  async getById(id: string): Promise<{ data: ProjectObject | null, error: any, usingFallback: boolean }> {
    try {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        data: data ? dbToProjectObject(data) : null,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('Supabase unavailable, using localStorage fallback:', error)
      const data = await localStorageService.getById(id)
      return { data, error: null, usingFallback: true }
    }
  },

  async create(objectData: Omit<ProjectObject, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: ProjectObject | null, error: any, usingFallback: boolean }> {
    try {
      console.log('🆕 Creating object in Supabase...')
      console.log('📝 Object data:', objectData)

      const dbData = projectObjectToDb(objectData)
      console.log('🔄 Converted data for DB:', dbData)

      const { data, error } = await supabase
        .from('objects')
        .insert(dbData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase INSERT error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ Successfully created in Supabase:', data)
      return {
        data: data ? dbToProjectObject(data) : null,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable for CREATE, using localStorage fallback:', error)
      const data = await localStorageService.create(objectData)
      console.log('📦 Created in localStorage:', data)
      return { data, error: null, usingFallback: true }
    }
  },

  async update(id: string, updates: Partial<ProjectObject>): Promise<{ data: ProjectObject | null, error: any, usingFallback: boolean }> {
    try {
      const dbData = projectObjectToDb(updates)
      const { data, error } = await supabase
        .from('objects')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        data: data ? dbToProjectObject(data) : null,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('Supabase unavailable, using localStorage fallback:', error)
      const data = await localStorageService.update(id, updates)
      return { data, error: null, usingFallback: true }
    }
  },

  async delete(id: string): Promise<{ error: any, usingFallback: boolean }> {
    try {
      const { error } = await supabase
        .from('objects')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null, usingFallback: false }
    } catch (error) {
      console.warn('Supabase unavailable, using localStorage fallback:', error)
      await localStorageService.delete(id)
      return { error: null, usingFallback: true }
    }
  }
}