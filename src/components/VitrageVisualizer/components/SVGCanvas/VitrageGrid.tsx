import React from 'react'
import type { CreatedVitrage, SegmentProperties } from '../../types'
import { getSegmentFillColor, getSegmentStrokeColor, getSegmentStrokeWidth } from '../../utils/svgGeneration'
import { mmToPixels } from '../../utils/positionCalculations'

interface VitrageGridProps {
  vitrage: CreatedVitrage
  segmentProperties: SegmentProperties
  selectedSegment: number | null
  selectedSegments: Set<number>
  onSegmentClick: (segmentId: number, ctrlKey: boolean) => void
  zoom: number
  pan: { x: number; y: number }
  isPanning: boolean
}

export function VitrageGrid({
  vitrage,
  segmentProperties,
  selectedSegment,
  selectedSegments,
  onSegmentClick,
  zoom,
  pan,
  isPanning
}: VitrageGridProps) {
  const cols = vitrage.horizontal
  const rows = vitrage.vertical
  const baseSegmentWidth = 600 / cols
  const baseSegmentHeight = 400 / rows

  // Инициализируем массивы для ширины и высоты
  const columnWidths: number[] = new Array(cols).fill(baseSegmentWidth)
  const rowHeights: number[] = new Array(rows).fill(baseSegmentHeight)

  // Обрабатываем все сегменты для установки базовых размеров столбцов и строк
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const segmentId = row * cols + col + 1
      const properties = segmentProperties[segmentId]

      // Пропускаем скрытые сегменты
      if (properties?.hidden) continue

      // Для обычных сегментов просто берем их размеры
      if (!properties?.merged) {
        if (properties?.width) {
          const customWidth = mmToPixels(properties.width)
          columnWidths[col] = Math.max(columnWidths[col], customWidth)
        }

        if (properties?.height) {
          const customHeight = mmToPixels(properties.height)
          rowHeights[row] = Math.max(rowHeights[row], customHeight)
        }
      } else {
        // Для объединенных сегментов распределяем их размеры на столбцы/строки
        const colSpan = properties.colSpan || 1
        const rowSpan = properties.rowSpan || 1

        if (properties.width) {
          const mergedWidth = mmToPixels(properties.width)
          const widthPerColumn = mergedWidth / colSpan
          for (let c = col; c < col + colSpan && c < cols; c++) {
            columnWidths[c] = Math.max(columnWidths[c], widthPerColumn)
          }
        }

        if (properties.height) {
          const mergedHeight = mmToPixels(properties.height)
          const heightPerRow = mergedHeight / rowSpan
          for (let r = row; r < row + rowSpan && r < rows; r++) {
            rowHeights[r] = Math.max(rowHeights[r], heightPerRow)
          }
        }
      }
    }
  }

  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0)
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0)
  const padding = 50
  const offsetX = padding
  const offsetY = padding
  const viewBoxWidth = totalWidth + padding * 2
  const viewBoxHeight = totalHeight + padding * 2

  // Рассчитываем кумулятивные позиции
  const cumulativeX: number[] = [offsetX]
  for (let col = 0; col < cols; col++) {
    cumulativeX.push(cumulativeX[col] + columnWidths[col])
  }

  const cumulativeY: number[] = [offsetY]
  for (let row = 0; row < rows; row++) {
    cumulativeY.push(cumulativeY[row] + rowHeights[row])
  }

  const segments: React.ReactNode[] = []
  const rigels: React.ReactNode[] = []
  const rigelWidth = 8

  // Рисуем сегменты
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const segmentId = row * cols + col + 1
      const properties = segmentProperties[segmentId]

      if (properties?.hidden) continue

      const segmentWidth = columnWidths[col]
      const segmentHeight = rowHeights[row]
      const x = cumulativeX[col]
      const y = cumulativeY[row]

      const isSelected = selectedSegment === segmentId
      const isMultiSelected = selectedSegments.has(segmentId)

      // Если сегмент объединенный, рассчитываем его размеры
      let actualWidth = segmentWidth
      let actualHeight = segmentHeight
      if (properties?.merged && properties?.rowSpan && properties?.colSpan) {
        actualWidth = 0
        for (let c = col; c < col + properties.colSpan && c < cols; c++) {
          actualWidth += columnWidths[c]
        }
        actualHeight = 0
        for (let r = row; r < row + properties.rowSpan && r < rows; r++) {
          actualHeight += rowHeights[r]
        }
      }

      const fillColor = getSegmentFillColor(properties?.type, isSelected, isMultiSelected)
      const strokeColor = getSegmentStrokeColor(isSelected, isMultiSelected)
      const strokeWidth = getSegmentStrokeWidth(isSelected, isMultiSelected)

      segments.push(
        <g key={`segment-${row}-${col}`}>
          <rect
            x={x}
            y={y}
            width={actualWidth}
            height={actualHeight}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onClick={(e) => onSegmentClick(segmentId, e.ctrlKey)}
            style={{ cursor: 'pointer' }}
          />
          {properties?.label && (
            <text
              x={x + actualWidth / 2}
              y={y + actualHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="16"
              fill="#2c3e50"
              fontWeight="600"
              style={{ pointerEvents: 'none' }}
            >
              {properties.label}
            </text>
          )}
        </g>
      )
    }
  }

  // Рисуем ригели
  for (let row = 1; row < rows; row++) {
    const y = cumulativeY[row] - rigelWidth / 2
    for (let col = 0; col < cols; col++) {
      const x = cumulativeX[col]
      const width = columnWidths[col]
      rigels.push(
        <rect
          key={`h-rigel-${row}-${col}`}
          x={x}
          y={y}
          width={width}
          height={rigelWidth}
          fill="#2c3e50"
          opacity="0.8"
        />
      )
    }
  }

  for (let col = 1; col < cols; col++) {
    const x = cumulativeX[col] - rigelWidth / 2
    for (let row = 0; row < rows; row++) {
      const y = cumulativeY[row]
      const height = rowHeights[row]
      rigels.push(
        <rect
          key={`v-rigel-${row}-${col}`}
          x={x}
          y={y}
          width={rigelWidth}
          height={height}
          fill="#2c3e50"
          opacity="0.8"
        />
      )
    }
  }

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="vitrage-grid-workspace"
      preserveAspectRatio="xMidYMid meet"
      style={{
        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
        transformOrigin: 'center center',
        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
      }}
    >
      {/* Внешняя рамка */}
      <rect
        x={offsetX}
        y={offsetY}
        width={totalWidth}
        height={totalHeight}
        fill="none"
        stroke="#2c3e50"
        strokeWidth="4"
      />
      {segments}
      {rigels}
    </svg>
  )
}
