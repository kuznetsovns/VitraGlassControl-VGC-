// Vitrage ID related types (8-component system)
export interface VitrageID {
  object: string         // Объект (Зил18, Примавера14)
  corpus: string         // Корпус
  section: string        // Секция
  floor: string          // Этаж
  apartment: string      // Квартира
  vitrageNumber: string  // Номер витража
  vitrageName: string    // Название витража
  vitrageSection: string // Секция витража
}

export interface IdOptions {
  objects: string[]
  corpuses: string[]
  sections: string[]
  floors: string[]
  apartments: string[]
  vitrageNumbers: string[]
  vitrageNames: string[]
  vitrageSections: string[]
}

export interface SegmentIDState {
  selectedSegmentForID: string | null
  segmentIDsTemp: Record<string, VitrageID>
  vitrageIDData: VitrageID
}
