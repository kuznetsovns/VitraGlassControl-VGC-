import type { VitrageGrid, VitrageSegment } from '../types'

export function getMousePos(e: React.MouseEvent<HTMLCanvasElement>, canvasRef: React.RefObject<HTMLCanvasElement>) {
  const canvas = canvasRef.current
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

export function findSegmentAt(x: number, y: number, vitrageGrid: VitrageGrid | null): VitrageSegment | null {
  if (!vitrageGrid) return null

  for (const segment of vitrageGrid.segments) {
    if (x >= segment.x && x <= segment.x + segment.width &&
      y >= segment.y && y <= segment.y + segment.height) {
      return segment
    }
  }

  return null
}

export function findDimensionAt(
  x: number,
  y: number,
  vitrageGrid: VitrageGrid | null
): { segment: VitrageSegment; type: 'width' | 'height' } | null {
  if (!vitrageGrid) return null

  const activeSegments = vitrageGrid.segments.filter(s => !s.merged && s.realWidth && s.realHeight)

  for (const segment of activeSegments) {
    const actualWidth = segment.width * (segment.colSpan || 1) + (segment.colSpan && segment.colSpan > 1 ? (segment.colSpan - 1) * vitrageGrid.profileWidth : 0)
    const actualHeight = segment.height * (segment.rowSpan || 1) + (segment.rowSpan && segment.rowSpan > 1 ? (segment.rowSpan - 1) * vitrageGrid.profileWidth : 0)

    const centerX = segment.x + actualWidth / 2
    const centerY = segment.y + actualHeight / 2

    const widthBoxX = centerX
    const widthBoxY = segment.y - 9
    if (Math.abs(x - widthBoxX) < 25 && Math.abs(y - widthBoxY) < 6) {
      return { segment, type: 'width' }
    }

    const heightBoxX = segment.x - 20
    const heightBoxY = centerY
    if (Math.abs(x - heightBoxX) < 15 && Math.abs(y - heightBoxY) < 15) {
      return { segment, type: 'height' }
    }
  }

  return null
}
