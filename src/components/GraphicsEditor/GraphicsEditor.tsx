import { useState, useRef, useEffect, useCallback } from 'react'
import './GraphicsEditor.css'

export interface VitrageSegment {
  id: string
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
  type: 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door'
  formula?: string
  label?: string
  selected?: boolean
  // Actual dimensions in mm
  realWidth?: number
  realHeight?: number
  // For merged segments
  merged?: boolean
  mergedWith?: string[] // IDs of segments this was merged with
  rowSpan?: number
  colSpan?: number
  // Stemalit property for glass segments
  isStemalit?: boolean
}

export interface VitrageGrid {
  id: string
  name: string
  rows: number
  cols: number
  segments: VitrageSegment[]
  totalWidth: number
  totalHeight: number
  profileWidth: number
  createdAt: Date
}

interface GraphicsEditorProps {
  width?: number
  height?: number
}

export default function GraphicsEditor({ width = 800, height = 600 }: GraphicsEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Grid configuration state
  const [showGridConfig, setShowGridConfig] = useState(true)
  const [gridRows, setGridRows] = useState(3)
  const [gridCols, setGridCols] = useState(4)
  const [vitrageName, setVitrageName] = useState('В-01')
  const [vitrageGrid, setVitrageGrid] = useState<VitrageGrid | null>(null)
  
  // Selection and properties state
  const [selectedSegment, setSelectedSegment] = useState<VitrageSegment | null>(null)
  const [showProperties, setShowProperties] = useState(false)
  
  // Merge functionality state
  const [mergeMode, setMergeMode] = useState(false)
  const [selectedForMerge, setSelectedForMerge] = useState<VitrageSegment[]>([])
  
  // Interactive dimension editing state
  const [editingDimension, setEditingDimension] = useState<{
    segmentId: string
    type: 'width' | 'height'
    x: number
    y: number
    value: number
  } | null>(null)

  const createVitrageGrid = () => {
    if (gridRows < 1 || gridCols < 1) return
    
    const profileWidth = 12 // Reduced from 20 to 12 for thinner profiles
    const totalWidth = 600
    const totalHeight = 400
    const segmentWidth = (totalWidth - (gridCols + 1) * profileWidth) / gridCols
    const segmentHeight = (totalHeight - (gridRows + 1) * profileWidth) / gridRows
    
    const segments: VitrageSegment[] = []
    
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = (width - totalWidth) / 2 + profileWidth + col * (segmentWidth + profileWidth)
        const y = (height - totalHeight) / 2 + profileWidth + row * (segmentHeight + profileWidth)
        
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
          realWidth: Math.round(segmentWidth * 5), // Default mm conversion (1px = 5mm)
          realHeight: Math.round(segmentHeight * 5),
          merged: false,
          rowSpan: 1,
          colSpan: 1
        })
      }
    }
    
    const newGrid: VitrageGrid = {
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
    
    setVitrageGrid(newGrid)
    setShowGridConfig(false)
    
    // Calculate initial positions and sizes
    setTimeout(() => calculateProportionalSizes(), 50)
  }

  const calculateProportionalSizes = () => {
    if (!vitrageGrid) return

    const activeSegments = vitrageGrid.segments.filter(s => !s.merged)
    if (activeSegments.length === 0) return

    // Calculate scaling factor to fit within window bounds
    const maxTotalWidth = Math.min(width * 0.9, 800)
    const maxTotalHeight = Math.min(height * 0.7, 600)
    
    // Calculate column widths and row heights based on segment real dimensions
    const colWidths: number[] = new Array(vitrageGrid.cols).fill(100) // Default 100mm
    const rowHeights: number[] = new Array(vitrageGrid.rows).fill(100) // Default 100mm

    // Set column widths and row heights from segments with real dimensions
    activeSegments.forEach(segment => {
      if (segment.realWidth && segment.realHeight) {
        const widthPerCol = segment.realWidth / (segment.colSpan || 1)
        const heightPerRow = segment.realHeight / (segment.rowSpan || 1)
        
        // Set width for all columns this segment spans
        for (let c = segment.col; c < segment.col + (segment.colSpan || 1); c++) {
          colWidths[c] = widthPerCol
        }
        
        // Set height for all rows this segment spans
        for (let r = segment.row; r < segment.row + (segment.rowSpan || 1); r++) {
          rowHeights[r] = heightPerRow
        }
      }
    })

    const totalRealWidth = colWidths.reduce((sum, w) => sum + w, 0)
    const totalRealHeight = rowHeights.reduce((sum, h) => sum + h, 0)

    // Calculate available space
    const availableWidth = maxTotalWidth - (vitrageGrid.cols + 1) * vitrageGrid.profileWidth
    const availableHeight = maxTotalHeight - (vitrageGrid.rows + 1) * vitrageGrid.profileWidth

    // Calculate scale to fit within bounds
    const scaleX = availableWidth / totalRealWidth
    const scaleY = availableHeight / totalRealHeight
    const scale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down

    // Calculate grid dimensions
    const gridWidth = totalRealWidth * scale + (vitrageGrid.cols + 1) * vitrageGrid.profileWidth
    const gridHeight = totalRealHeight * scale + (vitrageGrid.rows + 1) * vitrageGrid.profileWidth
    
    const startX = (width - gridWidth) / 2
    const startY = (height - gridHeight) / 2

    // Calculate cumulative positions
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

    // Update all segments with new positions and sizes
    const updatedSegments = vitrageGrid.segments.map(segment => {
      if (segment.merged) return segment

      const x = colPositions[segment.col]
      const y = rowPositions[segment.row]
      
      // Calculate width by spanning across columns
      let segmentWidth = 0
      for (let c = segment.col; c < segment.col + (segment.colSpan || 1); c++) {
        segmentWidth += colWidths[c] * scale
      }
      if ((segment.colSpan || 1) > 1) {
        segmentWidth += ((segment.colSpan || 1) - 1) * vitrageGrid.profileWidth
      }

      // Calculate height by spanning across rows
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

    setVitrageGrid({
      ...vitrageGrid,
      segments: updatedSegments,
      totalWidth: gridWidth,
      totalHeight: gridHeight
    })
  }

  const isProfileNeeded = useCallback((row: number, col: number, direction: 'horizontal' | 'vertical'): boolean => {
    if (!vitrageGrid) return true

    const activeSegments = vitrageGrid.segments.filter(s => !s.merged)
    
    if (direction === 'horizontal') {
      // Check if there's a merged segment spanning across this horizontal line at this column
      return !activeSegments.some(segment => 
        segment.row < row && 
        segment.row + (segment.rowSpan || 1) > row &&
        segment.col <= col && 
        segment.col + (segment.colSpan || 1) > col &&
        (segment.rowSpan || 1) > 1 // Only hide if segment actually spans multiple rows
      )
    } else {
      // Check if there's a merged segment spanning across this vertical line at this row  
      return !activeSegments.some(segment => 
        segment.col < col && 
        segment.col + (segment.colSpan || 1) > col &&
        segment.row <= row && 
        segment.row + (segment.rowSpan || 1) > row &&
        (segment.colSpan || 1) > 1 // Only hide if segment actually spans multiple columns
      )
    }
  }, [vitrageGrid])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (!vitrageGrid) return

    const startX = (width - vitrageGrid.totalWidth) / 2
    const startY = (height - vitrageGrid.totalHeight) / 2

    // Draw outer frame
    ctx.fillStyle = '#808080' // Grey color for profiles
    ctx.fillRect(startX, startY, vitrageGrid.totalWidth, vitrageGrid.profileWidth) // Top
    ctx.fillRect(startX, startY + vitrageGrid.totalHeight - vitrageGrid.profileWidth, vitrageGrid.totalWidth, vitrageGrid.profileWidth) // Bottom
    ctx.fillRect(startX, startY, vitrageGrid.profileWidth, vitrageGrid.totalHeight) // Left
    ctx.fillRect(startX + vitrageGrid.totalWidth - vitrageGrid.profileWidth, startY, vitrageGrid.profileWidth, vitrageGrid.totalHeight) // Right

    // Draw internal profiles based on actual segment positions
    const activeSegments = vitrageGrid.segments.filter(s => !s.merged)
    
    // Draw horizontal profiles between rows
    for (let row = 1; row < vitrageGrid.rows; row++) {
      for (let col = 0; col < vitrageGrid.cols; col++) {
        if (isProfileNeeded(row, col, 'horizontal')) {
          // Find segments above and below this position
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
    
    // Draw vertical profiles between columns  
    for (let col = 1; col < vitrageGrid.cols; col++) {
      for (let row = 0; row < vitrageGrid.rows; row++) {
        if (isProfileNeeded(row, col, 'vertical')) {
          // Find segments left and right of this position
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

    // Draw profile intersections to eliminate white gaps
    // Simply fill all intersection points to ensure no white gaps
    ctx.fillStyle = '#808080' // Ensure profile color is maintained
    
    // Draw intersections at every profile crossing point
    activeSegments.forEach(segment => {
      const actualWidth = segment.width * (segment.colSpan || 1) + (segment.colSpan && segment.colSpan > 1 ? (segment.colSpan - 1) * vitrageGrid.profileWidth : 0)
      const actualHeight = segment.height * (segment.rowSpan || 1) + (segment.rowSpan && segment.rowSpan > 1 ? (segment.rowSpan - 1) * vitrageGrid.profileWidth : 0)
      
      // Top-left corner intersection
      if (segment.row > 0 && segment.col > 0) {
        ctx.fillRect(
          segment.x - vitrageGrid.profileWidth, 
          segment.y - vitrageGrid.profileWidth, 
          vitrageGrid.profileWidth, 
          vitrageGrid.profileWidth
        )
      }
      
      // Top-right corner intersection
      if (segment.row > 0 && segment.col + (segment.colSpan || 1) < vitrageGrid.cols) {
        ctx.fillRect(
          segment.x + actualWidth, 
          segment.y - vitrageGrid.profileWidth, 
          vitrageGrid.profileWidth, 
          vitrageGrid.profileWidth
        )
      }
      
      // Bottom-left corner intersection
      if (segment.row + (segment.rowSpan || 1) < vitrageGrid.rows && segment.col > 0) {
        ctx.fillRect(
          segment.x - vitrageGrid.profileWidth, 
          segment.y + actualHeight, 
          vitrageGrid.profileWidth, 
          vitrageGrid.profileWidth
        )
      }
      
      // Bottom-right corner intersection
      if (segment.row + (segment.rowSpan || 1) < vitrageGrid.rows && segment.col + (segment.colSpan || 1) < vitrageGrid.cols) {
        ctx.fillRect(
          segment.x + actualWidth, 
          segment.y + actualHeight, 
          vitrageGrid.profileWidth, 
          vitrageGrid.profileWidth
        )
      }
    })

    // Draw segments
    vitrageGrid.segments.forEach(segment => {
      if (segment.merged) return // Skip merged segments, they will be drawn as part of the parent segment
      
      let fillStyle = '#f8f9fa' // Default empty
      let strokeStyle = '#dee2e6'
      
      if (segment.type === 'glass') {
        if (segment.isStemalit) {
          // Stemalit glass - darker grey that contrasts with profile color
          fillStyle = segment.selected ? 'rgba(150, 150, 150, 0.4)' : 'rgba(180, 180, 180, 0.3)'
          strokeStyle = segment.selected ? '#4a90e2' : '#999999'
        } else {
          // Regular glass - blue tones
          fillStyle = segment.selected ? 'rgba(74, 144, 226, 0.3)' : 'rgba(135, 206, 235, 0.2)'
          strokeStyle = segment.selected ? '#4a90e2' : '#87ceeb'
        }
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
      
      // Highlight for merge selection
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
      
      // Calculate actual size (including merged segments)
      const actualWidth = segment.width * (segment.colSpan || 1) + (segment.colSpan && segment.colSpan > 1 ? (segment.colSpan - 1) * vitrageGrid.profileWidth : 0)
      const actualHeight = segment.height * (segment.rowSpan || 1) + (segment.rowSpan && segment.rowSpan > 1 ? (segment.rowSpan - 1) * vitrageGrid.profileWidth : 0)
      
      ctx.fillRect(segment.x, segment.y, actualWidth, actualHeight)
      ctx.strokeRect(segment.x, segment.y, actualWidth, actualHeight)

      // Draw content based on type
      const centerX = segment.x + actualWidth / 2
      const centerY = segment.y + actualHeight / 2
      
      // Draw dimensions with enhanced visibility - only for non-merged segments
      if (segment.realWidth && segment.realHeight && !segment.merged) {
        // Width dimension (top)
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
        
        // Height dimension (left, rotated)
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
      
      if (segment.type === 'glass') {
        // Draw glass icon and label
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
      } else if (segment.type === 'ventilation') {
        // Draw ventilation pattern
        ctx.strokeStyle = '#666'
        ctx.lineWidth = 1
        const spacing = 8
        for (let i = segment.x + spacing; i < segment.x + actualWidth; i += spacing) {
          ctx.beginPath()
          ctx.moveTo(i, segment.y + 5)
          ctx.lineTo(i, segment.y + actualHeight - 5)
          ctx.stroke()
        }
        
        // Draw label
        if (segment.label) {
          ctx.fillStyle = '#2c3e50'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(segment.label, centerX, centerY)
        }
      } else if (segment.type === 'sandwich') {
        // Draw sandwich panel pattern (horizontal lines)
        ctx.strokeStyle = '#8b4513'
        ctx.lineWidth = 2
        const lineSpacing = 12
        for (let i = segment.y + lineSpacing; i < segment.y + actualHeight - lineSpacing; i += lineSpacing) {
          ctx.beginPath()
          ctx.moveTo(segment.x + 5, i)
          ctx.lineTo(segment.x + actualWidth - 5, i)
          ctx.stroke()
        }
        
        // Draw label
        if (segment.label) {
          ctx.fillStyle = '#2c3e50'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(segment.label, centerX, centerY)
        }
      } else if (segment.type === 'casement') {
        // Draw casement pattern (cross with handle)
        ctx.strokeStyle = '#228b22'
        ctx.lineWidth = 2
        
        // Draw cross
        ctx.beginPath()
        ctx.moveTo(segment.x + 10, centerY)
        ctx.lineTo(segment.x + actualWidth - 10, centerY)
        ctx.moveTo(centerX, segment.y + 10)
        ctx.lineTo(centerX, segment.y + actualHeight - 10)
        ctx.stroke()
        
        // Draw handle (small circle)
        ctx.beginPath()
        ctx.arc(segment.x + actualWidth * 0.8, centerY, 3, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw label
        if (segment.label) {
          ctx.fillStyle = '#2c3e50'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(segment.label, centerX, centerY + 15)
        }
      } else if (segment.type === 'door') {
        // Draw door pattern (rectangle with arc for opening)
        ctx.strokeStyle = '#800080'
        ctx.lineWidth = 2
        
        // Door frame
        ctx.strokeRect(segment.x + 5, segment.y + 5, actualWidth - 10, actualHeight - 10)
        
        // Door opening arc
        ctx.beginPath()
        ctx.arc(segment.x + actualWidth * 0.2, segment.y + actualHeight - 5, actualWidth * 0.6, 0, -Math.PI / 2, true)
        ctx.stroke()
        
        // Door handle
        ctx.beginPath()
        ctx.arc(segment.x + actualWidth * 0.8, centerY, 3, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw label
        if (segment.label) {
          ctx.fillStyle = '#2c3e50'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(segment.label, centerX, centerY)
        }
      }
    })
  }, [width, height, vitrageGrid, mergeMode, selectedForMerge, isProfileNeeded])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Инициализация имени витража при загрузке
  useEffect(() => {
    const savedVitrages = localStorage.getItem('saved-vitrages')
    let nextNumber = 1
    if (savedVitrages) {
      try {
        const vitrages = JSON.parse(savedVitrages)
        nextNumber = vitrages.length + 1
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error)
      }
    }
    setVitrageName(`В-${String(nextNumber).padStart(2, '0')}`)
  }, [])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const findSegmentAt = (x: number, y: number): VitrageSegment | null => {
    if (!vitrageGrid) return null
    
    for (const segment of vitrageGrid.segments) {
      if (x >= segment.x && x <= segment.x + segment.width && 
          y >= segment.y && y <= segment.y + segment.height) {
        return segment
      }
    }
    
    return null
  }

  const findDimensionAt = (x: number, y: number): { segment: VitrageSegment, type: 'width' | 'height' } | null => {
    if (!vitrageGrid) return null
    
    const activeSegments = vitrageGrid.segments.filter(s => !s.merged && s.realWidth && s.realHeight)
    
    for (const segment of activeSegments) {
      const actualWidth = segment.width * (segment.colSpan || 1) + (segment.colSpan && segment.colSpan > 1 ? (segment.colSpan - 1) * vitrageGrid.profileWidth : 0)
      const actualHeight = segment.height * (segment.rowSpan || 1) + (segment.rowSpan && segment.rowSpan > 1 ? (segment.rowSpan - 1) * vitrageGrid.profileWidth : 0)
      
      const centerX = segment.x + actualWidth / 2
      const centerY = segment.y + actualHeight / 2
      
      // Check width dimension (top of segment) - updated for new box position
      const widthBoxX = centerX
      const widthBoxY = segment.y - 9
      if (Math.abs(x - widthBoxX) < 25 && Math.abs(y - widthBoxY) < 6) {
        return { segment, type: 'width' }
      }
      
      // Check height dimension (left of segment, rotated) - updated for new box position
      const heightBoxX = segment.x - 20
      const heightBoxY = centerY
      if (Math.abs(x - heightBoxX) < 15 && Math.abs(y - heightBoxY) < 15) {
        return { segment, type: 'height' }
      }
    }
    
    return null
  }

  const handleSegmentClick = (segment: VitrageSegment) => {
    // Clear previous selections
    if (vitrageGrid) {
      const updatedSegments = vitrageGrid.segments.map(s => ({
        ...s,
        selected: s.id === segment.id
      }))
      
      setVitrageGrid({
        ...vitrageGrid,
        segments: updatedSegments
      })
      
      setSelectedSegment(segment)
      setShowProperties(true)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    const segment = findSegmentAt(pos.x, pos.y)
    const dimension = findDimensionAt(pos.x, pos.y)
    
    if (mergeMode) {
      if (segment && !segment.merged) {
        handleMergeSelection(segment)
      }
    } else if (dimension) {
      // Start editing dimension
      const actualWidth = dimension.segment.width * (dimension.segment.colSpan || 1) + (dimension.segment.colSpan && dimension.segment.colSpan > 1 ? (dimension.segment.colSpan - 1) * vitrageGrid!.profileWidth : 0)
      const actualHeight = dimension.segment.height * (dimension.segment.rowSpan || 1) + (dimension.segment.rowSpan && dimension.segment.rowSpan > 1 ? (dimension.segment.rowSpan - 1) * vitrageGrid!.profileWidth : 0)
      
      const centerX = dimension.segment.x + actualWidth / 2
      const centerY = dimension.segment.y + actualHeight / 2
      
      setEditingDimension({
        segmentId: dimension.segment.id,
        type: dimension.type,
        x: dimension.type === 'width' ? centerX : dimension.segment.x - 20,
        y: dimension.type === 'width' ? dimension.segment.y - 9 : centerY,
        value: dimension.type === 'width' ? (dimension.segment.realWidth || 0) : (dimension.segment.realHeight || 0)
      })
    } else if (segment) {
      handleSegmentClick(segment)
    } else {
      // Clear selection if clicking outside segments
      if (vitrageGrid) {
        const updatedSegments = vitrageGrid.segments.map(s => ({
          ...s,
          selected: false
        }))
        
        setVitrageGrid({
          ...vitrageGrid,
          segments: updatedSegments
        })
        
        setSelectedSegment(null)
        setShowProperties(false)
      }
    }
  }

  const handleMergeSelection = (segment: VitrageSegment) => {
    const isAlreadySelected = selectedForMerge.some(s => s.id === segment.id)
    
    if (isAlreadySelected) {
      // Remove from selection
      setSelectedForMerge(prev => prev.filter(s => s.id !== segment.id))
    } else {
      // Add to selection
      setSelectedForMerge(prev => [...prev, segment])
    }
  }

  const canMergeSegments = (segments: VitrageSegment[]): boolean => {
    if (segments.length < 2) return false
    
    // Get the bounding box of selected segments
    const minRow = Math.min(...segments.map(s => s.row))
    const maxRow = Math.max(...segments.map(s => s.row))
    const minCol = Math.min(...segments.map(s => s.col))
    const maxCol = Math.max(...segments.map(s => s.col))
    
    // Check if all cells in the rectangle are selected
    const expectedCount = (maxRow - minRow + 1) * (maxCol - minCol + 1)
    if (segments.length !== expectedCount) return false
    
    // Check if all positions in the rectangle are covered by the selected segments
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const hasSegmentAt = segments.some(s => s.row === row && s.col === col)
        if (!hasSegmentAt) return false
      }
    }
    
    return true
  }

  const mergeSegments = () => {
    if (!vitrageGrid || selectedForMerge.length < 2 || !canMergeSegments(selectedForMerge)) {
      return
    }

    // Find the top-left segment (will become the main segment)
    const mainSegment = selectedForMerge.reduce((prev, curr) => {
      if (curr.row < prev.row || (curr.row === prev.row && curr.col < prev.col)) {
        return curr
      }
      return prev
    })

    // Calculate spans
    const minRow = Math.min(...selectedForMerge.map(s => s.row))
    const maxRow = Math.max(...selectedForMerge.map(s => s.row))
    const minCol = Math.min(...selectedForMerge.map(s => s.col))
    const maxCol = Math.max(...selectedForMerge.map(s => s.col))
    
    const rowSpan = maxRow - minRow + 1
    const colSpan = maxCol - minCol + 1

    // Calculate combined real dimensions if segments have them
    let totalRealWidth = 0
    let totalRealHeight = 0
    let hasRealDimensions = false

    // Get real dimensions from individual segments
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const segment = selectedForMerge.find(s => s.row === r && s.col === c)
        if (segment && segment.realWidth && segment.realHeight) {
          if (r === minRow) totalRealWidth += segment.realWidth
          if (c === minCol) totalRealHeight += segment.realHeight
          hasRealDimensions = true
        }
      }
    }

    const updatedSegments = vitrageGrid.segments.map(segment => {
      if (segment.id === mainSegment.id) {
        // Update main segment
        return {
          ...segment,
          rowSpan,
          colSpan,
          realWidth: hasRealDimensions ? totalRealWidth : (segment.realWidth || 0) * colSpan,
          realHeight: hasRealDimensions ? totalRealHeight : (segment.realHeight || 0) * rowSpan,
          mergedWith: selectedForMerge.filter(s => s.id !== mainSegment.id).map(s => s.id)
        }
      } else if (selectedForMerge.some(s => s.id === segment.id)) {
        // Mark other segments as merged
        return {
          ...segment,
          merged: true
        }
      }
      return segment
    })

    setVitrageGrid({
      ...vitrageGrid,
      segments: updatedSegments
    })

    // Clear merge state
    setSelectedForMerge([])
    setMergeMode(false)
    
    // Force recalculation of proportional sizes
    setTimeout(() => {
      calculateProportionalSizes()
      // Force re-render
      const updatedGrid = {
        ...vitrageGrid,
        segments: updatedSegments
      }
      setVitrageGrid({...updatedGrid})
    }, 50)
  }

  const handleDimensionEdit = (newValue: number) => {
    if (!editingDimension || !vitrageGrid) return
    
    const segment = vitrageGrid.segments.find(s => s.id === editingDimension.segmentId)
    if (!segment) return
    
    const property = editingDimension.type === 'width' ? 'realWidth' : 'realHeight'
    
    // Update dimensions synchronously
    updateSegmentProperties(property, newValue)
    setEditingDimension(null)
  }

  const updateSegmentProperties = (property: keyof VitrageSegment, value: string | number | boolean) => {
    if (!vitrageGrid) return
    
    // Find the segment to update (either selected or being edited)
    let targetSegment = selectedSegment
    if (!targetSegment && editingDimension) {
      targetSegment = vitrageGrid.segments.find(s => s.id === editingDimension.segmentId) || null
    }
    
    if (!targetSegment) return
    
    // Special handling for dimension changes - update entire row/column
    if (property === 'realWidth' || property === 'realHeight') {
      const updatedSegments = vitrageGrid.segments.map(segment => {
        if (segment.merged) return segment
        
        if (property === 'realWidth') {
          // Update all segments that share any column with the target segment
          const targetCols = []
          for (let c = targetSegment.col; c < targetSegment.col + (targetSegment.colSpan || 1); c++) {
            targetCols.push(c)
          }
          
          // Check if this segment overlaps with any of the target columns
          const segmentCols = []
          for (let c = segment.col; c < segment.col + (segment.colSpan || 1); c++) {
            segmentCols.push(c)
          }
          
          const hasOverlap = targetCols.some(col => segmentCols.includes(col))
          if (hasOverlap) {
            return { ...segment, realWidth: value as number }
          }
        }
        
        if (property === 'realHeight') {
          // Update all segments that share any row with the target segment
          const targetRows = []
          for (let r = targetSegment.row; r < targetSegment.row + (targetSegment.rowSpan || 1); r++) {
            targetRows.push(r)
          }
          
          // Check if this segment overlaps with any of the target rows
          const segmentRows = []
          for (let r = segment.row; r < segment.row + (segment.rowSpan || 1); r++) {
            segmentRows.push(r)
          }
          
          const hasOverlap = targetRows.some(row => segmentRows.includes(row))
          if (hasOverlap) {
            return { ...segment, realHeight: value as number }
          }
        }
        
        return segment
      })
      
      setVitrageGrid({
        ...vitrageGrid,
        segments: updatedSegments
      })
      
      // Update selected segment if it exists
      if (selectedSegment) {
        const newSelectedSegment = updatedSegments.find(s => s.id === selectedSegment.id)
        if (newSelectedSegment) {
          setSelectedSegment(newSelectedSegment)
        }
      }
      
      // Immediately recalculate visual dimensions
      setTimeout(() => {
        calculateProportionalSizes()
      }, 10)
    } else {
      // Normal property update
      const updatedSegment = { ...targetSegment, [property]: value }
      const updatedSegments = vitrageGrid.segments.map(s => 
        s.id === targetSegment.id ? updatedSegment : s
      )
      
      setVitrageGrid({
        ...vitrageGrid,
        segments: updatedSegments
      })
      
      if (selectedSegment && selectedSegment.id === targetSegment.id) {
        setSelectedSegment(updatedSegment)
      }
    }
  }

  const saveVitrage = () => {
    if (!vitrageGrid) return
    
    try {
      const existingVitrages = localStorage.getItem('saved-vitrages')
      let vitrages: VitrageGrid[] = []
      
      if (existingVitrages) {
        vitrages = JSON.parse(existingVitrages)
      }
      
      // Проверяем, существует ли уже витраж с таким ID
      const existingIndex = vitrages.findIndex(v => v.id === vitrageGrid.id)
      
      if (existingIndex >= 0) {
        // Обновляем существующий витраж
        vitrages[existingIndex] = vitrageGrid
        alert(`Витраж "${vitrageGrid.name}" обновлен в спецификации!`)
      } else {
        // Добавляем новый витраж
        vitrages.push(vitrageGrid)
        alert(`Витраж "${vitrageGrid.name}" сохранен в спецификации!`)
      }
      
      localStorage.setItem('saved-vitrages', JSON.stringify(vitrages))
    } catch (error) {
      console.error('Ошибка при сохранении витража:', error)
      alert('Ошибка при сохранении витража')
    }
  }

  const clearCanvas = () => {
    setVitrageGrid(null)
    setSelectedSegment(null)
    setShowProperties(false)
    setShowGridConfig(true)
    // Генерируем новое имя витража
    const savedVitrages = localStorage.getItem('saved-vitrages')
    let nextNumber = 1
    if (savedVitrages) {
      try {
        const vitrages = JSON.parse(savedVitrages)
        nextNumber = vitrages.length + 1
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error)
      }
    }
    setVitrageName(`В-${String(nextNumber).padStart(2, '0')}`)
  }

  return (
    <div className="graphics-editor">
      {showGridConfig && (
        <div className="grid-config-panel">
          <h3>Конфигурация витража</h3>
          
          <div className="config-group">
            <div className="config-item">
              <label>Маркировка витража:</label>
              <input
                type="text"
                value={vitrageName}
                onChange={(e) => setVitrageName(e.target.value)}
                placeholder="Например: В-01, ВТ-003"
              />
            </div>
            
            <div className="config-item">
              <label>Количество сегментов по горизонтали:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={gridCols}
                onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="config-item">
              <label>Количество сегментов по вертикали:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={gridRows}
                onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <button 
              className="create-grid-btn"
              onClick={createVitrageGrid}
            >
              Создать витраж
            </button>
          </div>
        </div>
      )}

      {!showGridConfig && (
        <>
          <div className="editor-toolbar">
            <div className="tool-group">
              <button onClick={clearCanvas} title="Новый витраж">
                🗑️ Новый витраж
              </button>
              <button onClick={saveVitrage} title="Сохранить витраж в спецификацию">
                💾 Сохранить витраж
              </button>
              <button 
                className={mergeMode ? 'active' : ''}
                onClick={() => {
                  setMergeMode(!mergeMode)
                  setSelectedForMerge([])
                  if (!mergeMode) {
                    setShowProperties(false)
                    setSelectedSegment(null)
                  }
                }}
                title="Объединить сегменты"
              >
                🔗 Объединить
              </button>
              {mergeMode && selectedForMerge.length >= 2 && canMergeSegments(selectedForMerge) && (
                <button 
                  onClick={mergeSegments}
                  className="merge-confirm-btn"
                  title="Подтвердить объединение"
                >
                  ✓ Объединить {selectedForMerge.length} сегментов
                </button>
              )}
            </div>
          </div>

          <div className="editor-workspace">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={handleMouseDown}
              className="drawing-canvas"
            />

            {/* Interactive dimension editing input */}
            {editingDimension && (
              <input
                type="number"
                value={editingDimension.value}
                onChange={(e) => setEditingDimension({
                  ...editingDimension,
                  value: parseInt(e.target.value) || 0
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDimensionEdit(editingDimension.value)
                  } else if (e.key === 'Escape') {
                    setEditingDimension(null)
                  }
                }}
                onBlur={() => handleDimensionEdit(editingDimension.value)}
                autoFocus
                style={{
                  position: 'absolute',
                  left: editingDimension.x - 25,
                  top: editingDimension.y - 10,
                  width: '50px',
                  height: '20px',
                  fontSize: '10px',
                  textAlign: 'center',
                  border: '1px solid #4a90e2',
                  borderRadius: '2px',
                  background: 'white',
                  zIndex: 1001
                }}
              />
            )}

            {showProperties && selectedSegment && !mergeMode && (
              <div className="properties-panel">
                <h3>Свойства сегмента</h3>
                
                <div className="property-group">
                  <label>Тип сегмента:</label>
                  <select
                    value={selectedSegment.type}
                    onChange={(e) => updateSegmentProperties('type', e.target.value as 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door')}
                  >
                    <option value="empty">Пустой</option>
                    <option value="glass">Стеклопакет</option>
                    <option value="ventilation">Вентрешетка</option>
                    <option value="sandwich">Сэндвич-панель</option>
                    <option value="casement">Створка</option>
                    <option value="door">Дверной блок</option>
                  </select>
                </div>
                
                <div className="property-group">
                  <label>Ширина (мм):</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedSegment.realWidth || 0}
                    onChange={(e) => updateSegmentProperties('realWidth', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="property-group">
                  <label>Высота (мм):</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedSegment.realHeight || 0}
                    onChange={(e) => updateSegmentProperties('realHeight', parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="property-group">
                  <label>Обозначение:</label>
                  <input
                    type="text"
                    value={selectedSegment.label || ''}
                    onChange={(e) => updateSegmentProperties('label', e.target.value)}
                    placeholder="Например: G1, V1"
                  />
                </div>
                
                {selectedSegment.type === 'glass' && (
                  <div className="property-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedSegment.isStemalit || false}
                        onChange={(e) => updateSegmentProperties('isStemalit', e.target.checked)}
                      />
                      Стемалит
                    </label>
                  </div>
                )}
                
                {selectedSegment.type !== 'ventilation' && (
                  <div className="property-group">
                    <label>Формула:</label>
                    <input
                      type="text"
                      value={selectedSegment.formula || ''}
                      onChange={(e) => updateSegmentProperties('formula', e.target.value)}
                      placeholder={selectedSegment.type === 'glass' ? "Например: 4М1-16-4М1" : "Формула элемента"}
                    />
                  </div>
                )}
                
                <button 
                  className="close-properties"
                  onClick={() => setShowProperties(false)}
                >
                  Закрыть
                </button>
              </div>
            )}
            
            {mergeMode && (
              <div className="merge-info-panel">
                <h3>Режим объединения</h3>
                <p>Выберите 2 или более соседних сегмента для объединения</p>
                <p>Выбрано сегментов: {selectedForMerge.length}</p>
                {selectedForMerge.length >= 2 && !canMergeSegments(selectedForMerge) && (
                  <p className="error">Сегменты должны быть соседними</p>
                )}
              </div>
            )}
          </div>

          <div className="editor-info">
            <div className="stats">
              {vitrageGrid && (
                <>
                  <strong>{vitrageGrid.name}</strong> | 
                  Сетка: {vitrageGrid.rows} × {vitrageGrid.cols} | 
                  Стеклопакетов: {vitrageGrid.segments.filter(s => s.type === 'glass').length} | 
                  Вентрешеток: {vitrageGrid.segments.filter(s => s.type === 'ventilation').length} |
                  Сэндвич-панелей: {vitrageGrid.segments.filter(s => s.type === 'sandwich').length} |
                  Створок: {vitrageGrid.segments.filter(s => s.type === 'casement').length} |
                  Дверных блоков: {vitrageGrid.segments.filter(s => s.type === 'door').length}
                </>
              )}
            </div>
            <div className="instructions">
              Кликните на сегмент для настройки параметров или на размеры для быстрого редактирования
            </div>
          </div>
        </>
      )}
    </div>
  )
}