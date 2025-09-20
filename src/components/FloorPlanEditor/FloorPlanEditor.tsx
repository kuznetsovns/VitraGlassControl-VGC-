import { useState, useRef, useEffect, useCallback } from 'react'
import './FloorPlanEditor.css'

// Re-define VitrageGrid interface locally since it's not exported from GraphicsEditor
interface VitrageGrid {
  id: string
  name: string
  rows: number
  cols: number
  segments: any[] // Simplified for floor plan usage
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

export interface FloorPlan {
  id: string
  name: string
  buildingName: string
  floor: number
  walls: Wall[]
  rooms: Room[]
  placedVitrages: PlacedVitrage[]
  scale: number // mm per pixel
  backgroundImage?: string // Base64 image data
  backgroundOpacity?: number
  createdAt: Date
  updatedAt: Date
}

interface FloorPlanEditorProps {
  width?: number
  height?: number
}

type Tool = 'select' | 'wall' | 'room' | 'vitrage' | 'move' | 'delete'

export default function FloorPlanEditor({ width = 1000, height = 700 }: FloorPlanEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Editor state
  const [currentTool, setCurrentTool] = useState<Tool>('select')
  const [currentPlan, setCurrentPlan] = useState<FloorPlan | null>(null)
  const [savedPlans, setSavedPlans] = useState<FloorPlan[]>([])
  const [savedVitrages, setSavedVitrages] = useState<VitrageGrid[]>([])
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null)
  
