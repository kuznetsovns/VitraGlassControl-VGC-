import { supabase } from '../lib/supabase';

// Интерфейс типа дефекта
export interface DefectType {
  id: string;
  name: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

// Интерфейс элемента дефекта
export interface DefectItem {
  defectTypeId: string;
  defectName: string;
  severity?: string;
  quantity?: number;
  location?: string;
  photoUrl?: string;
}

// Интерфейс данных дефектов сегмента
export interface SegmentDefectData {
  id?: string;
  vitrageId: string;
  segmentIndex: number;
  inspectionDate: string;
  inspector: string;
  siteManager: string;
  defects: string[]; // Названия дефектов для совместимости со старым кодом
  defectItems?: DefectItem[]; // Детальная информация о дефектах
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Интерфейс для Supabase
interface SupabaseDefectType {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  is_active: boolean;
  created_at: string;
}

interface SupabaseSegmentDefect {
  id: string;
  vitrage_id: string;
  segment_index: number;
  inspection_date: string;
  inspector: string | null;
  site_manager: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const DEFECTS_STORAGE_KEY = 'segment-defects-data';
const DEFECT_TYPES_STORAGE_KEY = 'defect-types';

// Получение типов дефектов из localStorage
function getDefectTypesFromLocalStorage(): string[] {
  try {
    const data = localStorage.getItem(DEFECT_TYPES_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading defect types from localStorage:', error);
  }
  // Возвращаем типы по умолчанию
  return [
    'Царапины',
    'Сколы',
    'Трещины',
    'Загрязнения',
    'Деформация',
    'Разгерметизация',
    'Запотевание',
    'Некачественный монтаж'
  ];
}

// Сохранение типов дефектов в localStorage
function saveDefectTypesToLocalStorage(types: string[]): void {
  try {
    localStorage.setItem(DEFECT_TYPES_STORAGE_KEY, JSON.stringify(types));
  } catch (error) {
    console.error('Error saving defect types to localStorage:', error);
  }
}

// Получение данных дефектов из localStorage
function getDefectsFromLocalStorage(): Map<string, SegmentDefectData> {
  try {
    const data = localStorage.getItem(DEFECTS_STORAGE_KEY);
    if (!data) return new Map();

    const parsed = JSON.parse(data);
    const map = new Map<string, SegmentDefectData>();

    Object.entries(parsed).forEach(([key, value]) => {
      map.set(key, value as SegmentDefectData);
    });

    return map;
  } catch (error) {
    console.error('Error reading defects from localStorage:', error);
    return new Map();
  }
}

// Сохранение данных дефектов в localStorage
function saveDefectsToLocalStorage(defectsMap: Map<string, SegmentDefectData>): void {
  try {
    const obj: { [key: string]: SegmentDefectData } = {};
    defectsMap.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(DEFECTS_STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving defects to localStorage:', error);
  }
}

export const defectStorage = {
  // Получить все типы дефектов
  async getDefectTypes(): Promise<{ data: DefectType[]; source: 'supabase' | 'localStorage' }> {
    try {
      const { data, error } = await supabase
        .from('defect_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const types: DefectType[] = (data || []).map((t: SupabaseDefectType) => ({
        id: t.id,
        name: t.name,
        description: t.description || undefined,
        severity: t.severity as 'low' | 'medium' | 'high' | 'critical',
        isActive: t.is_active,
      }));

      console.log('✅ Defect types loaded from Supabase:', types.length);
      return { data: types, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback for defect types');

      const names = getDefectTypesFromLocalStorage();
      const types: DefectType[] = names.map((name, index) => ({
        id: `local-${index}`,
        name,
        severity: 'medium',
        isActive: true,
      }));

      return { data: types, source: 'localStorage' };
    }
  },

  // Добавить новый тип дефекта
  async addDefectType(name: string, description?: string): Promise<{ data: DefectType | null; source: 'supabase' | 'localStorage' }> {
    try {
      const { data, error } = await supabase
        .from('defect_types')
        .insert({ name, description })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Defect type added to Supabase:', name);
      return {
        data: {
          id: data.id,
          name: data.name,
          description: data.description || undefined,
          severity: data.severity,
          isActive: data.is_active,
        },
        source: 'supabase',
      };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, saving to localStorage');

      const types = getDefectTypesFromLocalStorage();
      if (!types.includes(name)) {
        types.push(name);
        saveDefectTypesToLocalStorage(types);
      }

      return {
        data: {
          id: `local-${types.length}`,
          name,
          severity: 'medium',
          isActive: true,
        },
        source: 'localStorage',
      };
    }
  },

  // Получить дефекты для витража
  async getByVitrageId(vitrageId: string): Promise<{ data: Map<string, SegmentDefectData>; source: 'supabase' | 'localStorage' }> {
    try {
      const { data: defectsData, error } = await supabase
        .from('segment_defects')
        .select(`
          *,
          segment_defect_items (
            defect_type_id,
            quantity,
            location,
            photo_url,
            defect_types (
              name,
              severity
            )
          )
        `)
        .eq('vitrage_id', vitrageId);

      if (error) throw error;

      const map = new Map<string, SegmentDefectData>();

      (defectsData || []).forEach((sd: any) => {
        const key = `${vitrageId}-${sd.segment_index}`;
        const defectNames = sd.segment_defect_items?.map((item: any) =>
          item.defect_types?.name || 'Неизвестный'
        ) || [];

        map.set(key, {
          id: sd.id,
          vitrageId: sd.vitrage_id,
          segmentIndex: sd.segment_index,
          inspectionDate: sd.inspection_date,
          inspector: sd.inspector || '',
          siteManager: sd.site_manager || '',
          defects: defectNames,
          notes: sd.notes || undefined,
          createdAt: new Date(sd.created_at),
          updatedAt: sd.updated_at ? new Date(sd.updated_at) : undefined,
        });
      });

      console.log('✅ Defects loaded from Supabase for vitrage:', vitrageId, map.size);
      return { data: map, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback');

      const allDefects = getDefectsFromLocalStorage();
      const map = new Map<string, SegmentDefectData>();

      allDefects.forEach((value, key) => {
        if (key.startsWith(`${vitrageId}-`)) {
          map.set(key, value);
        }
      });

      return { data: map, source: 'localStorage' };
    }
  },

  // Сохранить дефекты сегмента
  async saveSegmentDefects(
    vitrageId: string,
    segmentIndex: number,
    data: Omit<SegmentDefectData, 'vitrageId' | 'segmentIndex'>
  ): Promise<{ success: boolean; source: 'supabase' | 'localStorage' }> {
    const key = `${vitrageId}-${segmentIndex}`;

    try {
      // Проверяем, существует ли уже запись
      const { data: existing } = await supabase
        .from('segment_defects')
        .select('id')
        .eq('vitrage_id', vitrageId)
        .eq('segment_index', segmentIndex)
        .eq('inspection_date', data.inspectionDate)
        .maybeSingle();

      let segmentDefectId: string;

      if (existing) {
        // Обновляем существующую запись
        const { error } = await supabase
          .from('segment_defects')
          .update({
            inspector: data.inspector || null,
            site_manager: data.siteManager || null,
            notes: data.notes || null,
          })
          .eq('id', existing.id);

        if (error) throw error;
        segmentDefectId = existing.id;

        // Удаляем старые элементы дефектов
        await supabase
          .from('segment_defect_items')
          .delete()
          .eq('segment_defect_id', segmentDefectId);
      } else {
        // Создаём новую запись
        const { data: newDefect, error } = await supabase
          .from('segment_defects')
          .insert({
            vitrage_id: vitrageId,
            segment_index: segmentIndex,
            inspection_date: data.inspectionDate,
            inspector: data.inspector || null,
            site_manager: data.siteManager || null,
            notes: data.notes || null,
          })
          .select()
          .single();

        if (error) throw error;
        segmentDefectId = newDefect.id;
      }

      // Добавляем элементы дефектов
      if (data.defects.length > 0) {
        // Получаем ID типов дефектов по названиям
        const { data: defectTypes } = await supabase
          .from('defect_types')
          .select('id, name')
          .in('name', data.defects);

        if (defectTypes && defectTypes.length > 0) {
          const items = defectTypes.map(dt => ({
            segment_defect_id: segmentDefectId,
            defect_type_id: dt.id,
          }));

          await supabase
            .from('segment_defect_items')
            .insert(items);
        }
      }

      console.log('✅ Segment defects saved to Supabase:', key);
      return { success: true, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, saving to localStorage');

      const allDefects = getDefectsFromLocalStorage();
      allDefects.set(key, {
        vitrageId,
        segmentIndex,
        ...data,
      });
      saveDefectsToLocalStorage(allDefects);

      console.log('📦 Segment defects saved to localStorage:', key);
      return { success: true, source: 'localStorage' };
    }
  },

  // Удалить дефекты сегмента
  async deleteSegmentDefects(vitrageId: string, segmentIndex: number): Promise<{ success: boolean }> {
    const key = `${vitrageId}-${segmentIndex}`;

    try {
      const { error } = await supabase
        .from('segment_defects')
        .delete()
        .eq('vitrage_id', vitrageId)
        .eq('segment_index', segmentIndex);

      if (error) throw error;

      console.log('✅ Segment defects deleted from Supabase:', key);
      return { success: true };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, deleting from localStorage');

      const allDefects = getDefectsFromLocalStorage();
      allDefects.delete(key);
      saveDefectsToLocalStorage(allDefects);

      return { success: true };
    }
  },

  // Получить все дефекты (для всех витражей)
  async getAll(): Promise<{ data: Map<string, SegmentDefectData>; source: 'supabase' | 'localStorage' }> {
    try {
      const { data: defectsData, error } = await supabase
        .from('segment_defects')
        .select(`
          *,
          segment_defect_items (
            defect_type_id,
            quantity,
            location,
            photo_url,
            defect_types (
              name,
              severity
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const map = new Map<string, SegmentDefectData>();

      (defectsData || []).forEach((sd: any) => {
        const key = `${sd.vitrage_id}-${sd.segment_index}`;
        const defectNames = sd.segment_defect_items?.map((item: any) =>
          item.defect_types?.name || 'Неизвестный'
        ) || [];

        map.set(key, {
          id: sd.id,
          vitrageId: sd.vitrage_id,
          segmentIndex: sd.segment_index,
          inspectionDate: sd.inspection_date,
          inspector: sd.inspector || '',
          siteManager: sd.site_manager || '',
          defects: defectNames,
          notes: sd.notes || undefined,
          createdAt: new Date(sd.created_at),
          updatedAt: sd.updated_at ? new Date(sd.updated_at) : undefined,
        });
      });

      console.log('✅ All defects loaded from Supabase:', map.size);
      return { data: map, source: 'supabase' };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, using localStorage fallback');
      return { data: getDefectsFromLocalStorage(), source: 'localStorage' };
    }
  },
};

export default defectStorage;
