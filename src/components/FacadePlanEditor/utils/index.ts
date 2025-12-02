// Export facade-specific utilities
export {
  calculateBackgroundOffset,
  getScaledBackgroundSize,
  clampBackgroundScale,
  getBackgroundZoomFactor,
  transformVitragePositionToScale,
  transformVitragePositionToCanvas
} from './backgroundScaleUtils'

export {
  getMousePosWithBackgroundScale,
  getMousePosFromWheelWithBackgroundScale,
  transformWorldToCanvas,
  isPointInRectangle,
  getRotatedBounds,
  rotatePoint
} from './facadeGeometryUtils'

// Re-export common utilities from FloorPlanEditor
export {
  filterFloorPlans,
  getUniqueCorporuses,
  getUniqueSections,
  getUniqueFloors,
  clearFilters
} from '../../FloorPlanEditor/utils'

export {
  generateFullID,
  isVitrageIDComplete,
  createEmptyVitrageID,
  collectIdOptions
} from '../../FloorPlanEditor/utils'
