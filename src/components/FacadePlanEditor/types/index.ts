// Export facade-specific types
export type {
  FacadePlan,
  FacadePlanEditorProps,
  BackgroundScaleState,
  CanvasDimensions,
  MousePosition,
  NewPlanData,
  Filters,
  BackgroundOffset
} from './facadePlan.types'

// Re-export common types from FloorPlanEditor
export type {
  Wall,
  Room,
  VitrageGrid,
  SegmentIDMapping,
  PlacedVitrage,
  VitrageID,
  IdOptions
} from '../../FloorPlanEditor/types'
