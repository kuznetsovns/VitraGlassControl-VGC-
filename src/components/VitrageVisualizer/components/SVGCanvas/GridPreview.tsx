import React from 'react'

interface GridPreviewProps {
  horizontalSegments: number
  verticalSegments: number
  vitrageName: string
}

export function GridPreview({ horizontalSegments, verticalSegments, vitrageName }: GridPreviewProps) {
  if (horizontalSegments <= 0 || verticalSegments <= 0) {
    return null
  }

  const cols = horizontalSegments
  const rows = verticalSegments
  const segmentWidth = 500 / cols
  const segmentHeight = 300 / rows
  const segments = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = 50 + col * segmentWidth
      const y = 50 + row * segmentHeight

      segments.push(
        <g key={`segment-${row}-${col}`}>
          <rect
            x={x}
            y={y}
            width={segmentWidth}
            height={segmentHeight}
            fill="rgba(135, 206, 235, 0.2)"
            stroke="#87ceeb"
            strokeWidth="1"
          />
          <text
            x={x + segmentWidth / 2}
            y={y + segmentHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill="#2c3e50"
            fontWeight="600"
          >
            {row * cols + col + 1}
          </text>
        </g>
      )
    }
  }

  return (
    <svg
      width="600"
      height="400"
      viewBox="0 0 600 400"
      className="vitrage-grid"
    >
      {/* Внешняя рамка */}
      <rect
        x="50"
        y="50"
        width="500"
        height="300"
        fill="none"
        stroke="#2c3e50"
        strokeWidth="3"
      />

      {/* Сегменты */}
      {segments}

      {/* Маркировка витража */}
      {vitrageName && (
        <text
          x="300"
          y="30"
          textAnchor="middle"
          fontSize="16"
          fill="#2c3e50"
          fontWeight="700"
        >
          {vitrageName}
        </text>
      )}
    </svg>
  )
}
