import { useCallback } from 'react'
import type { VitrageGrid, VitrageSegment, CanvasDimensions } from '../types'

export function useCanvasDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  vitrageGrid: VitrageGrid | null,
  canvasDimensions: CanvasDimensions,
  mergeMode: boolean,
  selectedForMerge: VitrageSegment[],
  isProfileNeeded: (row: number, col: number, direction: 'horizontal' | 'vertical') => boolean
) {
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height)

    if (!vitrageGrid) return

    const startX = (canvasDimensions.width - vitrageGrid.totalWidth) / 2
    const startY = (canvasDimensions.height - vitrageGrid.totalHeight) / 2

    // Рисуем внешнюю рамку
    ctx.fillStyle = '#808080'
    ctx.fillRect(startX, startY, vitrageGrid.totalWidth, vitrageGrid.profileWidth) // Top
    ctx.fillRect(startX, startY + vitrageGrid.totalHeight - vitrageGrid.profileWidth, vitrageGrid.totalWidth, vitrageGrid.profileWidth) // Bottom
    ctx.fillRect(startX, startY, vitrageGrid.profileWidth, vitrageGrid.totalHeight) // Left
    ctx.fillRect(startX + vitrageGrid.totalWidth - vitrageGrid.profileWidth, startY, vitrageGrid.profileWidth, vitrageGrid.totalHeight) // Right

    const activeSegments = vitrageGrid.segments.filter(s => !s.merged)

    // Рисуем горизонтальные профили между строками
    for (let row = 1; row < vitrageGrid.rows; row++) {
      for (let col = 0; col < vitrageGrid.cols; col++) {
        if (isProfileNeeded(row, col, 'horizontal')) {
          const segmentAbove = activeSegments.find(s =>
            s.row + (s.rowSpan || 1) - 1 === row - 1 &&
            s.col <= col && s.col + (s.colSpan || 1) > col
          )
          const segmentBelow = activeSegments.find(s =>
            s.row === row &&
            s.col <= col && s.col + (s.colSpan || 1) > col
          )

          if (segmentAbove && segmentBelow) {
            const y = segmentAbove.y + segmentAbove.height
            const x = Math.max(segmentAbove.x, segmentBelow.x)
            const width = Math.min(segmentAbove.x + segmentAbove.width, segmentBelow.x + segmentBelow.width) - x

            if (width > 0) {
              ctx.fillRect(x, y, width, vitrageGrid.profileWidth)
            }
          }
        }
      }
    }

    // Рисуем вертикальные профили между колонками
    for (let col = 1; col < vitrageGrid.cols; col++) {
      for (let row = 0; row < vitrageGrid.rows; row++) {
        if (isProfileNeeded(row, col, 'vertical')) {
          const segmentLeft = activeSegments.find(s =>
            s.col + (s.colSpan || 1) - 1 === col - 1 &&
            s.row <= row && s.row + (s.rowSpan || 1) > row
          )
          const segmentRight = activeSegments.find(s =>
            s.col === col &&
            s.row <= row && s.row + (s.rowSpan || 1) > row
          )

          if (segmentLeft && segmentRight) {
            const x = segmentLeft.x + segmentLeft.width
            const y = Math.max(segmentLeft.y, segmentRight.y)
            const height = Math.min(segmentLeft.y + segmentLeft.height, segmentRight.y + segmentRight.height) - y

            if (height > 0) {
              ctx.fillRect(x, y, vitrageGrid.profileWidth, height)
            }
          }
        }
      }
    }

    // Рисуем пересечения профилей
    ctx.fillStyle = '#808080'
    activeSegments.forEach(segment => {
      const actualWidth = segment.width * (segment.colSpan || 1) + (segment.colSpan && segment.colSpan > 1 ? (segment.colSpan - 1) * vitrageGrid.profileWidth : 0)
      const actualHeight = segment.height * (segment.rowSpan || 1) + (segment.rowSpan && segment.rowSpan > 1 ? (segment.rowSpan - 1) * vitrageGrid.profileWidth : 0)

      // Top-left, Top-right, Bottom-left, Bottom-right
      if (segment.row > 0 && segment.col > 0) {
        ctx.fillRect(segment.x - vitrageGrid.profileWidth, segment.y - vitrageGrid.profileWidth, vitrageGrid.profileWidth, vitrageGrid.profileWidth)
      }
      if (segment.row > 0 && segment.col + (segment.colSpan || 1) < vitrageGrid.cols) {
        ctx.fillRect(segment.x + actualWidth, segment.y - vitrageGrid.profileWidth, vitrageGrid.profileWidth, vitrageGrid.profileWidth)
      }
      if (segment.row + (segment.rowSpan || 1) < vitrageGrid.rows && segment.col > 0) {
        ctx.fillRect(segment.x - vitrageGrid.profileWidth, segment.y + actualHeight, vitrageGrid.profileWidth, vitrageGrid.profileWidth)
      }
      if (segment.row + (segment.rowSpan || 1) < vitrageGrid.rows && segment.col + (segment.colSpan || 1) < vitrageGrid.cols) {
        ctx.fillRect(segment.x + actualWidth, segment.y + actualHeight, vitrageGrid.profileWidth, vitrageGrid.profileWidth)
      }
    })

    // Рисуем сегменты
    vitrageGrid.segments.forEach(segment => {
      if (segment.merged) return

      let fillStyle = '#f8f9fa'
      let strokeStyle = '#dee2e6'

      if (segment.type === 'glass') {
        fillStyle = segment.selected ? 'rgba(74, 144, 226, 0.3)' : 'rgba(135, 206, 235, 0.2)'
        strokeStyle = segment.selected ? '#4a90e2' : '#87ceeb'
      } else if (segment.type === 'ventilation') {
        fillStyle = segment.selected ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 235, 59, 0.2)'
        strokeStyle = segment.selected ? '#ffa000' : '#ffeb3b'
      } else if (segment.type === 'sandwich') {
        fillStyle = segment.selected ? 'rgba(139, 69, 19, 0.3)' : 'rgba(205, 133, 63, 0.2)'
        strokeStyle = segment.selected ? '#8b4513' : '#cd853f'
      } else if (segment.type === 'casement') {
        fillStyle = segment.selected ? 'rgba(34, 139, 34, 0.3)' : 'rgba(144, 238, 144, 0.2)'
        strokeStyle = segment.selected ? '#228b22' : '#90ee90'
      } else if (segment.type === 'door') {
        fillStyle = segment.selected ? 'rgba(128, 0, 128, 0.3)' : 'rgba(221, 160, 221, 0.2)'
        strokeStyle = segment.selected ? '#800080' : '#dda0dd'
      }

      if (mergeMode && selectedForMerge.some(s => s.id === segment.id)) {
        strokeStyle = '#ff4444'
        ctx.lineWidth = 3
      } else if (segment.selected) {
        strokeStyle = '#4a90e2'
        ctx.lineWidth = 2
      } else {
        ctx.lineWidth = 2
      }

      ctx.fillStyle = fillStyle
      ctx.strokeStyle = strokeStyle

      const actualWidth = segment.width * (segment.colSpan || 1) + (segment.colSpan && segment.colSpan > 1 ? (segment.colSpan - 1) * vitrageGrid.profileWidth : 0)
      const actualHeight = segment.height * (segment.rowSpan || 1) + (segment.rowSpan && segment.rowSpan > 1 ? (segment.rowSpan - 1) * vitrageGrid.profileWidth : 0)

      ctx.fillRect(segment.x, segment.y, actualWidth, actualHeight)
      ctx.strokeRect(segment.x, segment.y, actualWidth, actualHeight)

      // Рисуем размеры
      const centerX = segment.x + actualWidth / 2
      const centerY = segment.y + actualHeight / 2

      if (segment.realWidth && segment.realHeight && !segment.merged) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillRect(centerX - 25, segment.y - 15, 50, 12)
        ctx.strokeStyle = '#4a90e2'
        ctx.lineWidth = 1
        ctx.strokeRect(centerX - 25, segment.y - 15, 50, 12)

        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${Math.round(segment.realWidth)}мм`, centerX, segment.y - 9)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillRect(segment.x - 35, centerY - 15, 30, 30)
        ctx.strokeStyle = '#4a90e2'
        ctx.lineWidth = 1
        ctx.strokeRect(segment.x - 35, centerY - 15, 30, 30)

        ctx.save()
        ctx.translate(segment.x - 20, centerY)
        ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${Math.round(segment.realHeight)}мм`, 0, 0)
        ctx.restore()
      }

      // Рисуем тип сегмента
      if (segment.type === 'glass') {
        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        if (segment.label) {
          ctx.fillText(segment.label, centerX, centerY - 10)
        }
        if (segment.formula) {
          ctx.fillStyle = '#666'
          ctx.font = '10px Arial'
          ctx.fillText(`F: ${segment.formula}`, centerX, centerY + 5)
        }
      }
    })
  }, [canvasDimensions, vitrageGrid, mergeMode, selectedForMerge, isProfileNeeded])

  return { drawCanvas }
}
