import type { VitrageGrid, VitrageSegment, CanvasDimensions } from '../types'

export function calculateProportionalSizes(
  vitrageGrid: VitrageGrid,
  canvasDimensions: CanvasDimensions
): VitrageGrid {
  const activeSegments = vitrageGrid.segments.filter(s => !s.merged)
  if (activeSegments.length === 0) return vitrageGrid

  const maxTotalWidth = Math.min(canvasDimensions.width * 0.9, 800)
  const maxTotalHeight = Math.min(canvasDimensions.height * 0.7, 600)

  const colWidths: number[] = new Array(vitrageGrid.cols).fill(100)
  const rowHeights: number[] = new Array(vitrageGrid.rows).fill(100)

  activeSegments.forEach(segment => {
    if (segment.realWidth && segment.realHeight) {
      const widthPerCol = segment.realWidth / (segment.colSpan || 1)
      const heightPerRow = segment.realHeight / (segment.rowSpan || 1)

      for (let c = segment.col; c < segment.col + (segment.colSpan || 1); c++) {
        colWidths[c] = widthPerCol
      }

      for (let r = segment.row; r < segment.row + (segment.rowSpan || 1); r++) {
        rowHeights[r] = heightPerRow
      }
    }
  })

  const totalRealWidth = colWidths.reduce((sum, w) => sum + w, 0)
  const totalRealHeight = rowHeights.reduce((sum, h) => sum + h, 0)

  const availableWidth = maxTotalWidth - (vitrageGrid.cols + 1) * vitrageGrid.profileWidth
  const availableHeight = maxTotalHeight - (vitrageGrid.rows + 1) * vitrageGrid.profileWidth

  const scaleX = availableWidth / totalRealWidth
  const scaleY = availableHeight / totalRealHeight
  const scale = Math.min(scaleX, scaleY, 1)

  const gridWidth = totalRealWidth * scale + (vitrageGrid.cols + 1) * vitrageGrid.profileWidth
  const gridHeight = totalRealHeight * scale + (vitrageGrid.rows + 1) * vitrageGrid.profileWidth

  const startX = (canvasDimensions.width - gridWidth) / 2
  const startY = (canvasDimensions.height - gridHeight) / 2

  const colPositions = [startX + vitrageGrid.profileWidth]
  for (let c = 0; c < vitrageGrid.cols; c++) {
    if (c > 0) {
      colPositions.push(colPositions[c] + colWidths[c - 1] * scale + vitrageGrid.profileWidth)
    }
  }

  const rowPositions = [startY + vitrageGrid.profileWidth]
  for (let r = 0; r < vitrageGrid.rows; r++) {
    if (r > 0) {
      rowPositions.push(rowPositions[r] + rowHeights[r - 1] * scale + vitrageGrid.profileWidth)
    }
  }

  const updatedSegments = vitrageGrid.segments.map(segment => {
    if (segment.merged) return segment

    const x = colPositions[segment.col]
    const y = rowPositions[segment.row]

    let segmentWidth = 0
    for (let c = segment.col; c < segment.col + (segment.colSpan || 1); c++) {
      segmentWidth += colWidths[c] * scale
    }
    if ((segment.colSpan || 1) > 1) {
      segmentWidth += ((segment.colSpan || 1) - 1) * vitrageGrid.profileWidth
    }

    let segmentHeight = 0
    for (let r = segment.row; r < segment.row + (segment.rowSpan || 1); r++) {
      segmentHeight += rowHeights[r] * scale
    }
    if ((segment.rowSpan || 1) > 1) {
      segmentHeight += ((segment.rowSpan || 1) - 1) * vitrageGrid.profileWidth
    }

    return {
      ...segment,
      x,
      y,
      width: segmentWidth,
      height: segmentHeight
    }
  })

  return {
    ...vitrageGrid,
    segments: updatedSegments,
    totalWidth: gridWidth,
    totalHeight: gridHeight
  }
}

export function canMergeSegments(segments: VitrageSegment[]): boolean {
  if (segments.length < 2) return false

  const minRow = Math.min(...segments.map(s => s.row))
  const maxRow = Math.max(...segments.map(s => s.row))
  const minCol = Math.min(...segments.map(s => s.col))
  const maxCol = Math.max(...segments.map(s => s.col))

  const expectedCount = (maxRow - minRow + 1) * (maxCol - minCol + 1)
  if (segments.length !== expectedCount) return false

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const hasSegmentAt = segments.some(s => s.row === row && s.col === col)
      if (!hasSegmentAt) return false
    }
  }

  return true
}
