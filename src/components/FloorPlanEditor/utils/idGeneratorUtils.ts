import type { VitrageID } from '../types'

/**
 * Generate full ID string from VitrageID components
 * Format: object-corpus-section-floor-apartment-vitrageNumber-vitrageName-vitrageSection
 */
export function generateFullID(vitrageID: VitrageID): string {
  const components = [
    vitrageID.object || 'X',
    vitrageID.corpus || 'X',
    vitrageID.section || 'X',
    vitrageID.floor || 'X',
    vitrageID.apartment || 'X',
    vitrageID.vitrageNumber || 'X',
    vitrageID.vitrageName || 'X',
    vitrageID.vitrageSection || 'X'
  ]
  return components.join('-')
}

/**
 * Check if VitrageID is complete (all fields filled)
 */
export function isVitrageIDComplete(vitrageID: VitrageID): boolean {
  return !!(
    vitrageID.object &&
    vitrageID.corpus &&
    vitrageID.section &&
    vitrageID.floor &&
    vitrageID.apartment &&
    vitrageID.vitrageNumber &&
    vitrageID.vitrageName &&
    vitrageID.vitrageSection
  )
}

/**
 * Create empty VitrageID
 */
export function createEmptyVitrageID(): VitrageID {
  return {
    object: '',
    corpus: '',
    section: '',
    floor: '',
    apartment: '',
    vitrageNumber: '',
    vitrageName: '',
    vitrageSection: ''
  }
}

/**
 * Collect all available options from existing segment IDs
 */
export function collectIdOptions(allSegmentIDs: Array<Record<string, VitrageID>>): {
  objects: string[]
  corpuses: string[]
  sections: string[]
  floors: string[]
  apartments: string[]
  vitrageNumbers: string[]
  vitrageNames: string[]
  vitrageSections: string[]
} {
  const objects = new Set<string>()
  const corpuses = new Set<string>()
  const sections = new Set<string>()
  const floors = new Set<string>()
  const apartments = new Set<string>()
  const vitrageNumbers = new Set<string>()
  const vitrageNames = new Set<string>()
  const vitrageSections = new Set<string>()

  allSegmentIDs.forEach(segmentIDMap => {
    Object.values(segmentIDMap).forEach(id => {
      if (id.object) objects.add(id.object)
      if (id.corpus) corpuses.add(id.corpus)
      if (id.section) sections.add(id.section)
      if (id.floor) floors.add(id.floor)
      if (id.apartment) apartments.add(id.apartment)
      if (id.vitrageNumber) vitrageNumbers.add(id.vitrageNumber)
      if (id.vitrageName) vitrageNames.add(id.vitrageName)
      if (id.vitrageSection) vitrageSections.add(id.vitrageSection)
    })
  })

  return {
    objects: Array.from(objects).sort(),
    corpuses: Array.from(corpuses).sort(),
    sections: Array.from(sections).sort(),
    floors: Array.from(floors).sort(),
    apartments: Array.from(apartments).sort(),
    vitrageNumbers: Array.from(vitrageNumbers).sort(),
    vitrageNames: Array.from(vitrageNames).sort(),
    vitrageSections: Array.from(vitrageSections).sort()
  }
}
