import { useState, useRef, useCallback, useEffect } from 'react'
import type { VitrageGrid, VitrageSegment, EditingDimension, CanvasDimensions } from '../types'
import { createVitrageGrid, calculateProportionalSizes, generateNextVitrageName } from '../utils'

export function useGraphicsEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({ width: 800, height: 600 })

  const [showGridConfig, setShowGridConfig] = useState(true)
  const [gridRows, setGridRows] = useState(3)
  const [gridCols, setGridCols] = useState(4)
  const [vitrageName, setVitrageName] = useState('В-01')
  const [vitrageGrid, setVitrageGrid] = useState<VitrageGrid | null>(null)

  const [selectedSegment, setSelectedSegment] = useState<VitrageSegment | null>(null)
  const [showProperties, setShowProperties] = useState(false)

  const [mergeMode, setMergeMode] = useState(false)
  const [selectedForMerge, setSelectedForMerge] = useState<VitrageSegment[]>([])

  const [editingDimension, setEditingDimension] = useState<EditingDimension | null>(null)

  const createGrid = useCallback(() => {
    const grid = createVitrageGrid(gridRows, gridCols, vitrageName, canvasDimensions)
    setVitrageGrid(grid)
    setShowGridConfig(false)

    setTimeout(() => {
      if (grid) {
        const updated = calculateProportionalSizes(grid, canvasDimensions)
        setVitrageGrid(updated)
      }
    }, 50)
  }, [gridRows, gridCols, vitrageName, canvasDimensions])

  const handleSegmentClick = useCallback((segment: VitrageSegment) => {
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
  }, [vitrageGrid])

  const updateSegmentProperties = useCallback((property: string, value: any) => {
    if (!vitrageGrid) return

    let targetSegment = selectedSegment
    if (!targetSegment && editingDimension) {
      targetSegment = vitrageGrid.segments.find(s => s.id === editingDimension.segmentId) || null
    }

    if (!targetSegment) return

    if (property === 'realWidth' || property === 'realHeight') {
      const updatedSegments = vitrageGrid.segments.map(segment => {
        if (segment.merged) return segment

        if (property === 'realWidth') {
          const targetCols = []
          for (let c = targetSegment!.col; c < targetSegment!.col + (targetSegment!.colSpan || 1); c++) {
            targetCols.push(c)
          }

          const segmentCols = []
          for (let c = segment.col; c < segment.col + (segment.colSpan || 1); c++) {
            segmentCols.push(c)
          }

          const hasOverlap = targetCols.some(col => segmentCols.includes(col))
          if (hasOverlap) {
            return { ...segment, realWidth: value }
          }
        }

        if (property === 'realHeight') {
          const targetRows = []
          for (let r = targetSegment!.row; r < targetSegment!.row + (targetSegment!.rowSpan || 1); r++) {
            targetRows.push(r)
          }

          const segmentRows = []
          for (let r = segment.row; r < segment.row + (segment.rowSpan || 1); r++) {
            segmentRows.push(r)
          }

          const hasOverlap = targetRows.some(row => segmentRows.includes(row))
          if (hasOverlap) {
            return { ...segment, realHeight: value }
          }
        }

        return segment
      })

      setVitrageGrid({
        ...vitrageGrid,
        segments: updatedSegments
      })

      if (selectedSegment) {
        const newSelectedSegment = updatedSegments.find(s => s.id === selectedSegment.id)
        if (newSelectedSegment) {
          setSelectedSegment(newSelectedSegment)
        }
      }

      setTimeout(() => {
        const updated = calculateProportionalSizes(vitrageGrid, canvasDimensions)
        setVitrageGrid(updated)
      }, 10)
    } else {
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
  }, [vitrageGrid, selectedSegment, editingDimension, canvasDimensions])

  const clearCanvas = useCallback(() => {
    setVitrageGrid(null)
    setSelectedSegment(null)
    setShowProperties(false)
    setShowGridConfig(true)

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

  // Инициализация имени витража
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

  return {
    canvasRef,
    containerRef,
    canvasDimensions,
    setCanvasDimensions,
    showGridConfig,
    setShowGridConfig,
    gridRows,
    setGridRows,
    gridCols,
    setGridCols,
    vitrageName,
    setVitrageName,
    vitrageGrid,
    setVitrageGrid,
    selectedSegment,
    setSelectedSegment,
    showProperties,
    setShowProperties,
    mergeMode,
    setMergeMode,
    selectedForMerge,
    setSelectedForMerge,
    editingDimension,
    setEditingDimension,
    createGrid,
    handleSegmentClick,
    updateSegmentProperties,
    clearCanvas
  }
}
