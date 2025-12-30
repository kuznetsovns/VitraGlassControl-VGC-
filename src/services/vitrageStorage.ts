import { supabase } from '../lib/supabase';

// Интерфейс сегмента витража
export interface VitrageSegment {
  id: string;
  type: string;
  width?: number;
  height?: number;
  formula?: string;
  label: string;
  rowIndex?: number;
  colIndex?: number;
  segmentIndex?: number;
  isMerged?: boolean;
  rowSpan?: number;
  colSpan?: number;
  isHidden?: boolean;
}

// Свойства сегмента (для segmentProperties)
export interface SegmentProperty {
  type: string;
  width: string;
  height: string;
  formula: string;
  label: string;
  merged?: boolean;
  rowSpan?: number;
  colSpan?: number;
  hidden?: boolean;
  mergedInto?: number;
}

// Интерфейс витража
export interface Vitrage {
  id: string;
  name: string;
  siteManager?: string;
  creationDate?: string;
  objectId: string;
  objectName: string;
  rows: number;
  cols: number;
  segments: VitrageSegment[];
  segmentProperties?: { [key: number]: SegmentProperty };
  totalWidth: number;
  totalHeight: number;
  svgDrawing?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Интерфейс сегмента из Supabase
interface SupabaseSegment {
  id: string;
  vitrage_id: string;
  segment_index: number;
  row_index: number;
  col_index: number;
  label: string | null;
  fill_type: string;
  width: number | null;
  height: number | null;
  formula: string | null;
  is_merged: boolean;
  row_span: number;
  col_span: number;
  is_hidden: boolean;
  merged_into_id: string | null;
}

// Интерфейс для данных из Supabase
interface SupabaseVitrage {
  id: string;
  name: string;
  site_manager: string | null;
  creation_date: string | null;
  object_id: string | null;
  object_name: string | null;
  rows_count: number;
  cols_count: number;
  segments: VitrageSegment[];
  segment_properties: { [key: number]: SegmentProperty } | null;
  total_width: number;
  total_height: number;
  svg_drawing: string | null;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'saved-vitrages';

// Преобразование данных из Supabase в формат приложения
function fromSupabase(data: SupabaseVitrage): Vitrage {
  return {
    id: data.id,
    name: data.name,
    siteManager: data.site_manager || undefined,
    creationDate: data.creation_date || undefined,
    objectId: data.object_id || '',
    objectName: data.object_name || '',
    rows: data.rows_count,
    cols: data.cols_count,
    segments: data.segments || [],
    segmentProperties: data.segment_properties || undefined,
    totalWidth: data.total_width,
    totalHeight: data.total_height,
    svgDrawing: data.svg_drawing || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}

// Преобразование данных для отправки в Supabase
function toSupabase(vitrage: Omit<Vitrage, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    name: vitrage.name,
    site_manager: vitrage.siteManager || null,
    creation_date: vitrage.creationDate || null,
    object_id: vitrage.objectId || null,
    object_name: vitrage.objectName || null,
    rows_count: vitrage.rows,
    cols_count: vitrage.cols,
    segments: vitrage.segments,
    segment_properties: vitrage.segmentProperties || null,
    total_width: vitrage.totalWidth,
    total_height: vitrage.totalHeight,
    svg_drawing: vitrage.svgDrawing || null,
  };
}

// Получение витражей из localStorage
function getFromLocalStorage(): Vitrage[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt),
      updatedAt: v.updatedAt ? new Date(v.updatedAt) : undefined,
    }));
  } catch (error) {
    console.error('Error reading vitrages from localStorage:', error);
    return [];
  }
}

// Сохранение витражей в localStorage
function saveToLocalStorage(vitrages: Vitrage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vitrages));
  } catch (error) {
    console.error('Error saving vitrages to localStorage:', error);
  }
}

