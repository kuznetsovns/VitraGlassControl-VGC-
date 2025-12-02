import type { MousePosition, BackgroundOffset } from '../types'

/**
 * Get mouse position accounting for zoom, pan, AND background scale
 * This is the key difference from FloorPlanEditor
 */
export function getMousePosWithBackgroundScale(
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement | null,
  zoomLevel: number = 1,
  panOffset: MousePosition = { x: 0, y: 0 },
  backgroundScale: number = 1.0,
  bgOffset: BackgroundOffset = { x: 0, y: 0 }
): MousePosition {
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  const canvasX = event.clientX - rect.left
  const canvasY = event.clientY - rect.top

  // Apply transformations in reverse order:
  // 1. Pan and zoom
  // 2. Background offset and scale
  const x = ((canvasX - panOffset.x) / zoomLevel - bgOffset.x) / backgroundScale
  const y = ((canvasY - panOffset.y) / zoomLevel - bgOffset.y) / backgroundScale

  return { x, y }
}

/**
 * Get mouse position for wheel events with background scale
 */
export function getMousePosFromWheelWithBackgroundScale(
  event: WheelEvent,
  canvas: HTMLCanvasElement | null,
  zoomLevel: number = 1,
  panOffset: MousePosition = { x: 0, y: 0 },
  backgroundScale: number = 1.0,
  bgOffset: BackgroundOffset = { x: 0, y: 0 }
): MousePosition {
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  const canvasX = event.clientX - rect.left
  const canvasY = event.clientY - rect.top

  const x = ((canvasX - panOffset.x) / zoomLevel - bgOffset.x) / backgroundScale
  const y = ((canvasY - panOffset.y) / zoomLevel - bgOffset.y) / backgroundScale

  return { x, y }
}

/**
 * Transform world coordinates to canvas coordinates with background scale
 */
export function transformWorldToCanvas(
  x: number,
  y: number,
  zoomLevel: number = 1,
  panOffset: MousePosition = { x: 0, y: 0 },
  backgroundScale: number = 1.0,
  bgOffset: BackgroundOffset = { x: 0, y: 0 }
): MousePosition {
  // Reverse transformation:
  // canvas = (world * bgScale + bgOffset) * zoom + pan
  return {
    x: (x * backgroundScale + bgOffset.x) * zoomLevel + panOffset.x,
    y: (y * backgroundScale + bgOffset.y) * zoomLevel + panOffset.y
  }
}

/**
 * Check if point is inside a rectangle (rotated or not)
 */
export function isPointInRectangle(
  point: MousePosition,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number = 0
): boolean {
  if (rotation === 0) {
    // Simple axis-aligned rectangle check
    return (
      point.x >= x &&
      point.x <= x + width &&
      point.y >= y &&
      point.y <= y + height
    )
  }

  // For rotated rectangles, transform point back to local coordinates
  const cos = Math.cos((rotation * Math.PI) / 180)
  const sin = Math.sin((rotation * Math.PI) / 180)

  // Translate point relative to rectangle origin
  const localX = point.x - x
  const localY = point.y - y

  // Rotate point back by negative angle
  const radians = (-rotation * Math.PI) / 180
  const cosR = Math.cos(radians)
  const sinR = Math.sin(radians)

  const originalX = localX * cosR - localY * sinR
  const originalY = localX * sinR + localY * cosR

  // Check if point is within unrotated bounds
  return originalX >= 0 && originalX <= width && originalY >= 0 && originalY <= height
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
