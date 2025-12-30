import { useState, useRef, useEffect, useCallback } from 'react'
import './FloorPlanEditor.css'
import { floorPlanStorage, type FloorPlanData } from '../../services/floorPlanStorage'
import { vitrageStorage } from '../../services/vitrageStorage'
import { placedVitrageStorage, type PlacedVitrageData } from '../../services/placedVitrageStorage'
import { DefectWorkspace } from '../DefectTracking/components/DefectWorkspace/DefectWorkspace'
import { useDefectData } from '../DefectTracking/hooks/useDefectData'
import type { VitrageItem } from '../DefectTracking/types'

// Re-define VitrageGrid interface locally since it's not exported from GraphicsEditor
interface VitrageGrid {
  id: string
  name: string
  rows: number
  cols: number
  segments: unknown[] // Simplified for floor plan usage
  totalWidth: number
  totalHeight: number
  profileWidth: number
  createdAt: Date
  svgDrawing?: string // SVG-отрисовка из Конструктора
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

export interface VitrageID {
  object: string      // Объект (Зил18, Примавера14)
  corpus: string      // Корпус
  section: string     // Секция
  floor: string       // Этаж
  apartment: string   // Квартира
  vitrageNumber: string // Номер витража
  vitrageName: string   // Название витража
  vitrageSection: string // Секция витража
}

export interface SegmentIDMapping {
  [segmentId: string]: VitrageID // Map segment ID to its custom ID
}

export interface PlacedVitrage {
  id: string
  vitrageId: string // Reference to VitrageGrid
  x: number
  y: number
  rotation: number // 0, 90, 180, 270 degrees
  wallId?: string // Wall this vitrage is attached to
  scale: number
  segmentIDs?: SegmentIDMapping // Custom IDs for each segment
}

export interface FloorPlan {
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
  backgroundLayout?: { // Fixed background position and size
    x: number
    y: number
    width: number
    height: number
  }
  createdAt: Date
  updatedAt: Date
  // Legacy field for backward compatibility
  buildingName?: string
}

interface FloorPlanEditorProps {
  width?: number
  height?: number
  selectedObject?: { id: string; name: string } | null
}

export default function FloorPlanEditor({ width, height, selectedObject }: FloorPlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: width || 1200, height: height || 800 })
  
  // Editor state
  const [currentPlan, setCurrentPlan] = useState<FloorPlan | null>(null)
  const [savedPlans, setSavedPlans] = useState<FloorPlan[]>([])
  const [savedVitrages, setSavedVitrages] = useState<VitrageGrid[]>([])
  
  // Drawing state
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null)
  
  // UI state
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false)
  const [showDuplicatePlanDialog, setShowDuplicatePlanDialog] = useState(false)
  const [showVitrageSelector, setShowVitrageSelector] = useState(false)
  const [showPlanSelector, setShowPlanSelector] = useState(false)
  const [showVitrageIDDialog, setShowVitrageIDDialog] = useState(false)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3)
  const [selectedVitrageForPlacement, setSelectedVitrageForPlacement] = useState<VitrageGrid | null>(null)
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [planToDuplicate, setPlanToDuplicate] = useState<FloorPlan | null>(null)
  const [vitrageSearchQuery, setVitrageSearchQuery] = useState('')
  const [selectedVitrageForDefect, setSelectedVitrageForDefect] = useState<VitrageItem | null>(null)

  // Vitrage ID state
  const [vitrageIDData, setVitrageIDData] = useState<VitrageID>({
    object: '',
    corpus: '',
    section: '',
    floor: '',
    apartment: '',
    vitrageNumber: '',
    vitrageName: '',
    vitrageSection: ''
  })
  const [selectedSegmentForID, setSelectedSegmentForID] = useState<string | null>(null)
  const [segmentIDsTemp, setSegmentIDsTemp] = useState<SegmentIDMapping>({})

  // Options for dropdowns (will be populated from existing data)
  const [idOptions, setIdOptions] = useState({
    objects: [] as string[],
    corpuses: [] as string[],
    sections: [] as string[],
    floors: [] as string[],
    apartments: [] as string[],
    vitrageNumbers: [] as string[],
    vitrageNames: [] as string[],
    vitrageSections: [] as string[]
  })
  
  // Zoom and pan state
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({x: 0, y: 0})
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{x: number, y: number} | null>(null)
  
  // Background image cache
  const [backgroundImageCache, setBackgroundImageCache] = useState<{[key: string]: HTMLImageElement}>({})
  // Removed unused imageScale state
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    corpus: '',
    section: '',
    floor: 1
  })

  const [duplicatePlanData, setDuplicatePlanData] = useState({
    name: '',
    corpus: '',
    section: '',
    floor: 1
  })
  
  // Defect tracking hook
  const defectData = useDefectData(selectedObject)

  // All placed vitrages for defect status checking (includes fixed ones)
  const [allPlacedVitragesForStatus, setAllPlacedVitragesForStatus] = useState<PlacedVitrageData[]>([])

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    corpus: '',
    section: '',
    floor: ''
  })
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to load vitrages from specification storage (Supabase or localStorage)
  // Загружает только витражи текущего объекта из "Типовых витражей"
  const loadVitragesFromStorage = useCallback(async () => {
    if (!selectedObject?.id) {
      console.log('⚠️ Объект не выбран, витражи не загружаются')
      setSavedVitrages([])
      return
    }

    try {
      // Загружаем только витражи для текущего объекта
      const { data, source } = await vitrageStorage.getAll(selectedObject.id)
      console.log(`📋 Витражи загружены из ${source} для объекта "${selectedObject.name}":`, data.length)

      // Преобразуем данные в формат VitrageGrid
      const vitrageGrids: VitrageGrid[] = data.map((v) => ({
        id: v.id,
        name: v.name,  // Используем name вместо marking
        rows: v.rows,
        cols: v.cols,
        segments: v.segments || [],
        totalWidth: v.totalWidth,
        totalHeight: v.totalHeight,
        profileWidth: 12,
        createdAt: new Date(v.createdAt),
        svgDrawing: v.svgDrawing // SVG-отрисовка из Конструктора
      }))

      setSavedVitrages(vitrageGrids)
    } catch (error) {
      console.error('Ошибка загрузки витражей:', error)
      setSavedVitrages([])
    }
  }, [selectedObject?.id, selectedObject?.name])

  // Load saved data on mount
  useEffect(() => {
    const loadPlansFromStorage = async () => {
      if (!selectedObject?.id) {
        console.log('No object selected, skipping floor plans load')
        setSavedPlans([])
        return
      }

      const { data, error, usingFallback } = await floorPlanStorage.getAll(selectedObject.id)

      if (error) {
        console.error('Error loading floor plans:', error)
        setSavedPlans([])
      } else {
        console.log(`Loaded ${data.length} floor plans (using ${usingFallback ? 'localStorage' : 'Supabase'})`)
        // Convert FloorPlanData to FloorPlan format
        const plans: FloorPlan[] = data.map(plan => ({
          id: plan.id || Date.now().toString(),
          name: plan.name,
          corpus: plan.corpus,
          section: plan.section || '',
          floor: plan.floor,
          walls: plan.walls || [],
          rooms: plan.rooms || [],
          placedVitrages: plan.placed_vitrages || [],
          scale: plan.scale || 10,
          backgroundImage: plan.image_data || plan.image_url,
          backgroundOpacity: plan.background_opacity || 0.7,
          createdAt: new Date(plan.created_at || new Date()),
          updatedAt: new Date(plan.updated_at || new Date())
        }))
        setSavedPlans(plans)
      }
    }

    loadPlansFromStorage()
    // Load vitrages from VitrageSpecification storage
    loadVitragesFromStorage()
  }, [loadVitragesFromStorage, selectedObject?.id])

  // Load all placed vitrages for defect status checking (includes fixed ones)
  useEffect(() => {
    const loadAllPlacedVitrages = async () => {
      if (!selectedObject?.id) {
        setAllPlacedVitragesForStatus([])
        return
      }

      try {
        const { data } = await placedVitrageStorage.getByObjectId(selectedObject.id)
        console.log(`📊 Загружено ${data.length} размещённых витражей для проверки статусов`)
        setAllPlacedVitragesForStatus(data)
      } catch (error) {
        console.error('Ошибка загрузки витражей для статусов:', error)
        setAllPlacedVitragesForStatus([])
      }
    }

    loadAllPlacedVitrages()
  }, [selectedObject?.id])

  // Update ID options from all placed vitrages
  useEffect(() => {
    const allVitrages = savedPlans.flatMap(plan => plan.placedVitrages)
    const objects = new Set<string>()
    const corpuses = new Set<string>()
    const sections = new Set<string>()
    const floors = new Set<string>()
    const apartments = new Set<string>()
    const vitrageNumbers = new Set<string>()
    const vitrageNames = new Set<string>()
    const vitrageSections = new Set<string>()

    allVitrages.forEach(v => {
      if (v.segmentIDs) {
        Object.values(v.segmentIDs).forEach(id => {
          if (id.object) objects.add(id.object)
          if (id.corpus) corpuses.add(id.corpus)
          if (id.section) sections.add(id.section)
          if (id.floor) floors.add(id.floor)
          if (id.apartment) apartments.add(id.apartment)
          if (id.vitrageNumber) vitrageNumbers.add(id.vitrageNumber)
          if (id.vitrageName) vitrageNames.add(id.vitrageName)
          if (id.vitrageSection) vitrageSections.add(id.vitrageSection)
        })
      }
    })

    setIdOptions({
      objects: Array.from(objects).sort(),
      corpuses: Array.from(corpuses).sort(),
      sections: Array.from(sections).sort(),
      floors: Array.from(floors).sort(),
      apartments: Array.from(apartments).sort(),
      vitrageNumbers: Array.from(vitrageNumbers).sort(),
      vitrageNames: Array.from(vitrageNames).sort(),
      vitrageSections: Array.from(vitrageSections).sort()
    })
  }, [savedPlans])

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

  // Reset zoom and pan when plan changes to keep vitrages anchored to background
  useEffect(() => {
    if (currentPlan) {
      setZoomLevel(1)
      setPanOffset({x: 0, y: 0})
    }
  }, [currentPlan?.id])

  // Save plans to storage (removed as we'll save individually)
  const savePlansToStorage = useCallback((plans: FloorPlan[]) => {
    // This method is now deprecated - we save plans individually to Supabase
    setSavedPlans(plans)
  }, [])

  // Create new floor plan
  const createNewPlan = async () => {
    if (!selectedObject?.id) {
      alert('Пожалуйста, выберите объект для создания плана')
      return
    }

    setSaveStatus('saving')

    const planData: FloorPlanData = {
      object_id: selectedObject.id,
      name: newPlanData.name,
      corpus: newPlanData.corpus,
      section: newPlanData.section || null,
      floor: newPlanData.floor,
      scale: 10, // 10mm per pixel
      grid_visible: true,
      background_opacity: 0.7,
      placed_vitrages: [],
      walls: [],
      rooms: []
    }

    const { data, error, usingFallback } = await floorPlanStorage.create(planData)

    if (error) {
      console.error('Error creating floor plan:', error)
      alert('Ошибка при создании плана')
      setSaveStatus('saved')
      return
    }

    if (data) {
      console.log(`Created floor plan in ${usingFallback ? 'localStorage' : 'Supabase'}`)

      const newPlan: FloorPlan = {
        id: data.id || Date.now().toString(),
        name: data.name,
        corpus: data.corpus,
        section: data.section || '',
        floor: data.floor,
        walls: data.walls || [],
        rooms: data.rooms || [],
        placedVitrages: data.placed_vitrages || [],
        scale: data.scale || 10,
        backgroundImage: data.image_data || data.image_url,
        backgroundOpacity: data.background_opacity || 0.7,
        createdAt: new Date(data.created_at || new Date()),
        updatedAt: new Date(data.updated_at || new Date())
      }

      // Add to local state
      setSavedPlans([...savedPlans, newPlan])

      // Set as current plan
      setCurrentPlan(newPlan)
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
    }

    // Close dialog and reset form
    setShowNewPlanDialog(false)
    setNewPlanData({ name: '', corpus: '', section: '', floor: 1 })

    // Clear filters to ensure new plan is visible
    setFilters({ name: '', corpus: '', section: '', floor: '' })
  }

  // Save current plan
  const saveCurrentPlan = useCallback(async () => {
    if (!currentPlan || !selectedObject?.id) return

    setSaveStatus('saving')

    const updatedPlan = { ...currentPlan, updatedAt: new Date() }

    // Convert to FloorPlanData format
    const planData: Partial<FloorPlanData> = {
      name: updatedPlan.name,
      corpus: updatedPlan.corpus,
      section: updatedPlan.section || null,
      floor: updatedPlan.floor,
      scale: updatedPlan.scale,
      image_data: updatedPlan.backgroundImage,
      background_opacity: updatedPlan.backgroundOpacity,
      placed_vitrages: updatedPlan.placedVitrages,
      walls: updatedPlan.walls,
      rooms: updatedPlan.rooms
    }

    const { data, error, usingFallback } = await floorPlanStorage.update(updatedPlan.id, planData)

    if (error) {
      console.error('Error saving floor plan:', error)
      alert('Ошибка при сохранении плана')
      setSaveStatus('unsaved')
      return
    }

    if (data) {
      console.log(`Saved floor plan to ${usingFallback ? 'localStorage' : 'Supabase'}`)

      // Update local state
      const existingIndex = savedPlans.findIndex(p => p.id === updatedPlan.id)
      if (existingIndex >= 0) {
        const newPlans = [...savedPlans]
        newPlans[existingIndex] = updatedPlan
        setSavedPlans(newPlans)
      }

      setCurrentPlan(updatedPlan)
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
    }
  }, [currentPlan, savedPlans, selectedObject?.id])

  // Auto-save when plan changes
  useEffect(() => {
    if (!currentPlan || !hasUnsavedChanges) return

    const timeoutId = setTimeout(() => {
      saveCurrentPlan()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId)
  }, [currentPlan, hasUnsavedChanges, saveCurrentPlan])

  // Mark plan as changed when vitrage positions change
  const updateCurrentPlan = useCallback((updater: (plan: FloorPlan) => FloorPlan) => {
    if (!currentPlan) return

    const newPlan = updater(currentPlan)
    setCurrentPlan(newPlan)
    setHasUnsavedChanges(true)
    setSaveStatus('unsaved')
  }, [currentPlan])

  // Open duplicate plan dialog
  const openDuplicatePlanDialog = useCallback((plan: FloorPlan) => {
    setPlanToDuplicate(plan)
    setDuplicatePlanData({
      name: `${plan.name} (копия)`,
      corpus: plan.corpus,
      section: plan.section,
      floor: plan.floor
    })
    setShowDuplicatePlanDialog(true)
  }, [])

  // Create duplicate plan with new data
  const createDuplicatePlan = async () => {
    if (!planToDuplicate || !selectedObject?.id) return

    setSaveStatus('saving')

    const planData: FloorPlanData = {
      object_id: selectedObject.id,
      name: duplicatePlanData.name,
      corpus: duplicatePlanData.corpus,
      section: duplicatePlanData.section || null,
      floor: duplicatePlanData.floor,
      scale: planToDuplicate.scale,
      image_data: planToDuplicate.backgroundImage,
      background_opacity: planToDuplicate.backgroundOpacity,
      placed_vitrages: planToDuplicate.placedVitrages,
      walls: planToDuplicate.walls,
      rooms: planToDuplicate.rooms,
      grid_visible: true
    }

    const { data, error, usingFallback } = await floorPlanStorage.create(planData)

    if (error) {
      console.error('Error duplicating floor plan:', error)
      alert('Ошибка при дублировании плана')
      setSaveStatus('saved')
      return
    }

    if (data) {
      console.log(`Duplicated floor plan in ${usingFallback ? 'localStorage' : 'Supabase'}`)

      const newPlan: FloorPlan = {
        id: data.id || Date.now().toString(),
        name: data.name,
        corpus: data.corpus,
        section: data.section || '',
        floor: data.floor,
        walls: data.walls || [],
        rooms: data.rooms || [],
        placedVitrages: data.placed_vitrages || [],
        scale: data.scale || 10,
        backgroundImage: data.image_data || data.image_url,
        backgroundOpacity: data.background_opacity || 0.7,
        createdAt: new Date(data.created_at || new Date()),
        updatedAt: new Date(data.updated_at || new Date())
      }

      setSavedPlans([...savedPlans, newPlan])
      setCurrentPlan(newPlan)
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
    }

    // Close dialog and reset
    setShowDuplicatePlanDialog(false)
    setPlanToDuplicate(null)
    setDuplicatePlanData({ name: '', corpus: '', section: '', floor: 1 })

    // Clear filters to ensure new plan is visible
    setFilters({ name: '', corpus: '', section: '', floor: '' })
  }

  // Delete plan function
  const deletePlan = useCallback(async (planToDelete: FloorPlan) => {
    if (confirm(`Вы уверены, что хотите удалить план "${planToDelete.name}"?`)) {
      const { error, usingFallback } = await floorPlanStorage.delete(planToDelete.id)

      if (error) {
        console.error('Error deleting floor plan:', error)
        alert('Ошибка при удалении плана')
        return
      }

      console.log(`Deleted floor plan from ${usingFallback ? 'localStorage' : 'Supabase'}`)

      // Update local state
      const newPlans = savedPlans.filter(p => p.id !== planToDelete.id)
      setSavedPlans(newPlans)

      // If deleted plan was current, clear it
      if (currentPlan?.id === planToDelete.id) {
        setCurrentPlan(null)
        setHasUnsavedChanges(false)
        setSaveStatus('saved')
      }
    }
  }, [savedPlans, currentPlan])

  // Load plan
  const loadPlan = (plan: FloorPlan) => {
    setCurrentPlan(plan)
    setHasUnsavedChanges(false)
    setSaveStatus('saved')
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

  // Auto-open plan when filters result in a single plan or when current plan is not in filtered results
  useEffect(() => {
    if (filteredPlans.length === 1 && currentPlan?.id !== filteredPlans[0].id) {
      // Auto-open when only one plan matches filters
      loadPlan(filteredPlans[0])
    } else if (filteredPlans.length > 1 && currentPlan && !filteredPlans.find(p => p.id === currentPlan.id)) {
      // If current plan is not in filtered results, open the first filtered plan
      loadPlan(filteredPlans[0])
    } else if (filteredPlans.length === 0 && currentPlan) {
      // If no plans match filters, clear current plan
      setCurrentPlan(null)
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
    }
  }, [filteredPlans, currentPlan])

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

    if (!currentPlan) return

    const canvas = canvasRef.current
    if (!canvas) return

    const pos = getMousePos(e)

    // Check if mouse is over a vitrage
    const hoveredVitrage = currentPlan.placedVitrages.find(v => {
      const vitrage = savedVitrages.find(sv => sv.id === v.vitrageId)
      if (!vitrage) return false

      const vitrageWidth = vitrage.totalWidth * 0.1 * v.scale
      const vitrageHeight = vitrage.totalHeight * 0.1 * v.scale

      // For rotated vitrages, we need to check if mouse is within rotated bounds
      if (v.rotation === 0) {
        return pos.x >= v.x && pos.x <= v.x + vitrageWidth &&
               pos.y >= v.y && pos.y <= v.y + vitrageHeight
      } else {
        const rotation = v.rotation
        const localX = pos.x - v.x
        const localY = pos.y - v.y
        const radians = (-rotation * Math.PI) / 180
        const cosR = Math.cos(radians)
        const sinR = Math.sin(radians)
        const originalX = localX * cosR - localY * sinR
        const originalY = localX * sinR + localY * cosR
        return originalX >= 0 && originalX <= vitrageWidth &&
               originalY >= 0 && originalY <= vitrageHeight
      }
    })

    if (hoveredVitrage) {
      // Scale the individual vitrage
      e.preventDefault()
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(0.1, Math.min(3, hoveredVitrage.scale * scaleFactor))

      updateCurrentPlan(plan => ({
        ...plan,
        placedVitrages: plan.placedVitrages.map(v =>
          v.id === hoveredVitrage.id ? { ...v, scale: newScale } : v
        )
      }))

      // Auto-select the vitrage being scaled
      setSelectedItem(hoveredVitrage.id)
    }
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

        console.log(`Checking vitrage ${vitrage.name}, rotation: ${v.rotation}, pos: ${pos.x}, ${pos.y}`)
        console.log(`Vitrage position: ${v.x}, ${v.y}, size: ${vitrageWidth}x${vitrageHeight}`)

        // For rotated vitrages, we need to check if click is within rotated bounds
        if (v.rotation === 0) {
          // No rotation - simple rectangle check
          const hit = pos.x >= v.x && pos.x <= v.x + vitrageWidth &&
                      pos.y >= v.y && pos.y <= v.y + vitrageHeight
          console.log(`No rotation check: ${hit}`)
          return hit
        } else {
          // For rotated rectangles, transform the click point to local coordinates
          // The vitrage is rotated around point (v.x, v.y) - the top-left corner
          const rotation = v.rotation

          // Translate click point relative to rotation origin (v.x, v.y)
          const localX = pos.x - v.x
          const localY = pos.y - v.y

          console.log(`Local click before rotation: ${localX}, ${localY}`)

          // Rotate the local point back by negative rotation to get original coordinates
          const radians = (-rotation * Math.PI) / 180
          const cosR = Math.cos(radians)
          const sinR = Math.sin(radians)

          const originalX = localX * cosR - localY * sinR
          const originalY = localX * sinR + localY * cosR

          console.log(`Original coordinates: ${originalX}, ${originalY}`)

          // Check if original point is within the unrotated rectangle bounds (0,0) to (width,height)
          const hit = originalX >= 0 && originalX <= vitrageWidth &&
                      originalY >= 0 && originalY <= vitrageHeight

          console.log(`Rotation check: ${hit}, bounds: 0-${vitrageWidth}, 0-${vitrageHeight}`)
          return hit
        }
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
      updateCurrentPlan(plan => ({
        ...plan,
        placedVitrages: plan.placedVitrages.map(v =>
          v.id === selectedItem ? {
            ...v,
            x: pos.x - dragOffset.x,
            y: pos.y - dragOffset.y
          } : v
        )
      }))
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

  const placeVitrageAtPosition = async (x: number, y: number) => {
    if (!currentPlan || !selectedVitrageForPlacement || !selectedObject?.id) return

    // Create placed vitrage in Supabase first to get UUID
    const placedVitrageData: PlacedVitrageData = {
      // Don't pass id - let Supabase generate UUID
      object_id: selectedObject.id,
      floor_plan_id: currentPlan.id,
      vitrage_id: selectedVitrageForPlacement.id,
      vitrage_name: selectedVitrageForPlacement.name,
      vitrage_data: {
        rows: selectedVitrageForPlacement.rows,
        cols: selectedVitrageForPlacement.cols,
        totalWidth: selectedVitrageForPlacement.totalWidth,
        totalHeight: selectedVitrageForPlacement.totalHeight,
        segments: selectedVitrageForPlacement.segments,
        svgDrawing: selectedVitrageForPlacement.svgDrawing // SVG-отрисовка из Конструктора
      },
      position_x: x,
      position_y: y,
      rotation: 0,
      scale: 0.5,
      inspection_status: 'not_checked',
      total_defects_count: 0,
      defective_segments_count: 0,
      segment_defects: {}
    }

    const { data, error, usingFallback } = await placedVitrageStorage.create(placedVitrageData)

    if (error) {
      console.error('Error creating placed vitrage in Supabase:', error)
      return
    }

    // Use UUID from Supabase response (or generated ID from localStorage fallback)
    const placedVitrageId = data?.id || crypto.randomUUID()
    console.log('✅ Placed vitrage saved to', usingFallback ? 'localStorage' : 'Supabase', 'with ID:', placedVitrageId)

    const newPlacedVitrage: PlacedVitrage = {
      id: placedVitrageId,
      vitrageId: selectedVitrageForPlacement.id,
      x: x,
      y: y,
      rotation: 0,
      scale: 0.5 // Scale down for floor plan view
    }

    // Update local state
    updateCurrentPlan(plan => ({
      ...plan,
      placedVitrages: [...plan.placedVitrages, newPlacedVitrage]
    }))

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

        let layout = currentPlan.backgroundLayout

        // If no saved layout, calculate it and save
        if (!layout) {
          const worldWidth = canvasDimensions.width
          const worldHeight = canvasDimensions.height
          const imgAspectRatio = img.width / img.height
          const worldAspectRatio = worldWidth / worldHeight

          let drawWidth, drawHeight, offsetX, offsetY

          if (imgAspectRatio > worldAspectRatio) {
            // Image is wider - fit width
            drawWidth = worldWidth
            drawHeight = worldWidth / imgAspectRatio
            offsetX = 0
            offsetY = (worldHeight - drawHeight) / 2
          } else {
            // Image is taller - fit height
            drawHeight = worldHeight
            drawWidth = worldHeight * imgAspectRatio
            offsetX = (worldWidth - drawWidth) / 2
            offsetY = 0
          }

          layout = { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight }

          // Save layout to plan
          updateCurrentPlan(plan => ({
            ...plan,
            backgroundLayout: layout!
          }))
        }

        // Always draw at fixed position
        ctx.drawImage(img, layout.x, layout.y, layout.width, layout.height)
        ctx.restore()
      }

    // Helper function to check if vitrage has defects
    const checkVitrageHasDefects = (vitrageId: string): boolean => {
      // First check in segmentDefectsData (updated immediately after saving)
      for (const [key, data] of defectData.segmentDefectsData.entries()) {
        if (key.startsWith(`${vitrageId}-`) && data.defects && data.defects.length > 0) {
          return true
        }
      }

      // Check in allPlacedVitragesForStatus (includes all vitrages, not just with active defects)
      const placedVitrage = allPlacedVitragesForStatus.find(pv =>
        pv.id === vitrageId || pv.vitrage_id === vitrageId
      )

      if (placedVitrage?.segment_defects) {
        // Check if any segment has defects
        for (const segmentKey in placedVitrage.segment_defects) {
          const segment = placedVitrage.segment_defects[segmentKey]
          if (segment.defects && segment.defects.length > 0) {
            return true
          }
        }
      }

      return false
    }

    // Helper function to check if all defects are fixed (green status)
    const checkVitrageAllFixed = (vitrageId: string): boolean => {
      // Check in allPlacedVitragesForStatus (includes all vitrages, including fixed ones)
      const placedVitrage = allPlacedVitragesForStatus.find(pv =>
        pv.id === vitrageId || pv.vitrage_id === vitrageId
      )

      if (!placedVitrage?.segment_defects) {
        return false // No defect data - not fixed
      }

      const segmentDefects = placedVitrage.segment_defects
      const segmentKeys = Object.keys(segmentDefects)

      if (segmentKeys.length === 0) {
        return false // No segments checked
      }

      // Check if any segment has 'fixed' status and no segments have defects
      let hasFixedSegments = false
      let hasDefects = false

      for (const segmentKey of segmentKeys) {
        const segment = segmentDefects[segmentKey]
        if (segment.defects && segment.defects.length > 0) {
          hasDefects = true
          break
        }
        if (segment.status === 'fixed') {
          hasFixedSegments = true
        }
      }

      // Return true only if there are fixed segments and no defects
      return hasFixedSegments && !hasDefects
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

      // Check if vitrage has defects or all fixed
      const hasDefects = checkVitrageHasDefects(placedVitrage.id)
      const allFixed = checkVitrageAllFixed(placedVitrage.id)

      // Draw vitrage background - red if has defects, green if all fixed
      let bgColor = '#fff'
      if (hasDefects) {
        bgColor = '#ffcdd2' // Light red for defects
      } else if (allFixed) {
        bgColor = '#c8e6c9' // Light green for all fixed
      }
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      // Draw vitrage border - red if has defects, green if selected or all fixed
      let borderColor = '#333'
      let borderWidth = 2

      if (selectedItem === placedVitrage.id) {
        borderColor = '#4CAF50'
        borderWidth = 3
      } else if (hasDefects) {
        borderColor = '#c62828'
        borderWidth = 3
      } else if (allFixed) {
        borderColor = '#43a047' // Green for all fixed
        borderWidth = 3
      }

      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.strokeRect(0, 0, displayWidth, displayHeight)

      // Draw grid lines for all vitrages
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

      // Draw vitrage name with adaptive font size
      ctx.fillStyle = '#333'
      // Adjust font size based on vitrage scale to keep text readable
      const fontSize = Math.max(12, Math.min(24, 14 / placedVitrage.scale))
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        vitrage.name,
        displayWidth / 2,
        displayHeight / 2
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
      
      // Draw vitrage name with adaptive font size
      ctx.globalAlpha = 0.8
      ctx.fillStyle = '#1976d2'
      // Use larger font size for preview (scale is 0.5)
      const previewFontSize = Math.max(12, Math.min(24, 14 / 0.5))
      ctx.font = `bold ${previewFontSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.setLineDash([]) // Solid text
      ctx.fillText(
        vitrage.name,
        displayWidth / 2,
        displayHeight / 2
      )

      // Draw "click to place" hint with larger font
      ctx.fillStyle = '#666'
      ctx.font = `${Math.max(10, 10 / 0.5)}px Arial`
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
  }, [currentPlan, savedVitrages, selectedItem, canvasDimensions, backgroundOpacity, selectedVitrageForPlacement, mousePosition, zoomLevel, panOffset, backgroundImageCache, allPlacedVitragesForStatus, defectData.segmentDefectsData])

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
        (vitrageInfoSection as Element).scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedItem])

  // Handle keyboard events for Delete key
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedItem && currentPlan) {
        // Delete from Supabase
        const { error } = await placedVitrageStorage.delete(selectedItem)
        if (error) {
          console.error('Error deleting placed vitrage from Supabase:', error)
        } else {
          console.log('✅ Vitrage deleted from Supabase')
        }

        // Delete selected vitrage from local state
        updateCurrentPlan(plan => ({
          ...plan,
          placedVitrages: plan.placedVitrages.filter(v => v.id !== selectedItem)
        }))
        setSelectedItem(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, currentPlan, updateCurrentPlan])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close vitrage ID dialog first (highest priority)
        if (showVitrageIDDialog) {
          setShowVitrageIDDialog(false)
        }
        // Then close vitrage selector
        else if (showVitrageSelector) {
          setShowVitrageSelector(false)
          setVitrageSearchQuery('') // Clear search when closing
        }
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [showVitrageSelector, showVitrageIDDialog])

  // Clear search query when opening vitrage selector
  useEffect(() => {
    if (showVitrageSelector) {
      setVitrageSearchQuery('')
    }
  }, [showVitrageSelector])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('File selected:', file)

    if (!file || !currentPlan) {
      console.log('No file or no current plan')
      return
    }

    if (file.type === 'application/pdf' || file.type.includes('image')) {
      console.log('Valid file type:', file.type)

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        console.log('File loaded, updating plan with background')
        updateCurrentPlan(plan => ({
          ...plan,
          backgroundImage: result,
          backgroundOpacity: backgroundOpacity
        }))
      }

      reader.onerror = () => {
        console.error('Error reading file')
        alert('Ошибка при загрузке файла')
      }

      if (file.type === 'application/pdf') {
        // For PDF files, we'll convert first page to image
        // Note: In production, you'd want to use a library like pdf.js
        alert('PDF файлы будут поддержаны в следующей версии. Пожалуйста, используйте изображения (PNG, JPG).')
        return
      } else {
        reader.readAsDataURL(file)
      }
    } else {
      console.log('Invalid file type:', file.type)
      alert('Поддерживаются только изображения (PNG, JPG, JPEG, GIF, BMP)')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // Remove background
  const removeBackground = () => {
    if (!currentPlan) return
    updateCurrentPlan(plan => ({
      ...plan,
      backgroundImage: undefined,
      backgroundOpacity: undefined
    }))
  }
  
  // Update background opacity
  const updateBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity)
    if (currentPlan && currentPlan.backgroundImage) {
      updateCurrentPlan(plan => ({
        ...plan,
        backgroundOpacity: opacity
      }))
    }
  }

  // Open Vitrage ID dialog
  const openVitrageIDDialog = () => {
    if (!selectedItem || !currentPlan) return

    const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
    if (!placedVitrage) return

    const vitrage = savedVitrages.find(v => v.id === placedVitrage.vitrageId)

    // Load existing segment IDs or create new mapping
    setSegmentIDsTemp(placedVitrage.segmentIDs || {})
    setSelectedSegmentForID(null)

    // Pre-fill with current plan data
    setVitrageIDData({
      object: selectedObject?.name || '',
      corpus: currentPlan.corpus || '',
      section: currentPlan.section || '',
      floor: currentPlan.floor?.toString() || '',
      apartment: '',
      vitrageNumber: '',
      vitrageName: vitrage?.name || '',
      vitrageSection: ''
    })

    setShowVitrageIDDialog(true)
  }

  // Generate simple SVG for old vitrages without svgDrawing
  const generateSimpleSVG = (vitrage: VitrageGrid, segmentIDs: SegmentIDMapping): string => {
    const cols = vitrage.cols
    const rows = vitrage.rows
    const cellWidth = vitrage.totalWidth / cols
    const cellHeight = vitrage.totalHeight / rows
    const padding = 50
    const totalWidth = vitrage.totalWidth + padding * 2
    const totalHeight = vitrage.totalHeight + padding * 2

    let svgContent = `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">`

    // Внешняя рамка
    svgContent += `<rect x="${padding}" y="${padding}" width="${vitrage.totalWidth}" height="${vitrage.totalHeight}" fill="none" stroke="#2c3e50" stroke-width="4"/>`

    // Сетка сегментов
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = padding + col * cellWidth
        const y = padding + row * cellHeight
        const segmentId = `segment-${row}-${col}`

        // Get full ID for this segment
        const segmentIDData = segmentIDs[segmentId]
        const displayText = segmentIDData ? generateFullID(segmentIDData) : `${row * cols + col + 1}`

        svgContent += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="rgba(135, 206, 235, 0.2)" stroke="#87ceeb" stroke-width="2" data-segment-id="${segmentId}" class="vitrage-segment" style="cursor: pointer;"/>`

        // Display segment ID with text wrapping
        if (displayText.length > 20) {
          // Split long IDs into 2 lines at approximately middle
          const parts = displayText.split('-')
          const midPoint = Math.ceil(parts.length / 2)
          const line1 = parts.slice(0, midPoint).join('-')
          const line2 = parts.slice(midPoint).join('-')

          const fontSize = Math.min(9, cellHeight / 4, cellWidth / Math.max(line1.length, line2.length) * 1.5)
          const lineHeight = fontSize * 1.3
          const startY = y + cellHeight / 2 - lineHeight / 2

          svgContent += `<text x="${x + cellWidth / 2}" y="${startY}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" fill="#2c3e50" font-weight="600" pointer-events="none">${line1}</text>`
          svgContent += `<text x="${x + cellWidth / 2}" y="${startY + lineHeight}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" fill="#2c3e50" font-weight="600" pointer-events="none">${line2}</text>`
        } else {
          // Short text - display in one line
          const fontSize = Math.min(10, cellHeight / 3, cellWidth / displayText.length * 1.5)
          svgContent += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" fill="#2c3e50" font-weight="600" pointer-events="none">${displayText}</text>`
        }
      }
    }

    svgContent += '</svg>'
    return svgContent
  }

  // Open defect tracking for selected vitrage
  const openDefectTracking = () => {
    if (!selectedItem || !currentPlan) return

    const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
    if (!placedVitrage) return

    const vitrage = savedVitrages.find(v => v.id === placedVitrage.vitrageId)
    if (!vitrage) return

    // Check if all segments have IDs assigned
    const totalSegments = vitrage.rows * vitrage.cols
    const assignedSegments = placedVitrage.segmentIDs ? Object.keys(placedVitrage.segmentIDs).length : 0

    if (assignedSegments < totalSegments) {
      alert(`⚠️ Необходимо задать ID для всех секций витража!\n\nЗадано ID: ${assignedSegments} из ${totalSegments} секций.\nПожалуйста, сначала задайте ID для всех секций витража, затем создавайте дефектовку.`)
      return
    }

    // Use original SVG from Constructor if available, fall back to generated for old vitrages
    const svgDrawing = vitrage.svgDrawing || generateSimpleSVG(vitrage, placedVitrage.segmentIDs || {})

    // Convert VitrageGrid to VitrageItem format with segment IDs
    // IMPORTANT: Use placedVitrage.id (not vitrage.id) for defect tracking
    const vitrageItem: VitrageItem = {
      id: placedVitrage.id, // ID размещённого витража для сохранения дефектов
      name: vitrage.name,
      objectId: selectedObject?.id || '',
      objectName: selectedObject?.name || '',
      rows: vitrage.rows,
      cols: vitrage.cols,
      totalWidth: vitrage.totalWidth,
      totalHeight: vitrage.totalHeight,
      segments: vitrage.segments.map((seg: any, index: number) => {
        // Calculate row and col from index
        const row = Math.floor(index / vitrage.cols)
        const col = index % vitrage.cols
        const segmentId = `segment-${row}-${col}`
        const segmentIDData = placedVitrage.segmentIDs?.[segmentId]

        return {
          id: segmentIDData ? generateFullID(segmentIDData) : segmentId,
          type: seg.type || 'glass',
          width: seg.realWidth,
          height: seg.realHeight,
          formula: seg.formula,
          label: seg.label,
          hidden: seg.hidden,
          merged: seg.merged,
          rowSpan: seg.rowSpan,
          colSpan: seg.colSpan,
          mergedInto: seg.mergedInto
        }
      }),
      svgDrawing: svgDrawing, // Add generated SVG
      createdAt: vitrage.createdAt
    }

    setSelectedVitrageForDefect(vitrageItem)
  }

  // Select segment for ID editing
  const selectSegmentForID = (segmentId: string) => {
    setSelectedSegmentForID(segmentId)

    if (!currentPlan || !selectedItem) return

    const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
    if (!placedVitrage) return

    const vitrage = savedVitrages.find(v => v.id === placedVitrage.vitrageId)

    // Load existing ID for this segment or pre-fill with plan data
    if (segmentIDsTemp[segmentId]) {
      setVitrageIDData(segmentIDsTemp[segmentId])
    } else {
      setVitrageIDData({
        object: selectedObject?.name || '',
        corpus: currentPlan.corpus || '',
        section: currentPlan.section || '',
        floor: currentPlan.floor?.toString() || '',
        apartment: '',
        vitrageNumber: '',
        vitrageName: vitrage?.name || '',
        vitrageSection: ''
      })
    }
  }

  // Save ID for current segment
  const saveSegmentID = () => {
    if (!selectedSegmentForID) return

    setSegmentIDsTemp(prev => ({
      ...prev,
      [selectedSegmentForID]: vitrageIDData
    }))

    // Clear selection after saving
    setSelectedSegmentForID(null)
    setVitrageIDData({
      object: '',
      corpus: '',
      section: '',
      floor: '',
      apartment: '',
      vitrageNumber: '',
      vitrageName: '',
      vitrageSection: ''
    })
  }

  // Save all segment IDs to vitrage
  const saveAllSegmentIDs = async () => {
    if (!selectedItem || !currentPlan || !selectedObject?.id) return

    const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
    if (!placedVitrage) return

    const vitrage = savedVitrages.find(v => v.id === placedVitrage.vitrageId)
    if (!vitrage) return

    // Extract first ID data (assuming all segments have same object/corpus/section/floor)
    const firstSegmentID = Object.values(segmentIDsTemp)[0]

    if (firstSegmentID) {
      // Create or update placed vitrage in Supabase
      const placedVitrageData: PlacedVitrageData = {
        id: placedVitrage.id,
        object_id: selectedObject.id,
        floor_plan_id: currentPlan.id,
        vitrage_id: placedVitrage.vitrageId,
        vitrage_name: vitrage.name,
        vitrage_data: {
          rows: vitrage.rows,
          cols: vitrage.cols,
          totalWidth: vitrage.totalWidth,
          totalHeight: vitrage.totalHeight,
          segments: vitrage.segments,
          svgDrawing: vitrage.svgDrawing // SVG-отрисовка из Конструктора
        },
        position_x: placedVitrage.x,
        position_y: placedVitrage.y,
        rotation: placedVitrage.rotation,
        scale: placedVitrage.scale,
        // ID компоненты
        id_object: firstSegmentID.object,
        id_corpus: firstSegmentID.corpus,
        id_section: firstSegmentID.section,
        id_floor: firstSegmentID.floor,
        id_apartment: firstSegmentID.apartment,
        id_vitrage_number: firstSegmentID.vitrageNumber,
        id_vitrage_name: firstSegmentID.vitrageName,
        id_vitrage_section: firstSegmentID.vitrageSection
      }

      // Try to update existing or create new
      const { data, error } = await placedVitrageStorage.update(
        placedVitrage.id,
        placedVitrageData
      )

      if (error || !data) {
        // If update failed, try to create
        const createResult = await placedVitrageStorage.create(placedVitrageData)
        if (createResult.error) {
          console.error('Error saving vitrage ID to Supabase:', createResult.error)
        } else {
          console.log('✅ Vitrage ID saved to Supabase')
        }
      } else {
        console.log('✅ Vitrage ID updated in Supabase')
      }
    }

    // Update local state
    updateCurrentPlan(plan => ({
      ...plan,
      placedVitrages: plan.placedVitrages.map(v =>
        v.id === selectedItem ? {
          ...v,
          segmentIDs: segmentIDsTemp
        } : v
      )
    }))

    setShowVitrageIDDialog(false)
  }

  // Generate full ID string
  const generateFullID = (id: VitrageID): string => {
    const parts = [
      id.object,
      id.corpus,
      id.section,
      id.floor,
      id.apartment,
      id.vitrageNumber,
      id.vitrageName,
      id.vitrageSection
    ].filter(p => p) // Remove empty parts

    return parts.join('-')
  }

  // If defect tracking is open, render DefectWorkspace
  if (selectedVitrageForDefect) {
    return (
      <DefectWorkspace
        vitrage={selectedVitrageForDefect}
        onBack={() => {
          setSelectedVitrageForDefect(null)
          // Force canvas redraw after closing defect tracking
          setTimeout(() => draw(), 0)
        }}
        onSaveAndBack={() => {
          setSelectedVitrageForDefect(null)
          // Force canvas redraw after closing defect tracking
          setTimeout(() => draw(), 0)
        }}
        availableDefects={defectData.availableDefects}
        segmentDefectsData={defectData.segmentDefectsData}
        loadSegmentData={defectData.loadSegmentData}
        saveSegmentData={defectData.saveSegmentData}
        addNewDefect={defectData.addNewDefect}
      />
    )
  }

  return (
    <div className="floor-plan-editor">
      <div className="editor-toolbar compact-toolbar">
        {/* Plan Actions Dropdown */}
        <div className="filter-group">
          <label className="filter-label">План:</label>
          <select
            className="dropdown-select plan-actions"
            onChange={(e) => {
              const action = e.target.value
              if (action === 'open') setShowPlanSelector(true)
              else if (action === 'new') {
                if (!selectedObject?.id) {
                  alert('Пожалуйста, выберите объект для создания планов этажей')
                } else {
                  setShowNewPlanDialog(true)
                }
              }
              else if (action === 'save' && currentPlan) saveCurrentPlan()
              else if (action === 'duplicate' && currentPlan) openDuplicatePlanDialog(currentPlan)
              e.target.value = '' // Reset selection
            }}
            value=""
          >
            <option value="open">📂 Открыть план</option>
            <option value="new">📋 Новый план</option>
            {currentPlan && <option value="save">💾 Сохранить</option>}
            {currentPlan && <option value="duplicate">📋 Дублировать план</option>}
          </select>
        </div>

        {/* Filters */}
        <div className="compact-filters">
          <div className="filter-group">
            <label className="filter-label">Корпус:</label>
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
          </div>

          <div className="filter-group">
            <label className="filter-label">Секция:</label>
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
          </div>

          <div className="filter-group">
            <label className="filter-label">Этаж:</label>
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
          </div>

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
            <div className="filter-group">
              <label className="filter-label">Подложка:</label>
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
                  console.log('Action selected:', action)

                  if (action === 'import') {
                    console.log('Trying to click file input:', fileInputRef.current)
                    if (fileInputRef.current) {
                      fileInputRef.current.click()
                    }
                  } else if (action === 'delete') {
                    removeBackground()
                  }

                  // Reset selection immediately
                  e.target.value = ''
                }}
                value=""
              >
                <option value="" disabled>📄 Подложка</option>
                <option value="import">📄 Импорт плана этажа</option>
                {currentPlan.backgroundImage && <option value="delete">❌ Удалить подложку</option>}
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

            {/* Add Vitrage Action */}
            <div className="filter-group">
              <label className="filter-label">Витражи:</label>
              <button
                className="dropdown-select vitrage-add-btn"
                onClick={() => setShowVitrageSelector(true)}
                title="Добавить витраж на план"
              >
                🪟 Добавить витраж
              </button>
            </div>

            {/* Reset Zoom Button */}
            {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
              <div className="filter-group">
                <label className="filter-label">Масштаб:</label>
                <button
                  className="dropdown-select zoom-reset-btn"
                  onClick={resetZoom}
                  title="Сбросить масштаб (100%)"
                >
                  🎯 Сброс
                </button>
              </div>
            )}

          </>
        )}

        {/* Save Status Indicator - moved to the far right */}
        {currentPlan && (
          <div className="save-status-container">
            {saveStatus === 'saving' && (
              <span className="save-status saving">💾 Сохраняется...</span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="save-status unsaved">⚠️ Не сохранено</span>
            )}
            {saveStatus === 'saved' && (
              <span className="save-status saved">✅ Сохранено</span>
            )}
          </div>
        )}
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          {currentPlan && (
            <>
              <div className="sidebar-section">
                <h3>Свойства плана</h3>
                <div className="properties">
                  <div>Название: {currentPlan.name}</div>
                  <div>Корпус: {currentPlan.corpus || currentPlan.buildingName || 'Не указан'}</div>
                  <div>Секция: {currentPlan.section || 'Не указана'}</div>
                  <div>Этаж: {currentPlan.floor}</div>
                  <div>Витражей: {currentPlan.placedVitrages.length}</div>
                  <div style={{fontSize: '11px', color: '#000000', marginTop: '4px'}}>
                    Обновлен: {new Date(currentPlan.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                <div className="plan-management-actions" style={{marginTop: '12px', display: 'flex', gap: '8px'}}>
                  <button
                    className="plan-action-btn duplicate"
                    onClick={() => openDuplicatePlanDialog(currentPlan)}
                    title="Дублировать план"
                    style={{flex: 1, padding: '8px 12px', fontSize: '12px'}}
                  >
                    📋 Дублировать
                  </button>
                  <button
                    className="plan-action-btn delete"
                    onClick={() => deletePlan(currentPlan)}
                    title="Удалить план"
                    style={{flex: 1, padding: '8px 12px', fontSize: '12px'}}
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>

              {selectedItem && (
                <div className="sidebar-section">
                  <h3>Информация о витраже</h3>
                  <div className="properties">
                    {(() => {
                      const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
                      const vitrage = placedVitrage && savedVitrages.find(v => v.id === placedVitrage.vitrageId)
                      if (vitrage && placedVitrage) {
                        return (
                          <>
                            <div>Название: {vitrage.name}</div>
                            <div>Размер: {vitrage.totalWidth}×{vitrage.totalHeight}мм</div>
                            <div style={{marginTop: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)'}}>
                              Масштаб: {Math.round(placedVitrage.scale * 100)}%
                            </div>
                            <div style={{marginTop: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)'}}>
                              Секций: {vitrage.rows} × {vitrage.cols} = {vitrage.rows * vitrage.cols}
                            </div>
                            {placedVitrage.segmentIDs && Object.keys(placedVitrage.segmentIDs).length > 0 && (
                              <div style={{marginTop: '8px', fontSize: '12px', color: 'rgba(76, 175, 80, 0.9)'}}>
                                ID задан для {Object.keys(placedVitrage.segmentIDs).length} из {vitrage.rows * vitrage.cols} секций
                              </div>
                            )}
                            <div style={{marginTop: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic'}}>
                              Shift + колесико мыши для масштабирования
                            </div>
                            <button
                              className="secondary"
                              style={{marginTop: '12px', width: '100%'}}
                              onClick={openVitrageIDDialog}
                            >
                              {placedVitrage.segmentIDs && Object.keys(placedVitrage.segmentIDs).length > 0 ? '✏️ Изменить ID секций' : '🆔 Задать ID секций'}
                            </button>
                            <button
                              className="secondary"
                              style={{
                                marginTop: '8px',
                                width: '100%',
                                background: (placedVitrage.segmentIDs && Object.keys(placedVitrage.segmentIDs).length === vitrage.rows * vitrage.cols)
                                  ? 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
                                  : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                                color: '#fff',
                                cursor: (placedVitrage.segmentIDs && Object.keys(placedVitrage.segmentIDs).length === vitrage.rows * vitrage.cols)
                                  ? 'pointer'
                                  : 'not-allowed',
                                opacity: (placedVitrage.segmentIDs && Object.keys(placedVitrage.segmentIDs).length === vitrage.rows * vitrage.cols)
                                  ? 1
                                  : 0.6
                              }}
                              onClick={openDefectTracking}
                            >
                              📋 Создать дефектовку
                              {placedVitrage.segmentIDs && Object.keys(placedVitrage.segmentIDs).length < vitrage.rows * vitrage.cols && (
                                <span style={{display: 'block', fontSize: '11px', marginTop: '4px', opacity: 0.9}}>
                                  (ID: {placedVitrage.segmentIDs ? Object.keys(placedVitrage.segmentIDs).length : 0}/{vitrage.rows * vitrage.cols})
                                </span>
                              )}
                            </button>
                            <button
                              className="secondary"
                              style={{marginTop: '8px', width: '100%'}}
                              onClick={() => {
                                updateCurrentPlan(plan => ({
                                  ...plan,
                                  placedVitrages: plan.placedVitrages.map(v =>
                                    v.id === selectedItem ? {
                                      ...v,
                                      rotation: (v.rotation + 90) % 360
                                    } : v
                                  )
                                }))
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
              {savedPlans.length === 0 ? (
                <>
                  <h3>Создайте новый план этажа</h3>
                  <p>Нажмите "Новый план" для начала работы</p>
                </>
              ) : filteredPlans.length === 0 ? (
                <>
                  <h3>Планы не найдены</h3>
                  <p>Измените фильтры или создайте новый план</p>
                </>
              ) : (
                <>
                  <h3>Выберите план для работы</h3>
                  <p>Найдено планов: {filteredPlans.length}. Используйте фильтры для выбора нужного плана.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Plan Dialog */}
      {showNewPlanDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать новый план этажа</h3>
            <div className="form-group">
              <label>Название плана:</label>
              <input
                type="text"
                value={newPlanData.name}
                onChange={(e) => setNewPlanData({...newPlanData, name: e.target.value})}
                placeholder="План 1 этажа"
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

      {/* Duplicate Plan Dialog */}
      {showDuplicatePlanDialog && planToDuplicate && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Дублировать план этажа</h3>
            <p style={{marginBottom: '16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px'}}>
              Создание копии плана "{planToDuplicate.name}"
            </p>
            <div className="form-group">
              <label>Название плана:</label>
              <input
                type="text"
                value={duplicatePlanData.name}
                onChange={(e) => setDuplicatePlanData({...duplicatePlanData, name: e.target.value})}
                placeholder="План 2 этажа"
              />
            </div>
            <div className="form-group">
              <label>Корпус:</label>
              <input
                type="text"
                value={duplicatePlanData.corpus}
                onChange={(e) => setDuplicatePlanData({...duplicatePlanData, corpus: e.target.value})}
                placeholder="Корпус А"
              />
            </div>
            <div className="form-group">
              <label>Секция:</label>
              <input
                type="text"
                value={duplicatePlanData.section}
                onChange={(e) => setDuplicatePlanData({...duplicatePlanData, section: e.target.value})}
                placeholder="Секция 1"
              />
            </div>
            <div className="form-group">
              <label>Номер этажа:</label>
              <input
                type="number"
                value={duplicatePlanData.floor}
                onChange={(e) => setDuplicatePlanData({...duplicatePlanData, floor: parseInt(e.target.value)})}
                min="1"
              />
            </div>
            <div style={{marginTop: '16px', padding: '12px', background: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px', border: '1px solid rgba(33, 150, 243, 0.3)'}}>
              <div style={{fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px'}}>
                <strong>Что будет скопировано:</strong>
              </div>
              <div style={{fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)'}}>
                • Все размещенные витражи ({planToDuplicate.placedVitrages.length} шт.)<br/>
                • Фоновое изображение плана<br/>
                • Настройки масштаба и прозрачности<br/>
                • Стены и комнаты (если есть)
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => {
                  setShowDuplicatePlanDialog(false)
                  setPlanToDuplicate(null)
                  setDuplicatePlanData({ name: '', corpus: '', section: '', floor: 1 })
                }}
              >
                Отмена
              </button>
              <button
                className="primary"
                onClick={createDuplicatePlan}
                disabled={!duplicatePlanData.name || !duplicatePlanData.corpus || !duplicatePlanData.section}
              >
                Создать копию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selector Modal */}
      {showPlanSelector && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Выберите план этажа</h3>
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
                    <option value="" disabled>Выберите план...</option>
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
                <p style={{marginBottom: '16px'}}>Нет сохраненных планов</p>
                <p style={{fontSize: '14px'}}>
                  Создайте новый план для начала работы
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
            <h3 style={{flexShrink: 0}}>Выберите витраж со страницы "Типовые витражи"</h3>
            {savedVitrages.length > 0 ? (
              <div className="modal-content-scroll">
                <p style={{marginBottom: '16px'}}>
                  Выберите витраж из базы данных типовых витражей для размещения на плане этажа
                </p>

                {/* Search input */}
                <div style={{marginBottom: '20px'}}>
                  <input
                    type="text"
                    placeholder="Поиск по названию витража..."
                    value={vitrageSearchQuery}
                    onChange={(e) => setVitrageSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                  {vitrageSearchQuery && (
                    <div style={{marginTop: '8px', fontSize: '13px', color: '#666'}}>
                      Найдено: {savedVitrages.filter(v =>
                        v.name.toLowerCase().includes(vitrageSearchQuery.toLowerCase())
                      ).length} витражей
                    </div>
                  )}
                </div>

                <div className="vitrage-grid">
                  {savedVitrages
                    .filter(vitrage =>
                      vitrage.name.toLowerCase().includes(vitrageSearchQuery.toLowerCase())
                    )
                    .map(vitrage => (
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
                        <div style={{marginTop: '8px', fontSize: '11px', opacity: 0.7}}>
                          Создан: {new Date(vitrage.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{padding: '40px', textAlign: 'center'}}>
                <p style={{marginBottom: '16px', fontSize: '16px', fontWeight: '600'}}>
                  В базе данных нет типовых витражей
                </p>
                <p style={{fontSize: '14px', opacity: 0.8}}>
                  Перейдите на страницу "Типовые витражи" или "Конструктор витражей" для создания витражей.<br/>
                  Витражи автоматически сохраняются в единую базу данных и будут доступны здесь.
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button className="secondary" onClick={() => {
                setShowVitrageSelector(false)
                setVitrageSearchQuery('')
              }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vitrage ID Dialog */}
      {showVitrageIDDialog && selectedItem && currentPlan && (() => {
        const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
        const vitrage = placedVitrage && savedVitrages.find(v => v.id === placedVitrage.vitrageId)
        if (!vitrage || !placedVitrage) return null

        return (
          <div className="modal-overlay">
            <div className="modal large" style={{maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflowY: 'auto'}}>
              <h3 style={{color: '#000'}}>Настройка ID секций витража: {vitrage.name}</h3>

              <div style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
              }}>
                <p style={{
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: '700',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}>
                  ВИД СНАРУЖИ (по КМ, КМД)
                </p>
              </div>

              <p style={{marginBottom: '16px', color: '#000', fontSize: '14px'}}>
                Кликните на секцию для задания ID. Всего секций: {vitrage.rows} × {vitrage.cols} = {vitrage.rows * vitrage.cols}
              </p>

              <div style={{display: 'flex', gap: '20px', flex: '1 1 auto', overflow: 'hidden', minHeight: '400px'}}>
                {/* Left: Vitrage visualization */}
                <div style={{flex: '1', display: 'flex', flexDirection: 'column', minWidth: '400px'}}>
                  <h4 style={{marginBottom: '12px', fontSize: '14px', color: '#000'}}>Визуализация витража</h4>
                  <div style={{
                    flex: 1,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'grid',
                    gridTemplateRows: `repeat(${vitrage.rows}, 1fr)`,
                    gap: '4px',
                    minHeight: '300px'
                  }}>
                    {Array.from({ length: vitrage.rows }).map((_, rowIndex) => (
                      <div key={rowIndex} style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${vitrage.cols}, 1fr)`,
                        gap: '4px'
                      }}>
                        {Array.from({ length: vitrage.cols }).map((_, colIndex) => {
                          const segmentId = `segment-${rowIndex}-${colIndex}`
                          const hasID = !!segmentIDsTemp[segmentId]
                          const isSelected = selectedSegmentForID === segmentId

                          // Sequential numbering: left to right, top to bottom
                          const segmentNumber = rowIndex * vitrage.cols + colIndex + 1

                          return (
                            <div
                              key={colIndex}
                              onClick={() => selectSegmentForID(segmentId)}
                              style={{
                                border: isSelected ? '3px solid #4CAF50' : '2px solid #000',
                                borderRadius: '4px',
                                background: isSelected ? 'rgba(76, 175, 80, 0.3)' : hasID ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                transition: 'all 0.2s',
                                minHeight: '60px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isSelected ? 'rgba(76, 175, 80, 0.4)' : 'rgba(76, 175, 80, 0.2)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isSelected ? 'rgba(76, 175, 80, 0.3)' : hasID ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.1)'
                              }}
                            >
                              <div style={{fontSize: '14px', color: '#000', fontWeight: 'bold'}}>
                                {segmentNumber}
                              </div>
                              {hasID && (
                                <div style={{fontSize: '9px', color: '#000', marginTop: '4px', textAlign: 'center', wordBreak: 'break-all'}}>
                                  ✓ ID
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: ID form */}
                <div style={{flex: '1', display: 'flex', flexDirection: 'column', minWidth: '400px'}}>
                  {selectedSegmentForID ? (
                    <>
                      <h4 style={{marginBottom: '12px', fontSize: '14px', color: '#000'}}>
                        ID для секции {(() => {
                          const parts = selectedSegmentForID.split('-')
                          const row = parseInt(parts[1])
                          const col = parseInt(parts[2])
                          return row * vitrage.cols + col + 1
                        })()}
                      </h4>

                      <div style={{flex: 1, overflowY: 'auto', paddingRight: '8px'}}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '12px'}}>
                          <div className="form-group">
                            <label>1. Объект:</label>
                            <input
                              type="text"
                              list="objects-list"
                              value={vitrageIDData.object}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, object: e.target.value})}
                              placeholder="Зил18, Примавера14"
                            />
                            <datalist id="objects-list">
                              {idOptions.objects.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>2. Корпус:</label>
                            <input
                              type="text"
                              list="corpuses-list"
                              value={vitrageIDData.corpus}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, corpus: e.target.value})}
                              placeholder="А, Б, 1"
                            />
                            <datalist id="corpuses-list">
                              {idOptions.corpuses.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>3. Секция:</label>
                            <input
                              type="text"
                              list="sections-list"
                              value={vitrageIDData.section}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, section: e.target.value})}
                              placeholder="1, 2, 3"
                            />
                            <datalist id="sections-list">
                              {idOptions.sections.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>4. Этаж:</label>
                            <input
                              type="text"
                              list="floors-list"
                              value={vitrageIDData.floor}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, floor: e.target.value})}
                              placeholder="1, 2, 3"
                            />
                            <datalist id="floors-list">
                              {idOptions.floors.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>5. Квартира:</label>
                            <input
                              type="text"
                              list="apartments-list"
                              value={vitrageIDData.apartment}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, apartment: e.target.value})}
                              placeholder="1, 2, 101"
                            />
                            <datalist id="apartments-list">
                              {idOptions.apartments.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>6. Номер витража:</label>
                            <input
                              type="text"
                              list="vitrage-numbers-list"
                              value={vitrageIDData.vitrageNumber}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, vitrageNumber: e.target.value})}
                              placeholder="1, 2, 3"
                            />
                            <datalist id="vitrage-numbers-list">
                              {idOptions.vitrageNumbers.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>7. Название витража:</label>
                            <input
                              type="text"
                              list="vitrage-names-list"
                              value={vitrageIDData.vitrageName}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, vitrageName: e.target.value})}
                              placeholder="В1, Окно, Дверь"
                            />
                            <datalist id="vitrage-names-list">
                              {idOptions.vitrageNames.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>

                          <div className="form-group">
                            <label>8. Секция витража:</label>
                            <input
                              type="text"
                              list="vitrage-sections-list"
                              value={vitrageIDData.vitrageSection}
                              onChange={(e) => setVitrageIDData({...vitrageIDData, vitrageSection: e.target.value})}
                              placeholder="A, B, 1"
                            />
                            <datalist id="vitrage-sections-list">
                              {idOptions.vitrageSections.map(opt => <option key={opt} value={opt} />)}
                            </datalist>
                          </div>
                        </div>

                        {/* Preview of generated ID */}
                        <div style={{
                          padding: '12px',
                          background: 'rgba(33, 150, 243, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(33, 150, 243, 0.3)',
                          marginTop: '16px'
                        }}>
                          <div style={{fontSize: '11px', color: '#000', marginBottom: '6px'}}>
                            Предварительный просмотр ID:
                          </div>
                          <div style={{fontSize: '13px', color: '#000', fontWeight: 'bold', wordBreak: 'break-all'}}>
                            {generateFullID(vitrageIDData) || '(пусто)'}
                          </div>
                        </div>

                        <button
                          className="primary"
                          onClick={saveSegmentID}
                          style={{width: '100%', marginTop: '16px'}}
                        >
                          Сохранить ID для секции
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      textAlign: 'center',
                      padding: '40px'
                    }}>
                      <div>
                        <div style={{fontSize: '48px', marginBottom: '16px'}}>👆</div>
                        <div style={{fontSize: '16px'}}>Выберите секцию слева<br/>для настройки ID</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions" style={{marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px'}}>
                <button
                  className="secondary"
                  onClick={() => setShowVitrageIDDialog(false)}
                >
                  Отмена
                </button>
                <button
                  className="primary"
                  onClick={saveAllSegmentIDs}
                >
                  Завершить настройку ID
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}