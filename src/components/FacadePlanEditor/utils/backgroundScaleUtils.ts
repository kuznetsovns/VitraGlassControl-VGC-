import type { BackgroundOffset } from '../types'

/**
 * Calculate background offset when image is scaled
 * Used to keep vitrag.es properly positioned when background scales
 */
export function calculateBackgroundOffset(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  backgroundScale: number = 1.0
): BackgroundOffset {
  const scaledWidth = imageWidth * backgroundScale
  const scaledHeight = imageHeight * backgroundScale

  // Calculate offset to center the scaled image (if it's smaller than canvas)
  // or to position it appropriately if larger
  const offsetX = (canvasWidth - scaledWidth) / 2
  const offsetY = (canvasHeight - scaledHeight) / 2

  return {
    x: Math.max(0, offsetX), // Don't go negative
    y: Math.max(0, offsetY)
  }
}

/**
 * Get scaled background dimensions
 */
export function getScaledBackgroundSize(
  imageWidth: number,
  imageHeight: number,
  backgroundScale: number = 1.0
): { width: number; height: number } {
  return {
    width: imageWidth * backgroundScale,
    height: imageHeight * backgroundScale
  }
}

/**
 * Clamp background scale to valid range (0.1 to 3.0)
 */
export function clampBackgroundScale(scale: number): number {
  return Math.max(0.1, Math.min(3.0, scale))
}

/**
 * Calculate zoom factor for background based on scale
 */
export function getBackgroundZoomFactor(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  backgroundScale: number = 1.0
): number {
  const scaledWidth = imageWidth * backgroundScale
  const scaledHeight = imageHeight * backgroundScale

  // Return the actual zoom ratio
  const widthRatio = canvasWidth / scaledWidth
  const heightRatio = canvasHeight / scaledHeight

  return Math.max(widthRatio, heightRatio)
}

/**
 * Transform vitrage position to background scale coordinates
 * Inverse operation for placing vitrages on scaled background
 */
export function transformVitragePositionToScale(
  x: number,
  y: number,
  backgroundScale: number = 1.0,
  bgOffset: BackgroundOffset = { x: 0, y: 0 }
): { x: number; y: number } {
  // Reverse the transformation:
  // original = (canvas - offset) / scale
  return {
    x: (x - bgOffset.x) / backgroundScale,
    y: (y - bgOffset.y) / backgroundScale
  }
}

/**
 * Transform stored vitrage position back to canvas coordinates
 */
export function transformVitragePositionToCanvas(
  x: number,
  y: number,
  backgroundScale: number = 1.0,
  bgOffset: BackgroundOffset = { x: 0, y: 0 }
): { x: number; y: number } {
  // Apply transformation:
  // canvas = stored * scale + offset
  return {
    x: x * backgroundScale + bgOffset.x,
    y: y * backgroundScale + bgOffset.y
  }
}