export const vitrageStorage = {
  // Получить все витражи
  async getAll(objectId?: string): Promise<{ data: Vitrage[]; source: 'supabase' | 'localStorage' }> {
    try {
      let query = supabase
        .from('vitrages')
        .select('*')
        .order('created_at', { ascending: false });

      if (objectId) {
        query = query.eq('object_id', objectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Vitrages loaded from Supabase:', data?.length || 0);
      return {
        data: (data || []).map(fromSupabase),
        source: 'supabase',
      };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback');
      let vitrages = getFromLocalStorage();

      if (objectId) {
        vitrages = vitrages.filter(v => v.objectId === objectId);
      }

      console.log('📦 Using localStorage, found', vitrages.length, 'vitrages');
      return {
        data: vitrages,
        source: 'localStorage',
      };
    }
  },

  // Получить витраж по ID
  async getById(id: string): Promise<Vitrage | null> {
    try {
      const { data, error } = await supabase
        .from('vitrages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? fromSupabase(data) : null;
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback');
      const vitrages = getFromLocalStorage();
      return vitrages.find(v => v.id === id) || null;
    }
  },

  // Создать новый витраж
  async create(vitrage: Omit<Vitrage, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: Vitrage | null; source: 'supabase' | 'localStorage' }> {
    try {
      const { data, error } = await supabase
        .from('vitrages')
        .insert(toSupabase(vitrage))
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      console.log('✅ Vitrage saved to Supabase:', data.id);
      return {
        data: fromSupabase(data),
        source: 'supabase',
      };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, saving to localStorage');

      const newVitrage: Vitrage = {
        ...vitrage,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };

      const vitrages = getFromLocalStorage();
      vitrages.unshift(newVitrage);
      saveToLocalStorage(vitrages);

      console.log('📦 Vitrage saved to localStorage:', newVitrage.id);
      return {
        data: newVitrage,
        source: 'localStorage',
      };
    }
  },

  // Обновить витраж
  async update(id: string, updates: Partial<Omit<Vitrage, 'id' | 'createdAt'>>): Promise<{ data: Vitrage | null; source: 'supabase' | 'localStorage' }> {
    try {
      const updateData: any = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.siteManager !== undefined) updateData.site_manager = updates.siteManager;
      if (updates.creationDate !== undefined) updateData.creation_date = updates.creationDate;
      if (updates.objectId !== undefined) updateData.object_id = updates.objectId;
      if (updates.objectName !== undefined) updateData.object_name = updates.objectName;
      if (updates.rows !== undefined) updateData.rows_count = updates.rows;
      if (updates.cols !== undefined) updateData.cols_count = updates.cols;
      if (updates.segments !== undefined) updateData.segments = updates.segments;
      if (updates.segmentProperties !== undefined) updateData.segment_properties = updates.segmentProperties;
      if (updates.totalWidth !== undefined) updateData.total_width = updates.totalWidth;
      if (updates.totalHeight !== undefined) updateData.total_height = updates.totalHeight;
      if (updates.svgDrawing !== undefined) updateData.svg_drawing = updates.svgDrawing;

      const { data, error } = await supabase
        .from('vitrages')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Vitrage updated in Supabase:', id);
      return {
        data: data ? fromSupabase(data) : null,
        source: 'supabase',
      };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, updating in localStorage');

      const vitrages = getFromLocalStorage();
      const index = vitrages.findIndex(v => v.id === id);

      if (index === -1) {
        return { data: null, source: 'localStorage' };
      }

      vitrages[index] = {
        ...vitrages[index],
        ...updates,
        updatedAt: new Date(),
      };

      saveToLocalStorage(vitrages);
      console.log('📦 Vitrage updated in localStorage:', id);

      return {
        data: vitrages[index],
        source: 'localStorage',
      };
    }
  },

  // Удалить витраж
  async delete(id: string): Promise<{ success: boolean; source: 'supabase' | 'localStorage' }> {
    try {
      const { error } = await supabase
        .from('vitrages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Vitrage deleted from Supabase:', id);
      return { success: true, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, deleting from localStorage');

      const vitrages = getFromLocalStorage();
      const filtered = vitrages.filter(v => v.id !== id);
      saveToLocalStorage(filtered);

      console.log('📦 Vitrage deleted from localStorage:', id);
      return { success: true, source: 'localStorage' };
    }
  },

  // Синхронизация localStorage с Supabase
  async syncToSupabase(): Promise<{ synced: number; errors: number }> {
    const localVitrages = getFromLocalStorage();
    let synced = 0;
    let errors = 0;

    for (const vitrage of localVitrages) {
      try {
        // Проверяем, существует ли витраж в Supabase
        const { data: existing } = await supabase
          .from('vitrages')
          .select('id')
          .eq('id', vitrage.id)
          .single();

        if (!existing) {
          // Создаем новый витраж в Supabase
          const { error } = await supabase
            .from('vitrages')
            .insert({
              id: vitrage.id,
              ...toSupabase(vitrage),
              created_at: vitrage.createdAt.toISOString(),
            });

          if (error) throw error;
          synced++;
        }
      } catch (error) {
        console.error('Error syncing vitrage:', vitrage.id, error);
        errors++;
      }
    }

    console.log(`Sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  },
};

// Функции для работы с сегментами
export const segmentStorage = {
  // Получить сегменты витража
  async getByVitrageId(vitrageId: string): Promise<{ data: VitrageSegment[]; source: 'supabase' | 'localStorage' }> {
    try {
      const { data, error } = await supabase
        .from('vitrage_segments')
        .select('*')
        .eq('vitrage_id', vitrageId)
        .order('segment_index', { ascending: true });

      if (error) throw error;

      const segments: VitrageSegment[] = (data || []).map((s: SupabaseSegment) => ({
        id: s.id,
        type: s.fill_type,
        width: s.width || undefined,
        height: s.height || undefined,
        formula: s.formula || undefined,
        label: s.label || '',
        rowIndex: s.row_index,
        colIndex: s.col_index,
        segmentIndex: s.segment_index,
        isMerged: s.is_merged,
        rowSpan: s.row_span,
        colSpan: s.col_span,
        isHidden: s.is_hidden,
      }));

      return { data: segments, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable for segments, using vitrage data');
      // Fallback: получить сегменты из витража
      const vitrage = await vitrageStorage.getById(vitrageId);
      return {
        data: vitrage?.segments || [],
        source: 'localStorage',
      };
    }
  },

  // Создать сегменты для витража
  async createBatch(vitrageId: string, segments: VitrageSegment[]): Promise<{ success: boolean; source: 'supabase' | 'localStorage' }> {
    try {
      const segmentsData = segments.map((s, index) => ({
        vitrage_id: vitrageId,
        segment_index: s.segmentIndex ?? index,
        row_index: s.rowIndex ?? Math.floor(index / 10),
        col_index: s.colIndex ?? index % 10,
        label: s.label || null,
        fill_type: s.type || 'Пустой',
        width: s.width || null,
        height: s.height || null,
        formula: s.formula || null,
        is_merged: s.isMerged || false,
        row_span: s.rowSpan || 1,
        col_span: s.colSpan || 1,
        is_hidden: s.isHidden || false,
      }));

      const { error } = await supabase
        .from('vitrage_segments')
        .insert(segmentsData);

      if (error) throw error;

      console.log('✅ Segments saved to Supabase:', segments.length);
      return { success: true, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, segments stored in vitrage');
      return { success: true, source: 'localStorage' };
    }
  },

  // Обновить сегмент
  async update(segmentId: string, vitrageId: string, updates: Partial<VitrageSegment>): Promise<{ success: boolean; source: 'supabase' | 'localStorage' }> {
    try {
      const updateData: any = {};

      if (updates.label !== undefined) updateData.label = updates.label;
      if (updates.type !== undefined) updateData.fill_type = updates.type;
      if (updates.width !== undefined) updateData.width = updates.width;
      if (updates.height !== undefined) updateData.height = updates.height;
      if (updates.formula !== undefined) updateData.formula = updates.formula;
      if (updates.isMerged !== undefined) updateData.is_merged = updates.isMerged;
      if (updates.rowSpan !== undefined) updateData.row_span = updates.rowSpan;
      if (updates.colSpan !== undefined) updateData.col_span = updates.colSpan;
      if (updates.isHidden !== undefined) updateData.is_hidden = updates.isHidden;

      const { error } = await supabase
        .from('vitrage_segments')
        .update(updateData)
        .eq('id', segmentId);

      if (error) throw error;

      console.log('✅ Segment updated in Supabase:', segmentId);
      return { success: true, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, updating in localStorage');

      // Fallback: обновить сегмент в витраже в localStorage
      const vitrages = getFromLocalStorage();
      const vitrageIndex = vitrages.findIndex(v => v.id === vitrageId);

      if (vitrageIndex !== -1) {
        const segmentIndex = vitrages[vitrageIndex].segments.findIndex(s => s.id === segmentId);
        if (segmentIndex !== -1) {
          vitrages[vitrageIndex].segments[segmentIndex] = {
            ...vitrages[vitrageIndex].segments[segmentIndex],
            ...updates,
          };
          saveToLocalStorage(vitrages);
        }
      }

      return { success: true, source: 'localStorage' };
    }
  },

  // Обновить сегмент по индексу (для совместимости с текущим кодом)
  async updateByIndex(vitrageId: string, segmentIndex: number, updates: Partial<VitrageSegment>): Promise<{ success: boolean; source: 'supabase' | 'localStorage' }> {
    try {
      const updateData: any = {};

      if (updates.label !== undefined) updateData.label = updates.label;
      if (updates.type !== undefined) updateData.fill_type = updates.type;
      if (updates.width !== undefined) updateData.width = updates.width;
      if (updates.height !== undefined) updateData.height = updates.height;
      if (updates.formula !== undefined) updateData.formula = updates.formula;

      const { error } = await supabase
        .from('vitrage_segments')
        .update(updateData)
        .eq('vitrage_id', vitrageId)
        .eq('segment_index', segmentIndex);

      if (error) throw error;

      console.log('✅ Segment updated in Supabase by index:', vitrageId, segmentIndex);
      return { success: true, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, updating in localStorage');

      const vitrages = getFromLocalStorage();
      const vitrageIndex = vitrages.findIndex(v => v.id === vitrageId);

      if (vitrageIndex !== -1 && vitrages[vitrageIndex].segments[segmentIndex]) {
        vitrages[vitrageIndex].segments[segmentIndex] = {
          ...vitrages[vitrageIndex].segments[segmentIndex],
          ...updates,
        };
        saveToLocalStorage(vitrages);
      }

      return { success: true, source: 'localStorage' };
    }
  },

  // Удалить все сегменты витража
  async deleteByVitrageId(vitrageId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('vitrage_segments')
        .delete()
        .eq('vitrage_id', vitrageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Could not delete segments from Supabase');
      return { success: true };
    }
  },
};

export default vitrageStorage;
