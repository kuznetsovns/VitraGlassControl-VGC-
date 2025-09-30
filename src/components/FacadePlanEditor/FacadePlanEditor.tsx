import { useState, useRef, useEffect, useCallback } from 'react'
import './FacadePlanEditor.css'

// Re-define VitrageGrid interface locally since it's not exported from GraphicsEditor
interface VitrageGrid {
  id: string
  name: string
  rows: number
  cols: number
  segments: unknown[] // Simplified for facade plan usage
  totalWidth: number
  totalHeight: number
  profileWidth: number
  createdAt: Date
}

export interface Wall {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
  type: 'exterior' | 'interior' | 'load-bearing'
}

export interface Room {
  id: string
  name: string
  walls: string[] // Wall IDs that form this room
  area?: number
}

export interface PlacedVitrage {
  id: string
  vitrageId: string // Reference to VitrageGrid
  x: number
  y: number
  rotation: number // 0, 90, 180, 270 degrees
  wallId?: string // Wall this vitrage is attached to
  scale: number
}

export interface FacadePlan {
  id: string
  name: string
  corpus: string
  section: string
  floor: number
  walls: Wall[]
  rooms: Room[]
  placedVitrages: PlacedVitrage[]
  scale: number // mm per pixel
  backgroundImage?: string // Base64 image data
  backgroundOpacity?: number
  createdAt: Date
  updatedAt: Date
  // Legacy field for backward compatibility
  buildingName?: string
}

interface FacadePlanEditorProps {
  width?: number
  height?: number
}