  // UI state
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false)
  const [showVitrageSelector, setShowVitrageSelector] = useState(false)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3)
  const [backgroundFitMode, setBackgroundFitMode] = useState<'contain' | 'cover'>('contain')
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    buildingName: '',
    floor: 1
  })
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to load vitrages from specification storage
  const loadVitragesFromStorage = useCallback(() => {
    const vitrages = localStorage.getItem('saved-vitrages')
    if (vitrages) {
      try {
        const parsed = JSON.parse(vitrages)
        setSavedVitrages(parsed.map((v: any) => ({
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
    const plans = localStorage.getItem('floorPlans')
    if (plans) {
      setSavedPlans(JSON.parse(plans))
    }
    
    // Load vitrages from VitrageSpecification storage
    loadVitragesFromStorage()
  }, [loadVitragesFromStorage])
  
  // Reload vitrages when selector opens
  useEffect(() => {
    if (showVitrageSelector) {
      loadVitragesFromStorage()
    }
  }, [showVitrageSelector, loadVitragesFromStorage])

  // Save plans to localStorage
  const savePlansToStorage = useCallback((plans: FloorPlan[]) => {
    localStorage.setItem('floorPlans', JSON.stringify(plans))
    setSavedPlans(plans)
  }, [])

  // Create new floor plan
  const createNewPlan = () => {
    const newPlan: FloorPlan = {
      id: Date.now().toString(),
      name: newPlanData.name,
      buildingName: newPlanData.buildingName,
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
    setNewPlanData({ name: '', buildingName: '', floor: 1 })
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
  const loadPlan = (plan: FloorPlan) => {
    setCurrentPlan(plan)
  }

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentPlan) return
    
    const pos = getMousePos(e)
    
    if (currentTool === 'wall') {
      setIsDrawing(true)
      setStartPoint(pos)
    } else if (currentTool === 'select' || currentTool === 'move') {
      // Check if clicking on a vitrage
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
    } else if (currentTool === 'delete' && selectedItem) {
      // Delete selected vitrage
      const updatedVitrages = currentPlan.placedVitrages.filter(v => v.id !== selectedItem)
      setCurrentPlan({
        ...currentPlan,
        placedVitrages: updatedVitrages
      })
      setSelectedItem(null)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!currentPlan) return
    
    const pos = getMousePos(e)
    
    if (isDrawing && currentTool === 'wall' && startPoint) {
      // Redraw canvas with preview line
      draw()
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(startPoint.x, startPoint.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    } else if (selectedItem && dragOffset && currentTool === 'move') {
      // Move selected vitrage
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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!currentPlan) return
    
    const pos = getMousePos(e)
    
    if (isDrawing && currentTool === 'wall' && startPoint) {
      // Create new wall
      const newWall: Wall = {
        id: Date.now().toString(),
        x1: startPoint.x,
        y1: startPoint.y,
        x2: pos.x,
        y2: pos.y,
        thickness: 200, // 200mm default
        type: 'exterior'
      }
      
      setCurrentPlan({
        ...currentPlan,
        walls: [...currentPlan.walls, newWall]
      })
    }
    
    setIsDrawing(false)
    setStartPoint(null)
    setDragOffset(null)
  }

  // Place vitrage from selector
  const placeVitrage = (vitrageGrid: VitrageGrid) => {
    if (!currentPlan) return
    
    const newPlacedVitrage: PlacedVitrage = {
      id: Date.now().toString(),
      vitrageId: vitrageGrid.id,
      x: 100,
      y: 100,
      rotation: 0,
      scale: 0.5 // Scale down for floor plan view
    }
    
    setCurrentPlan({
      ...currentPlan,
      placedVitrages: [...currentPlan.placedVitrages, newPlacedVitrage]
    })
    
    setShowVitrageSelector(false)
    setCurrentTool('move')
  }

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !currentPlan) return

    // Clear canvas
    ctx.fillStyle = '#f8f8f8'
    ctx.fillRect(0, 0, width, height)

    // Draw background image if exists
    if (currentPlan.backgroundImage) {
      const img = new Image()
      img.onload = () => {
        ctx.save()
        ctx.globalAlpha = currentPlan.backgroundOpacity || backgroundOpacity
        
        // Calculate scaling based on fit mode
        const imgAspectRatio = img.width / img.height
        const canvasAspectRatio = width / height
        
        let drawWidth = width
        let drawHeight = height
        let offsetX = 0
        let offsetY = 0
        
        if (backgroundFitMode === 'contain') {
          // Fit entire image within canvas (may have letterboxing)
          if (imgAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas aspect ratio
            drawWidth = width
            drawHeight = width / imgAspectRatio
            offsetY = (height - drawHeight) / 2
          } else {
            // Image is taller than canvas aspect ratio
            drawHeight = height
            drawWidth = height * imgAspectRatio
            offsetX = (width - drawWidth) / 2
          }
        } else {
          // Cover mode - fill entire canvas (may crop image)
          if (imgAspectRatio > canvasAspectRatio) {
            // Image is wider - fit height and crop width
            drawHeight = height
            drawWidth = height * imgAspectRatio
            offsetX = (width - drawWidth) / 2
          } else {
            // Image is taller - fit width and crop height
            drawWidth = width
            drawHeight = width / imgAspectRatio
            offsetY = (height - drawHeight) / 2
          }
        }
        
        // Draw image centered and scaled
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
        ctx.restore()
        
        // Redraw everything on top of background
        drawForeground()
      }
      img.src = currentPlan.backgroundImage
    } else {
      drawForeground()
    }
    
    function drawForeground() {
      // Draw grid
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw walls
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 8
    currentPlan.walls.forEach(wall => {
      ctx.beginPath()
      ctx.moveTo(wall.x1, wall.y1)
      ctx.lineTo(wall.x2, wall.y2)
      ctx.stroke()
    })

    // Draw placed vitrages
    currentPlan.placedVitrages.forEach(placedVitrage => {
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
    }
  }, [currentPlan, savedVitrages, selectedItem, width, height, backgroundOpacity, backgroundFitMode])

  // Redraw on state changes
  useEffect(() => {
    draw()
  }, [draw])
  
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
    <div className="floor-plan-editor">
      <div className="editor-toolbar">
        <div className="toolbar-section">
          <button 
            className={!currentPlan ? 'primary' : 'secondary'}
            onClick={() => setShowNewPlanDialog(true)}
          >
            <span className="icon">📋</span>
            <span>Новый план</span>
          </button>
          
          {currentPlan && (
            <button className="secondary" onClick={saveCurrentPlan}>
              <span className="icon">💾</span>
              <span>Сохранить</span>
            </button>
          )}
        </div>

        {currentPlan && (
          <>
            <div className="toolbar-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="secondary"
                onClick={() => fileInputRef.current?.click()}
                title="Загрузить подложку"
              >
                <span className="icon">📄</span>
                <span>Подложка</span>
              </button>
              {currentPlan.backgroundImage && (
                <>
                  <button
                    className="secondary"
                    onClick={removeBackground}
                    title="Удалить подложку"
                  >
                    <span className="icon">❌</span>
                    <span>Удалить фон</span>
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px' }}>Прозрачность:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={currentPlan.backgroundOpacity || backgroundOpacity}
                      onChange={(e) => updateBackgroundOpacity(parseFloat(e.target.value))}
                      style={{ width: '100px' }}
                    />
                    <span style={{ fontSize: '12px' }}>
                      {Math.round((currentPlan.backgroundOpacity || backgroundOpacity) * 100)}%
                    </span>
                  </label>
                  <button
                    className="secondary"
                    onClick={() => setBackgroundFitMode(backgroundFitMode === 'contain' ? 'cover' : 'contain')}
                    title={backgroundFitMode === 'contain' ? 'Переключить на заполнение' : 'Переключить на вписывание'}
                    style={{ fontSize: '10px', padding: '6px 10px' }}
                  >
                    <span className="icon" style={{ fontSize: '14px' }}>
                      {backgroundFitMode === 'contain' ? '⬜' : '◼'}
                    </span>
                    <span>{backgroundFitMode === 'contain' ? 'Вписать' : 'Заполнить'}</span>
                  </button>
                </>
              )}
            </div>
            <div className="toolbar-section">
              <div className="tool-group">
              {(['select', 'wall', 'vitrage', 'move', 'delete'] as Tool[]).map(tool => (
                <button
                  key={tool}
                  className={currentTool === tool ? 'active' : 'secondary'}
                  onClick={() => {
                    setCurrentTool(tool)
                    if (tool === 'vitrage') {
                      setShowVitrageSelector(true)
                    }
                  }}
                  title={{
                    select: 'Выбор элементов',
                    wall: 'Рисование стен',
                    vitrage: 'Вставка витража',
                    move: 'Перемещение',
                    delete: 'Удаление'
                  }[tool]}
                >
                  <span className="icon">
                    {tool === 'select' && '🔍'}
                    {tool === 'wall' && '🧱'}
                    {tool === 'vitrage' && '🪟'}
                    {tool === 'move' && '↔️'}
                    {tool === 'delete' && '🗑️'}
                  </span>
                  <span className="label">
                    {tool === 'select' && 'Выбор'}
                    {tool === 'wall' && 'Стены'}
                    {tool === 'vitrage' && 'Витражи'}
                    {tool === 'move' && 'Перенос'}
                    {tool === 'delete' && 'Удалить'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          </>
        )}
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3>Сохраненные планы</h3>
            <div className="plans-list">
              {savedPlans.map(plan => (
                <div 
                  key={plan.id} 
                  className={`plan-item ${currentPlan?.id === plan.id ? 'active' : ''}`}
                  onClick={() => loadPlan(plan)}
                >
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-details">
                    {plan.buildingName} - Этаж {plan.floor}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentPlan && (
            <>
              <div className="sidebar-section">
                <h3>Свойства плана</h3>
                <div className="properties">
                  <div>Название: {currentPlan.name}</div>
                  <div>Здание: {currentPlan.buildingName}</div>
                  <div>Этаж: {currentPlan.floor}</div>
                  <div>Стен: {currentPlan.walls.length}</div>
                  <div>Витражей: {currentPlan.placedVitrages.length}</div>
                </div>
              </div>
              
              {selectedItem && (
                <div className="sidebar-section">
                  <h3>Выбранный витраж</h3>
                  <div className="properties">
                    {(() => {
                      const placedVitrage = currentPlan.placedVitrages.find(v => v.id === selectedItem)
                      const vitrage = placedVitrage && savedVitrages.find(v => v.id === placedVitrage.vitrageId)
                      if (vitrage) {
                        return (
                          <>
                            <div>Название: {vitrage.name}</div>
                            <div>Размер: {vitrage.totalWidth}×{vitrage.totalHeight}мм</div>
                            <div>Сетка: {vitrage.rows}×{vitrage.cols}</div>
                            <div>Поворот: {placedVitrage?.rotation}°</div>
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

        <div className="canvas-container">
          {currentPlan ? (
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          ) : (
            <div className="no-plan-message">
              <h3>Создайте новый план этажа</h3>
              <p>Нажмите "Новый план" для начала работы</p>
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
              <label>Название здания:</label>
              <input
                type="text"
                value={newPlanData.buildingName}
                onChange={(e) => setNewPlanData({...newPlanData, buildingName: e.target.value})}
                placeholder="Административное здание"
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
                disabled={!newPlanData.name || !newPlanData.buildingName}
              >
                Создать
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
                <p style={{marginBottom: '16px', color: '#666'}}>
                  Витражи загружаются из вкладки "Спецификация витражей"
                </p>
                <div className="vitrage-grid">
                  {savedVitrages.map(vitrage => (
                    <div 
                      key={vitrage.id} 
                      className="vitrage-card"
                      onClick={() => placeVitrage(vitrage)}
                    >
                      <div className="vitrage-preview">
                        <div className="vitrage-name">{vitrage.name}</div>
                        <div className="vitrage-size">
                          {vitrage.totalWidth}×{vitrage.totalHeight}мм
                        </div>
                        <div className="vitrage-grid-info">
                          {vitrage.rows}×{vitrage.cols} сегментов
                        </div>
                        <div style={{marginTop: '8px', fontSize: '11px', color: '#999'}}>
                          Создан: {new Date(vitrage.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
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