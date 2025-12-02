// Re-export all utilities from VitrageVisualizer
export {
  recalculateAllPositions,
  mmToPixels,
  pixelsToMm,
  calculateColumnPositions,
  calculateRowPositions,
  calculateTotalDimensions
} from './positionCalculations'

export {
  areInSameMergedSegment,
  mergeSegments,
  unmergeSegments
} from './segmentMerging'

export {
  getSegmentFillColor,
  generateVitrageSVG,
  getSegmentStrokeColor,
  getSegmentStrokeWidth
} from './svgGeneration'

export {
  updateSegmentProperty,
  getSegmentProperties,
  initializeSegmentProperties,
  clearSegmentProperties
} from './segmentPropertyHandling'
