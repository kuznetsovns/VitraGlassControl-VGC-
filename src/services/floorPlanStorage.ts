import { supabase } from '../lib/supabase'

// Interface for floor plan data
export interface FloorPlanData {
  id?: string
  object_id: string
  corpus: string
  section?: string | null
  floor: number
  name: string
  description?: string | null
  image_url?: string | null
  image_data?: string | null  // Base64 encoded image
  image_type?: string | null
  scale?: number
  width?: number | null
  height?: number | null
  background_opacity?: number
  grid_visible?: boolean
  placed_vitrages?: any[]
  walls?: any[]
  rooms?: any[]
  created_at?: string
  updated_at?: string
  created_by?: string | null
}

// Interface for placed vitrage on floor plan
export interface PlacedVitrageData {
  id: string
  vitrageId: string
  x: number
  y: number
  rotation: number
  scale: number
  wallId?: string
}

// LocalStorage fallback service
class LocalFloorPlanService {
  private readonly STORAGE_KEY = 'floor-plans'

  private getPlans(): FloorPlanData[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading floor plans from localStorage:', error)
      return []
    }
  }

  private savePlans(plans: FloorPlanData[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans))
    } catch (error) {
      console.error('Error saving floor plans to localStorage:', error)
      throw error
    }
  }

  async getAll(objectId?: string): Promise<FloorPlanData[]> {
    const plans = this.getPlans()
    if (objectId) {
      return plans.filter(plan => plan.object_id === objectId)
    }
    return plans
  }

  async getByObjectAndCorpus(objectId: string, corpus: string): Promise<FloorPlanData[]> {
    const plans = this.getPlans()
    return plans.filter(plan =>
      plan.object_id === objectId &&
      plan.corpus === corpus
    )
  }

  async getByObjectCorpusFloor(objectId: string, corpus: string, floor: number): Promise<FloorPlanData | null> {
    const plans = this.getPlans()
    return plans.find(plan =>
      plan.object_id === objectId &&
      plan.corpus === corpus &&
      plan.floor === floor
    ) || null
  }

  async create(planData: FloorPlanData): Promise<FloorPlanData> {
    const plans = this.getPlans()
    const newPlan: FloorPlanData = {
      ...planData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    plans.push(newPlan)
    this.savePlans(plans)
    return newPlan
  }

  async update(id: string, updates: Partial<FloorPlanData>): Promise<FloorPlanData> {
    const plans = this.getPlans()
    const index = plans.findIndex(plan => plan.id === id)
    if (index === -1) {
      throw new Error('Floor plan not found')
    }
    plans[index] = {
      ...plans[index],
      ...updates,
      id: plans[index].id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    }
    this.savePlans(plans)
    return plans[index]
  }

  async delete(id: string): Promise<void> {
    const plans = this.getPlans()
    const filtered = plans.filter(plan => plan.id !== id)
    if (filtered.length === plans.length) {
      throw new Error('Floor plan not found')
    }
    this.savePlans(filtered)
  }
}

const localFloorPlanService = new LocalFloorPlanService()

// Main storage service with Supabase + localStorage fallback
export const floorPlanStorage = {
  async getAll(objectId?: string): Promise<{ data: FloorPlanData[], error: any, usingFallback: boolean }> {
    try {
      console.log('🔄 Fetching floor plans from Supabase...')

      let query = supabase.from('floor_plans').select('*')

      if (objectId) {
        query = query.eq('object_id', objectId)
      }

      const { data, error } = await query.order('corpus').order('floor')

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log(`✅ Fetched ${data?.length || 0} floor plans from Supabase`)
      return {
        data: data || [],
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      const data = await localFloorPlanService.getAll(objectId)
      return { data, error: null, usingFallback: true }
    }
  },

  async getByObjectAndCorpus(objectId: string, corpus: string): Promise<{ data: FloorPlanData[], error: any, usingFallback: boolean }> {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('object_id', objectId)
        .eq('corpus', corpus)
        .order('floor')

      if (error) throw error

      return {
        data: data || [],
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      const data = await localFloorPlanService.getByObjectAndCorpus(objectId, corpus)
      return { data, error: null, usingFallback: true }
    }
  },

  async getByObjectCorpusFloor(objectId: string, corpus: string, floor: number): Promise<{ data: FloorPlanData | null, error: any, usingFallback: boolean }> {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('object_id', objectId)
        .eq('corpus', corpus)
        .eq('floor', floor)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      return {
        data: data || null,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      const data = await localFloorPlanService.getByObjectCorpusFloor(objectId, corpus, floor)
      return { data, error: null, usingFallback: true }
    }
  },

  async create(planData: FloorPlanData): Promise<{ data: FloorPlanData | null, error: any, usingFallback: boolean }> {
    try {
      console.log('🆕 Creating floor plan in Supabase...')

      const { data, error } = await supabase
        .from('floor_plans')
        .insert(planData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase INSERT error:', error)
        throw error
      }

      console.log('✅ Floor plan created in Supabase:', data)
      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      const data = await localFloorPlanService.create(planData)
      return { data, error: null, usingFallback: true }
    }
  },

  async update(id: string, updates: Partial<FloorPlanData>): Promise<{ data: FloorPlanData | null, error: any, usingFallback: boolean }> {
    try {
      console.log('🔄 Updating floor plan in Supabase...')

      const { data, error } = await supabase
        .from('floor_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase UPDATE error:', error)
        throw error
      }

      console.log('✅ Floor plan updated in Supabase')
      return {
        data,
        error: null,
        usingFallback: false
      }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      const data = await localFloorPlanService.update(id, updates)
      return { data, error: null, usingFallback: true }
    }
  },

  async delete(id: string): Promise<{ error: any, usingFallback: boolean }> {
    try {
      console.log('🗑️ Deleting floor plan from Supabase...')

      const { error } = await supabase
        .from('floor_plans')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Supabase DELETE error:', error)
        throw error
      }

      console.log('✅ Floor plan deleted from Supabase')
      return { error: null, usingFallback: false }
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback:', error)
      await localFloorPlanService.delete(id)
      return { error: null, usingFallback: true }
    }
  },

  // Update placed vitrages on a floor plan
  async updatePlacedVitrages(id: string, vitrages: PlacedVitrageData[]): Promise<{ data: FloorPlanData | null, error: any, usingFallback: boolean }> {
    return this.update(id, { placed_vitrages: vitrages })
  },

  // Helper function to upload image to Supabase Storage (for future use)
  async uploadImage(file: File, objectId: string, corpus: string, floor: number): Promise<{ url: string | null, error: any }> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${objectId}/${corpus}/floor_${floor}_${Date.now()}.${fileExt}`

      // For now, we'll store as base64 in the database
      // In the future, this can be changed to use Supabase Storage
      const reader = new FileReader()
      return new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          resolve({ url: base64, error: null })
        }
        reader.onerror = () => {
          resolve({ url: null, error: 'Failed to read file' })
        }
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      return { url: null, error }
    }
  }
}