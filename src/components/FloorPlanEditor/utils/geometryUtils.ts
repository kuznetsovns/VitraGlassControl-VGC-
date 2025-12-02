import type { PlacedVitrage, VitrageGrid, MousePosition } from '../types'

/**
 * Get mouse position relative to canvas with zoom and pan applied
 */
export function getMousePos(
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement | null,
  zoomLevel: number = 1,
  panOffset: MousePosition = { x: 0, y: 0 }
): MousePosition {
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  const x = (event.clientX - rect.left - panOffset.x) / zoomLevel
  const y = (event.clientY - rect.top - panOffset.y) / zoomLevel

  return { x, y }
}

/**
 * Get mouse position for wheel events
 */
export function getMousePosFromWheel(
  event: WheelEvent,
  canvas: HTMLCanvasElement | null,
  zoomLevel: number = 1,
  panOffset: MousePosition = { x: 0, y: 0 }
): MousePosition {
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  const x = (event.clientX - rect.left - panOffset.x) / zoomLevel
  const y = (event.clientY - rect.top - panOffset.y) / zoomLevel

  return { x, y }
}

/**
 * Check if point is inside a rotated vitrage
 */
export function isPointInRotatedVitrage(
  point: MousePosition,
  vitrage: PlacedVitrage,
  vitrageSize: { width: number; height: number }
): boolean {
  const cos = Math.cos((vitrage.rotation * Math.PI) / 180)
  const sin = Math.sin((vitrage.rotation * Math.PI) / 180)

  // Translate to vitrage center
  const dx = point.x - vitrage.x - (vitrageSize.width * vitrage.scale) / 2
  const dy = point.y - vitrage.y - (vitrageSize.height * vitrage.scale) / 2

  // Rotate back
  const rx = dx * cos + dy * sin
  const ry = -dx * sin + dy * cos

  // Check bounds
  const halfWidth = (vitrageSize.width * vitrage.scale) / 2
  const halfHeight = (vitrageSize.height * vitrage.scale) / 2

  return rx >= -halfWidth && rx <= halfWidth && ry >= -halfHeight && ry <= halfHeight
}

/**
 * Find vitrage at given position
 */
export function findVitrageAtPosition(
  point: MousePosition,
  placedVitrages: PlacedVitrage[],
  vitrageMap: Map<string, VitrageGrid>
): PlacedVitrage | null {
  // Check in reverse order (last drawn on top)
  for (let i = placedVitrages.length - 1; i >= 0; i--) {
    const vitrage = placedVitrages[i]
    const vitrageInfo = vitrageMap.get(vitrage.vitrageId)

    if (vitrageInfo) {
      if (isPointInRotatedVitrage(point, vitrage, {
        width: vitrageInfo.totalWidth,
        height: vitrageInfo.totalHeight
      })) {
        return vitrage
      }
    }
  }

  return null
}

/**
 * Get vitrage display size with scale applied
 */
export function getScaledVitrageSize(
  vitrage: VitrageGrid,
  scale: number
): { width: number; height: number } {
  return {
    width: vitrage.totalWidth * scale,
    height: vitrage.totalHeight * scale
  }
}

/**
 * Rotate point around center
 */
export function rotatePoint(
  point: MousePosition,
  center: MousePosition,
  angle: number
): MousePosition {
  const cos = Math.cos((angle * Math.PI) / 180)
  const sin = Math.sin((angle * Math.PI) / 180)

  const x = point.x - center.x
  const y = point.y - center.y

  return {
    x: x * cos - y * sin + center.x,
    y: x * sin + y * cos + center.y
  }
}

/**
 * Get bounding box of rotated rectangle
 */
export function getRotatedBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  const cos = Math.cos((rotation * Math.PI) / 180)
  const sin = Math.sin((rotation * Math.PI) / 180)

  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ]

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  corners.forEach(corner => {
    const rx = corner.x * cos - corner.y * sin + x
    const ry = corner.x * sin + corner.y * cos + y

    minX = Math.min(minX, rx)
    minY = Math.min(minY, ry)
    maxX = Math.max(maxX, rx)
    maxY = Math.max(maxY, ry)
  })

  return { minX, minY, maxX, maxY }
}
