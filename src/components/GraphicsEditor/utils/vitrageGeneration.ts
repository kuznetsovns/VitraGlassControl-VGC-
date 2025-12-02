import type { VitrageSegment, VitrageGrid, CanvasDimensions } from '../types'

export function createVitrageGrid(
  gridRows: number,
  gridCols: number,
  vitrageName: string,
  canvasDimensions: CanvasDimensions
): VitrageGrid {
  if (gridRows < 1 || gridCols < 1) {
    throw new Error('Количество сегментов должно быть больше 0')
  }

  const profileWidth = 12
  const totalWidth = 600
  const totalHeight = 400
  const segmentWidth = (totalWidth - (gridCols + 1) * profileWidth) / gridCols
  const segmentHeight = (totalHeight - (gridRows + 1) * profileWidth) / gridRows

  const segments: VitrageSegment[] = []

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const x = (canvasDimensions.width - totalWidth) / 2 + profileWidth + col * (segmentWidth + profileWidth)
      const y = (canvasDimensions.height - totalHeight) / 2 + profileWidth + row * (segmentHeight + profileWidth)

      segments.push({
        id: `segment-${row}-${col}`,
        row,
        col,
        x,
        y,
        width: segmentWidth,
        height: segmentHeight,
        type: 'empty',
        selected: false,
        realWidth: Math.round(segmentWidth * 5),
        realHeight: Math.round(segmentHeight * 5),
        merged: false,
        rowSpan: 1,
        colSpan: 1
      })
    }
  }

  return {
    id: `vitrage-${Date.now()}`,
    name: vitrageName,
    rows: gridRows,
    cols: gridCols,
    segments,
    totalWidth,
    totalHeight,
    profileWidth,
    createdAt: new Date()
  }
}

export function generateNextVitrageName(vitrages: VitrageGrid[]): string {
  const nextNumber = vitrages.length + 1
  return `В-${String(nextNumber).padStart(2, '0')}`
}