export default function FacadePlanEditor({ width, height }: FacadePlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: width || 1200, height: height || 800 })

  // Editor state
  const [currentPlan, setCurrentPlan] = useState<FacadePlan | null>(null)
  const [savedPlans, setSavedPlans] = useState<FacadePlan[]>([])
  const [savedVitrages, setSavedVitrages] = useState<VitrageGrid[]>([])

  // Drawing state
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null)

  // UI state
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false)
  const [showVitrageSelector, setShowVitrageSelector] = useState(false)
  const [showPlanSelector, setShowPlanSelector] = useState(false)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3)
  const [selectedVitrageForPlacement, setSelectedVitrageForPlacement] = useState<VitrageGrid | null>(null)
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null)

  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({x: 0, y: 0})
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{x: number, y: number} | null>(null)

  // Background image cache
  const [backgroundImageCache, setBackgroundImageCache] = useState<{[key: string]: HTMLImageElement}>({})
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    corpus: '',
    section: '',
    floor: 1
  })

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    corpus: '',
    section: '',
    floor: ''
  })

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to load vitrages from specification storage
  const loadVitragesFromStorage = useCallback(() => {
    const vitrages = localStorage.getItem('saved-vitrages')
    if (vitrages) {
      try {
        const parsed = JSON.parse(vitrages) as VitrageGrid[]
        setSavedVitrages(parsed.map((v) => ({
          ...v,
          createdAt: new Date(v.createdAt)
        })))
      } catch (error) {
        console.error('Error loading vitrages:', error)
      }
    }
  }, [])

  // Load saved data on mount
  useEffect(() => {
    const plans = localStorage.getItem('facadePlans')
    if (plans) {
      setSavedPlans(JSON.parse(plans))
    }

    // Load vitrages from VitrageSpecification storage
    loadVitragesFromStorage()
  }, [loadVitragesFromStorage])

  // Auto-resize canvas to fit container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && !width && !height) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasDimensions({
          width: Math.floor(rect.width - 40), // Account for padding
          height: Math.floor(rect.height - 40)
        })
      }
    }

    // Use setTimeout to ensure DOM has updated after sidebar changes
    const timeoutId = setTimeout(updateCanvasSize, 100)

    const handleResize = () => {
      setTimeout(updateCanvasSize, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [width, height])

  // Reload vitrages when selector opens
  useEffect(() => {
    if (showVitrageSelector) {
      loadVitragesFromStorage()
    }
  }, [showVitrageSelector, loadVitragesFromStorage])

  // Load and cache background image
  useEffect(() => {
    if (currentPlan?.backgroundImage && !backgroundImageCache[currentPlan.backgroundImage]) {
      const img = new Image()
      img.onload = () => {
        setBackgroundImageCache(prev => ({
          ...prev,
          [currentPlan.backgroundImage!]: img
        }))
      }
      img.src = currentPlan.backgroundImage
    }
  }, [currentPlan?.backgroundImage, backgroundImageCache])

  // Save plans to localStorage
  const savePlansToStorage = useCallback((plans: FacadePlan[]) => {
    localStorage.setItem('facadePlans', JSON.stringify(plans))
    setSavedPlans(plans)
  }, [])

  // Create new facade plan
  const createNewPlan = () => {
    const newPlan: FacadePlan = {
      id: Date.now().toString(),
      name: newPlanData.name,
      corpus: newPlanData.corpus,
      section: newPlanData.section,
      floor: newPlanData.floor,
      walls: [],
      rooms: [],
      placedVitrages: [],
      scale: 10, // 10mm per pixel
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setCurrentPlan(newPlan)
    setShowNewPlanDialog(false)
    setNewPlanData({ name: '', corpus: '', section: '', floor: 1 })
  }

  // Save current plan
  const saveCurrentPlan = () => {
    if (!currentPlan) return

    const updatedPlan = { ...currentPlan, updatedAt: new Date() }
    const existingIndex = savedPlans.findIndex(p => p.id === updatedPlan.id)

    let newPlans
    if (existingIndex >= 0) {
      newPlans = [...savedPlans]
      newPlans[existingIndex] = updatedPlan
    } else {
      newPlans = [...savedPlans, updatedPlan]
    }

    savePlansToStorage(newPlans)
    setCurrentPlan(updatedPlan)
  }

  // Load plan
  const loadPlan = (plan: FacadePlan) => {
    setCurrentPlan(plan)
  }

  // Get unique values for dropdowns
  const uniqueCorpuses = [...new Set(savedPlans.map(plan => plan.corpus || plan.buildingName).filter(Boolean))].sort()
  const uniqueSections = [...new Set(savedPlans.map(plan => plan.section).filter(Boolean))].sort()
  const uniqueFloors = [...new Set(savedPlans.map(plan => plan.floor))].sort((a, b) => a - b)

  // Filter plans based on current filters
  const filteredPlans = savedPlans.filter(plan => {
    return (
      (filters.corpus === '' || (plan.corpus || plan.buildingName || '').toLowerCase() === filters.corpus.toLowerCase()) &&
      (filters.section === '' || plan.section.toLowerCase() === filters.section.toLowerCase()) &&
      (filters.floor === '' || plan.floor.toString() === filters.floor)
    )
  })

  // Get mouse position relative to canvas (accounting for zoom and pan)
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const rawX = e.clientX - rect.left
    const rawY = e.clientY - rect.top

    // Transform coordinates based on zoom and pan
    return {
      x: (rawX - panOffset.x) / zoomLevel,
      y: (rawY - panOffset.y) / zoomLevel
    }
  }

  // Reset zoom function
  const resetZoom = () => {
    setZoomLevel(1)
    setPanOffset({x: 0, y: 0})
  }

  // Handle wheel zoom (only with Shift key) - React event version
  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom when Shift is pressed
    if (!e.shiftKey) return

    // Don't prevent default - just handle our zoom logic
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor))

    // Calculate the point in world coordinates before zoom
    const worldX = (mouseX - panOffset.x) / zoomLevel
    const worldY = (mouseY - panOffset.y) / zoomLevel

    // Calculate new pan offset to keep the same world point under the mouse
    const newPanX = mouseX - worldX * newZoom
    const newPanY = mouseY - worldY * newZoom

    setZoomLevel(newZoom)
    setPanOffset({x: newPanX, y: newPanY})
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentPlan) return

    const pos = getMousePos(e)
    const rect = e.currentTarget.getBoundingClientRect()
    const rawPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    // Handle middle mouse button for panning
    if (e.button === 1) {
      setIsPanning(true)
      setPanStart(rawPos)
      return
    }

    // Only handle left mouse button
    if (e.button !== 0) return

    if (selectedVitrageForPlacement) {
      // Place vitrage at clicked position
      placeVitrageAtPosition(pos.x, pos.y)
    } else {
      // Auto-select vitrage on left click (regardless of current tool)
      const clickedVitrage = currentPlan.placedVitrages.find(v => {
        const vitrage = savedVitrages.find(sv => sv.id === v.vitrageId)
        if (!vitrage) return false

        const vitrageWidth = vitrage.totalWidth * 0.1 * v.scale
        const vitrageHeight = vitrage.totalHeight * 0.1 * v.scale

        return pos.x >= v.x && pos.x <= v.x + vitrageWidth &&
               pos.y >= v.y && pos.y <= v.y + vitrageHeight
      })

      if (clickedVitrage) {
        setSelectedItem(clickedVitrage.id)
        setDragOffset({
          x: pos.x - clickedVitrage.x,
          y: pos.y - clickedVitrage.y
        })
      } else {
        setSelectedItem(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentPlan) return

    const rect = e.currentTarget.getBoundingClientRect()
    const rawPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    // Handle panning
    if (isPanning && panStart) {
      const deltaX = rawPos.x - panStart.x
      const deltaY = rawPos.y - panStart.y

      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))

      setPanStart(rawPos)
      return
    }

    const pos = getMousePos(e)

    // Track mouse position for vitrage preview
    if (selectedVitrageForPlacement) {
      setMousePosition(pos)
    }

    if (selectedItem && dragOffset) {
      // Auto-move selected vitrage when dragging
      const updatedVitrages = currentPlan.placedVitrages.map(v =>
        v.id === selectedItem ? {
          ...v,
          x: pos.x - dragOffset.x,
          y: pos.y - dragOffset.y
        } : v
      )

      setCurrentPlan({
        ...currentPlan,
        placedVitrages: updatedVitrages
      })
    }
  }

  const handleMouseUp = () => {
    if (!currentPlan) return

    // Cleanup on mouse up
    setDragOffset(null)
    setIsPanning(false)
    setPanStart(null)
  }

  // Place vitrage from selector
  const selectVitrageForPlacement = (vitrageGrid: VitrageGrid) => {
    setSelectedVitrageForPlacement(vitrageGrid)
    setShowVitrageSelector(false)
  }

  const placeVitrageAtPosition = (x: number, y: number) => {
    if (!currentPlan || !selectedVitrageForPlacement) return

    const newPlacedVitrage: PlacedVitrage = {
      id: Date.now().toString(),
      vitrageId: selectedVitrageForPlacement.id,
      x: x,
      y: y,
      rotation: 0,
      scale: 0.5 // Scale down for facade plan view
    }

    setCurrentPlan({
      ...currentPlan,
      placedVitrages: [...currentPlan.placedVitrages, newPlacedVitrage]
    })

    // Reset selection but keep tool active for placing more
    setSelectedVitrageForPlacement(null)
    setMousePosition(null)
  }

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !currentPlan) return

    const { width: canvasWidth, height: canvasHeight } = canvasDimensions

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    drawForeground()

    function drawForeground() {
      // No grid - clean white background
      if (!ctx) return

      // Apply zoom and pan transformations
      ctx.save()
      ctx.translate(panOffset.x, panOffset.y)
      ctx.scale(zoomLevel, zoomLevel)

      // Draw background image if exists and cached
      if (currentPlan?.backgroundImage && backgroundImageCache[currentPlan.backgroundImage]) {
        const img = backgroundImageCache[currentPlan.backgroundImage]
        ctx.save()
        ctx.globalAlpha = currentPlan?.backgroundOpacity || backgroundOpacity

        // Calculate world space dimensions
        const worldWidth = canvasDimensions.width / zoomLevel
        const worldHeight = canvasDimensions.height / zoomLevel
        const worldX = -panOffset.x / zoomLevel
        const worldY = -panOffset.y / zoomLevel

        // Calculate scaling to fit image properly
        const imgAspectRatio = img.width / img.height
        const worldAspectRatio = worldWidth / worldHeight

        let drawWidth, drawHeight, offsetX, offsetY

        if (imgAspectRatio > worldAspectRatio) {
          // Image is wider - fit width
          drawWidth = worldWidth
          drawHeight = worldWidth / imgAspectRatio
          offsetX = worldX
          offsetY = worldY + (worldHeight - drawHeight) / 2
        } else {
          // Image is taller - fit height
          drawHeight = worldHeight
          drawWidth = worldHeight * imgAspectRatio
          offsetX = worldX + (worldWidth - drawWidth) / 2
          offsetY = worldY
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        ctx.restore()
      }

    // Draw placed vitrages
    currentPlan?.placedVitrages.forEach(placedVitrage => {
      const vitrage = savedVitrages.find(v => v.id === placedVitrage.vitrageId)
      if (!vitrage) return

      ctx.save()
      ctx.translate(placedVitrage.x, placedVitrage.y)
      ctx.rotate((placedVitrage.rotation * Math.PI) / 180)
      ctx.scale(placedVitrage.scale, placedVitrage.scale)

      const displayWidth = vitrage.totalWidth * 0.1
      const displayHeight = vitrage.totalHeight * 0.1

      // Draw vitrage background
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      // Draw vitrage border
      ctx.strokeStyle = selectedItem === placedVitrage.id ? '#4CAF50' : '#2196F3'
      ctx.lineWidth = selectedItem === placedVitrage.id ? 3 : 2
      ctx.strokeRect(0, 0, displayWidth, displayHeight)

      // Draw grid lines to represent segments
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1
      const segmentWidth = displayWidth / vitrage.cols
      const segmentHeight = displayHeight / vitrage.rows

      // Vertical lines
      for (let col = 1; col < vitrage.cols; col++) {
        ctx.beginPath()
        ctx.moveTo(col * segmentWidth, 0)
        ctx.lineTo(col * segmentWidth, displayHeight)
        ctx.stroke()
      }

      // Horizontal lines
      for (let row = 1; row < vitrage.rows; row++) {
        ctx.beginPath()
        ctx.moveTo(0, row * segmentHeight)
        ctx.lineTo(displayWidth, row * segmentHeight)
        ctx.stroke()
      }

      // Draw vitrage name
      ctx.fillStyle = '#333'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        vitrage.name,
        displayWidth / 2,
        displayHeight / 2
      )

      // Draw dimensions
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        `${vitrage.totalWidth}×${vitrage.totalHeight}mm`,
        displayWidth / 2,
        displayHeight + 15
      )

      ctx.restore()
    })

    // Draw vitrage preview when placing
    if (selectedVitrageForPlacement && mousePosition) {
      const vitrage = selectedVitrageForPlacement

      ctx.save()
      ctx.translate(mousePosition.x, mousePosition.y)
      ctx.scale(0.5, 0.5) // Same scale as placed vitrages

      const displayWidth = vitrage.totalWidth * 0.1
      const displayHeight = vitrage.totalHeight * 0.1

      // Draw preview with transparency
      ctx.globalAlpha = 0.6

      // Draw vitrage background
      ctx.fillStyle = '#e3f2fd'
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      // Draw vitrage border
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5]) // Dashed border for preview
      ctx.strokeRect(0, 0, displayWidth, displayHeight)

      // Draw grid lines
      ctx.strokeStyle = '#bbb'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      const segmentWidth = displayWidth / vitrage.cols
      const segmentHeight = displayHeight / vitrage.rows

      // Vertical lines
      for (let col = 1; col < vitrage.cols; col++) {
        ctx.beginPath()
        ctx.moveTo(col * segmentWidth, 0)
        ctx.lineTo(col * segmentWidth, displayHeight)
        ctx.stroke()
      }

      // Horizontal lines
      for (let row = 1; row < vitrage.rows; row++) {
        ctx.beginPath()
        ctx.moveTo(0, row * segmentHeight)
        ctx.lineTo(displayWidth, row * segmentHeight)
        ctx.stroke()
      }

      // Draw vitrage name
      ctx.globalAlpha = 0.8
      ctx.fillStyle = '#1976d2'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.setLineDash([]) // Solid text
      ctx.fillText(
        vitrage.name,
        displayWidth / 2,
        displayHeight / 2
      )

      // Draw "click to place" hint
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.fillText(
        'Нажмите для размещения',
        displayWidth / 2,
        displayHeight + 15
      )

      ctx.restore()
    }

    // Restore zoom and pan transformations
    ctx.restore()
    }
  }, [currentPlan, savedVitrages, selectedItem, canvasDimensions, backgroundOpacity, selectedVitrageForPlacement, mousePosition, zoomLevel, panOffset, backgroundImageCache])

  // Redraw on state changes
  useEffect(() => {
    draw()
  }, [draw])

  // Auto-scroll to vitrage info when selected
  useEffect(() => {
    if (selectedItem) {
      // Find vitrage info section by text content
      const h3Elements = document.querySelectorAll('.sidebar-section h3')
      let vitrageInfoSection = null

      h3Elements.forEach(h3 => {
        if (h3.textContent === 'Информация о витраже') {
          vitrageInfoSection = h3.parentElement
        }
      })

      if (vitrageInfoSection) {
        vitrageInfoSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedItem])

  // Handle keyboard events for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedItem && currentPlan) {
        // Delete selected vitrage
        const updatedVitrages = currentPlan.placedVitrages.filter(v => v.id !== selectedItem)
        setCurrentPlan({
          ...currentPlan,
          placedVitrages: updatedVitrages
        })
        setSelectedItem(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, currentPlan])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentPlan) return

    if (file.type === 'application/pdf' || file.type.includes('image')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setCurrentPlan({
          ...currentPlan,
          backgroundImage: result,
          backgroundOpacity: backgroundOpacity
        })
      }

      if (file.type === 'application/pdf') {
        // For PDF files, we'll convert first page to image
        // Note: In production, you'd want to use a library like pdf.js
        alert('PDF файлы будут поддержаны в следующей версии. Пожалуйста, используйте изображения (PNG, JPG).')
        return
      } else {
        reader.readAsDataURL(file)
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove background
  const removeBackground = () => {
    if (!currentPlan) return
    setCurrentPlan({
      ...currentPlan,
      backgroundImage: undefined,
      backgroundOpacity: undefined
    })
  }

  // Update background opacity
  const updateBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity)
    if (currentPlan && currentPlan.backgroundImage) {
      setCurrentPlan({
        ...currentPlan,
        backgroundOpacity: opacity
      })
    }
  }

  return (
    <div className="facade-plan-editor">
      <div className="editor-toolbar compact-toolbar">
        {/* Plan Actions Dropdown */}
        <div className="dropdown-container">
          <select
            className="dropdown-select plan-actions"
            onChange={(e) => {
              const action = e.target.value
              if (action === 'open') setShowPlanSelector(true)
              else if (action === 'new') setShowNewPlanDialog(true)
              else if (action === 'save' && currentPlan) saveCurrentPlan()
              e.target.value = '' // Reset selection
            }}
            value=""
          >
            <option value="" disabled>📋 Фасад</option>
            <option value="open">📂 Открыть фасад</option>
            <option value="new">📋 Новый фасад</option>
            {currentPlan && <option value="save">💾 Сохранить</option>}
          </select>
        </div>

        {/* Filters */}
        <div className="compact-filters">
          <select
            value={filters.corpus}
            onChange={(e) => setFilters({...filters, corpus: e.target.value})}
            className="toolbar-filter-select"
          >
            <option value="">Все корпуса</option>
            {uniqueCorpuses.map(corpus => (
              <option key={corpus} value={corpus}>{corpus}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={(e) => setFilters({...filters, section: e.target.value})}
            className="toolbar-filter-select"
          >
            <option value="">Все секции</option>
            {uniqueSections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          <select
            value={filters.floor}
            onChange={(e) => setFilters({...filters, floor: e.target.value})}
            className="toolbar-filter-select"
          >
            <option value="">Все этажи</option>
            {uniqueFloors.map(floor => (
              <option key={floor} value={floor.toString()}>{floor} эт.</option>
            ))}
          </select>
          {(filters.corpus || filters.section || filters.floor) && (
            <button
              className="clear-filters-toolbar-btn"
              onClick={() => setFilters({name: '', corpus: '', section: '', floor: ''})}
              title="Очистить фильтры"
            >
              ✕
            </button>
          )}
        </div>

        {currentPlan && (
          <>
            {/* Import Actions Dropdown */}
            <div className="dropdown-container">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <select
                className="dropdown-select import-actions"
                onChange={(e) => {
                  const action = e.target.value
                  if (action === 'import') fileInputRef.current?.click()
                  else if (action === 'delete') removeBackground()
                  e.target.value = '' // Reset selection
                }}
                value=""
              >
                <option value="" disabled>📄 Подложка</option>
                <option value="import">📄 Импорт фасада</option>
                {currentPlan.backgroundImage && <option value="delete">❌ Удалить подложку фасада</option>}
              </select>
            </div>

            {/* Transparency Slider */}
            {currentPlan.backgroundImage && (
              <div className="transparency-container">
                <span className="transparency-label">Прозрачность:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentPlan.backgroundOpacity || backgroundOpacity}
                  onChange={(e) => updateBackgroundOpacity(parseFloat(e.target.value))}
                  className="transparency-slider"
                />
                <span className="transparency-value">
                  {Math.round((currentPlan.backgroundOpacity || backgroundOpacity) * 100)}%
                </span>
              </div>
            )}

            {/* Add Vitrage Button */}
            <button
              className="toolbar-btn primary"
              onClick={() => setShowVitrageSelector(true)}
              title="Добавить витраж на фасад"
            >
              🪟 Добавить витраж
            </button>
          </>
        )}
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3>Сохраненные фасады</h3>

            <div className="plans-list">
              {filteredPlans.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-item ${currentPlan?.id === plan.id ? 'active' : ''}`}
                  onClick={() => loadPlan(plan)}
                >
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-details">
                    {plan.corpus || plan.buildingName || 'Корпус не указан'} / {plan.section || 'Секция не указана'} - Этаж {plan.floor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentPlan && (
            <>
              <div className="sidebar-section">
                <h3>Свойства фасада</h3>
                <div className="properties">
                  <div>Название: {currentPlan.name}</div>
                  <div>Корпус: {currentPlan.corpus || currentPlan.buildingName || 'Не указан'}</div>
                  <div>Секция: {currentPlan.section || 'Не указана'}</div>
                  <div>Этаж: {currentPlan.floor}</div>
                  <div>Витражей: {currentPlan.placedVitrages.length}</div>
                </div>
              </div>

              {selectedItem && (
                <div className="sidebar-section">
                  <h3>Информация о витраже</h3>
                  <div className="properties">
                    {(() => {
                      const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
                      const vitrage = placedVitrage && savedVitrages.find(v => v.id === placedVitrage.vitrageId)
                      if (vitrage) {
                        return (
                          <>
                            <div>Название: {vitrage.name}</div>
                            <div>Размер: {vitrage.totalWidth}×{vitrage.totalHeight}мм</div>
                            <button
                              className="secondary"
                              style={{marginTop: '8px', width: '100%'}}
                              onClick={() => {
                                const updatedVitrages = currentPlan.placedVitrages.map(v =>
                                  v.id === selectedItem ? {
                                    ...v,
                                    rotation: (v.rotation + 90) % 360
                                  } : v
                                )
                                setCurrentPlan({
                                  ...currentPlan,
                                  placedVitrages: updatedVitrages
                                })
                              }}
                            >
                              Повернуть на 90°
                            </button>
                          </>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div ref={containerRef} className="canvas-container">
          {currentPlan ? (
            <canvas
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            />
          ) : (
            <div className="no-plan-message">
              <h3>Создайте новый план фасада</h3>
              <p>Нажмите "Новый фасад" для начала работы</p>
            </div>
          )}
        </div>
      </div>

      {/* New Plan Dialog */}
      {showNewPlanDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать новый план фасада</h3>
            <div className="form-group">
              <label>Название фасада:</label>
              <input
                type="text"
                value={newPlanData.name}
                onChange={(e) => setNewPlanData({...newPlanData, name: e.target.value})}
                placeholder="Фасад А-1"
              />
            </div>
            <div className="form-group">
              <label>Корпус:</label>
              <input
                type="text"
                value={newPlanData.corpus}
                onChange={(e) => setNewPlanData({...newPlanData, corpus: e.target.value})}
                placeholder="Корпус А"
              />
            </div>
            <div className="form-group">
              <label>Секция:</label>
              <input
                type="text"
                value={newPlanData.section}
                onChange={(e) => setNewPlanData({...newPlanData, section: e.target.value})}
                placeholder="Секция 1"
              />
            </div>
            <div className="form-group">
              <label>Номер этажа:</label>
              <input
                type="number"
                value={newPlanData.floor}
                onChange={(e) => setNewPlanData({...newPlanData, floor: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowNewPlanDialog(false)}>
                Отмена
              </button>
              <button
                className="primary"
                onClick={createNewPlan}
                disabled={!newPlanData.name || !newPlanData.corpus || !newPlanData.section}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selector Modal */}
      {showPlanSelector && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Выберите план фасада</h3>
            {savedPlans.length > 0 ? (
              <>
                <div className="plan-selector">
                  <select
                    onChange={(e) => {
                      const selectedPlan = savedPlans.find(p => p.id === e.target.value)
                      if (selectedPlan) {
                        loadPlan(selectedPlan)
                        setShowPlanSelector(false)
                      }
                    }}
                    defaultValue=""
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid rgba(173, 216, 230, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: 'var(--text-dark)',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '20px'
                    }}
                  >
                    <option value="" disabled>Выберите фасад...</option>
                    {savedPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.corpus || plan.buildingName || 'Корпус не указан'} / {plan.section || 'Секция не указана'} (Этаж {plan.floor})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="plans-preview">
                  {savedPlans.map(plan => (
                    <div
                      key={plan.id}
                      className="plan-preview-item"
                      onClick={() => {
                        loadPlan(plan)
                        setShowPlanSelector(false)
                      }}
                      style={{
                        padding: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{fontWeight: '700', color: 'var(--text-white)', marginBottom: '6px'}}>
                        {plan.name}
                      </div>
                      <div style={{fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)'}}>
                        {plan.corpus || plan.buildingName || 'Корпус не указан'} / {plan.section || 'Секция не указана'} - Этаж {plan.floor}
                      </div>
                      <div style={{fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px'}}>
                        Витражей: {plan.placedVitrages.length} | Создан: {new Date(plan.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)'}}>
                <p style={{marginBottom: '16px'}}>Нет сохраненных фасадов</p>
                <p style={{fontSize: '14px'}}>
                  Создайте новый фасад для начала работы
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowPlanSelector(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vitrage Selector Dialog */}
      {showVitrageSelector && (
        <div className="modal-overlay">
          <div className="modal large">
            <h3>Выберите витраж для размещения</h3>
            {savedVitrages.length > 0 ? (
              <>
                <p style={{marginBottom: '16px', color: 'rgba(255, 255, 255, 0.8)'}}>
                  Витражи загружаются из вкладки "Спецификация витражей"
                </p>
                <div className="vitrage-grid">
                  {savedVitrages.map(vitrage => (
                    <div
                      key={vitrage.id}
                      className="vitrage-card"
                      onClick={() => selectVitrageForPlacement(vitrage)}
                    >
                      <div className="vitrage-preview">
                        <div className="vitrage-name">{vitrage.name}</div>
                        <div className="vitrage-size">
                          {vitrage.totalWidth}×{vitrage.totalHeight}мм
                        </div>
                        <div className="vitrage-grid-info">
                          {vitrage.rows}×{vitrage.cols} сегментов
                        </div>
                        <div style={{marginTop: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)'}}>
                          Создан: {new Date(vitrage.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.8)'}}>
                <p style={{marginBottom: '16px'}}>Нет сохраненных витражей</p>
                <p style={{fontSize: '14px'}}>
                  Перейдите во вкладку "Спецификация витражей" для просмотра и создания витражей
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowVitrageSelector(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}