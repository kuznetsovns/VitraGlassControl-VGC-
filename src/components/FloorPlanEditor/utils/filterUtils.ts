import type { FloorPlan, Filters } from '../types'

/**
 * Filter floor plans based on criteria
 */
export function filterFloorPlans(plans: FloorPlan[], filters: Filters): FloorPlan[] {
  return plans.filter(plan => {
    if (filters.name && !plan.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false
    }
    if (filters.corpus && plan.corpus !== filters.corpus) {
      return false
    }
    if (filters.section && plan.section !== filters.section) {
      return false
    }
    if (filters.floor && plan.floor.toString() !== filters.floor) {
      return false
    }
    return true
  })
}

/**
 * Get unique corpuses from plans
 */
export function getUniqueCorporuses(plans: FloorPlan[]): string[] {
  const corpuses = new Set(plans.map(p => p.corpus).filter(Boolean))
  return Array.from(corpuses).sort()
}

/**
 * Get unique sections from plans
 */
export function getUniqueSections(plans: FloorPlan[]): string[] {
  const sections = new Set(plans.map(p => p.section).filter(Boolean))
  return Array.from(sections).sort()
}

/**
 * Get unique floors from plans
 */
export function getUniqueFloors(plans: FloorPlan[]): number[] {
  const floors = new Set(plans.map(p => p.floor))
  return Array.from(floors).sort((a, b) => a - b)
}

/**
 * Clear all filters
 */
export function clearFilters(): Filters {
  return {
    name: '',
    corpus: '',
    section: '',
    floor: ''
  }
}
