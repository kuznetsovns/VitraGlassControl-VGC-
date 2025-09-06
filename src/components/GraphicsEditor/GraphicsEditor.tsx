import { useState, useRef, useEffect, useCallback } from 'react'
import './GraphicsEditor.css'

export interface GlassUnit {
  id: string
  x: number
  y: number
  width: number
  height: number
  formula?: string
  label?: string
}

export interface Profile {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  type: 'horizontal' | 'vertical'
}

interface GraphicsEditorProps {
  width?: number
  height?: number
}

export default function GraphicsEditor({ width = 800, height = 600 }: GraphicsEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<'glass' | 'profile' | 'select'>('glass')
  const [glassUnits, setGlassUnits] = useState<GlassUnit[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  
  // Properties panel state
  const [showProperties, setShowProperties] = useState(false)
  const [selectedGlass, setSelectedGlass] = useState<GlassUnit | null>(null)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw glass units
    glassUnits.forEach(glass => {
      ctx.fillStyle = selectedItem === glass.id ? 'rgba(74, 144, 226, 0.3)' : 'rgba(135, 206, 235, 0.2)'
      ctx.strokeStyle = selectedItem === glass.id ? '#4a90e2' : '#87ceeb'
      ctx.lineWidth = 2
      
      ctx.fillRect(glass.x, glass.y, glass.width, glass.height)
      ctx.strokeRect(glass.x, glass.y, glass.width, glass.height)

      // Draw dimensions
      ctx.fillStyle = '#2c3e50'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      
      // Width dimension
      const centerX = glass.x + glass.width / 2
      const centerY = glass.y + glass.height / 2
      ctx.fillText(`${glass.width}мм`, centerX, glass.y - 5)
      
      // Height dimension
      ctx.save()
      ctx.translate(glass.x - 15, centerY)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(`${glass.height}мм`, 0, 0)
      ctx.restore()

      // Draw label if exists
      if (glass.label) {
        ctx.fillStyle = '#2c3e50'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(glass.label, centerX, centerY)
      }

      // Draw formula if exists
      if (glass.formula) {
        ctx.fillStyle = '#666'
        ctx.font = '10px Arial'
        ctx.fillText(`F: ${glass.formula}`, centerX, centerY + 15)
      }
    })

    // Draw profiles
    profiles.forEach(profile => {
      ctx.strokeStyle = selectedItem === profile.id ? '#d2691e' : '#8b4513'
      ctx.lineWidth = profile.width
      ctx.beginPath()
      ctx.moveTo(profile.x1, profile.y1)
      ctx.lineTo(profile.x2, profile.y2)
      ctx.stroke()
    })
  }, [width, height, glassUnits, profiles, selectedItem])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const findItemAt = (x: number, y: number) => {
    // Check glass units
    for (const glass of glassUnits) {
      if (x >= glass.x && x <= glass.x + glass.width && 
          y >= glass.y && y <= glass.y + glass.height) {
        return { type: 'glass', item: glass }
      }
    }
    
    // Check profiles (with some tolerance)
    for (const profile of profiles) {
      const dist = distanceToLine(x, y, profile.x1, profile.y1, profile.x2, profile.y2)
      if (dist <= profile.width / 2 + 5) {
        return { type: 'profile', item: profile }
      }
    }
    
    return null
  }

  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    if (lenSq !== 0) param = dot / lenSq

    let xx, yy
    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    if (currentTool === 'select') {
      const found = findItemAt(pos.x, pos.y)
      if (found) {
        setSelectedItem(found.item.id)
        if (found.type === 'glass') {
          setSelectedGlass(found.item as GlassUnit)
          setShowProperties(true)
          setDragOffset({
            x: pos.x - (found.item as GlassUnit).x,
            y: pos.y - (found.item as GlassUnit).y
          })
        }
      } else {
        setSelectedItem(null)
        setSelectedGlass(null)
        setShowProperties(false)
      }
      setIsDrawing(true)
    } else {
      setIsDrawing(true)
      setStartPoint(pos)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const pos = getMousePos(e)
    
    if (currentTool === 'select' && selectedItem && dragOffset) {
      // Move selected glass unit
      const glass = glassUnits.find(g => g.id === selectedItem)
      if (glass) {
        const newX = pos.x - dragOffset.x
        const newY = pos.y - dragOffset.y
        
        setGlassUnits(prev => prev.map(g => 
          g.id === selectedItem ? { ...g, x: newX, y: newY } : g
        ))
        setSelectedGlass(prev => prev ? { ...prev, x: newX, y: newY } : null)
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) {
      setIsDrawing(false)
      setDragOffset(null)
      return
    }

    const pos = getMousePos(e)
    
    if (currentTool === 'glass') {
      const width = Math.abs(pos.x - startPoint.x)
      const height = Math.abs(pos.y - startPoint.y)
      
      if (width > 10 && height > 10) {
        const newGlass: GlassUnit = {
          id: `glass-${Date.now()}`,
          x: Math.min(startPoint.x, pos.x),
          y: Math.min(startPoint.y, pos.y),
          width,
          height,
          label: `G${glassUnits.length + 1}`
        }
        setGlassUnits(prev => [...prev, newGlass])
      }
    } else if (currentTool === 'profile') {
      const length = Math.sqrt(
        Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2)
      )
      
      if (length > 20) {
        const newProfile: Profile = {
          id: `profile-${Date.now()}`,
          x1: startPoint.x,
          y1: startPoint.y,
          x2: pos.x,
          y2: pos.y,
          width: 8,
          type: Math.abs(pos.x - startPoint.x) > Math.abs(pos.y - startPoint.y) ? 'horizontal' : 'vertical'
        }
        setProfiles(prev => [...prev, newProfile])
      }
    }

    setIsDrawing(false)
    setStartPoint(null)
    setDragOffset(null)
  }

  const updateGlassProperties = (property: keyof GlassUnit, value: any) => {
    if (!selectedGlass) return
    
    const updatedGlass = { ...selectedGlass, [property]: value }
    setSelectedGlass(updatedGlass)
    
    setGlassUnits(prev => prev.map(g => 
      g.id === selectedGlass.id ? updatedGlass : g
    ))
  }

  const clearCanvas = () => {
    setGlassUnits([])
    setProfiles([])
    setSelectedItem(null)
    setSelectedGlass(null)
    setShowProperties(false)
  }

  return (
    <div className="graphics-editor">
      <div className="editor-toolbar">
        <div className="tool-group">
          <button 
            className={currentTool === 'select' ? 'active' : ''}
            onClick={() => setCurrentTool('select')}
            title="Выбрать"
          >
            🔍 Выбор
          </button>
          <button 
            className={currentTool === 'glass' ? 'active' : ''}
            onClick={() => setCurrentTool('glass')}
            title="Нарисовать стеклопакет"
          >
            🔷 Стеклопакет
          </button>
          <button 
            className={currentTool === 'profile' ? 'active' : ''}
            onClick={() => setCurrentTool('profile')}
            title="Нарисовать профиль"
          >
            📏 Профиль
          </button>
        </div>
        
        <div className="tool-group">
          <button onClick={clearCanvas} title="Очистить">
            🗑️ Очистить
          </button>
        </div>
      </div>

      <div className="editor-workspace">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="drawing-canvas"
        />

        {showProperties && selectedGlass && (
          <div className="properties-panel">
            <h3>Свойства стеклопакета</h3>
            
            <div className="property-group">
              <label>Ширина (мм):</label>
              <input
                type="number"
                value={selectedGlass.width}
                onChange={(e) => updateGlassProperties('width', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="property-group">
              <label>Высота (мм):</label>
              <input
                type="number"
                value={selectedGlass.height}
                onChange={(e) => updateGlassProperties('height', parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="property-group">
              <label>Обозначение:</label>
              <input
                type="text"
                value={selectedGlass.label || ''}
                onChange={(e) => updateGlassProperties('label', e.target.value)}
              />
            </div>
            
            <div className="property-group">
              <label>Формула:</label>
              <input
                type="text"
                value={selectedGlass.formula || ''}
                onChange={(e) => updateGlassProperties('formula', e.target.value)}
                placeholder="Например: 4М1-16-4М1"
              />
            </div>
            
            <button 
              className="close-properties"
              onClick={() => setShowProperties(false)}
            >
              Закрыть
            </button>
          </div>
        )}
      </div>

      <div className="editor-info">
        <div className="stats">
          Стеклопакетов: {glassUnits.length} | Профилей: {profiles.length}
        </div>
        <div className="instructions">
          {currentTool === 'glass' && 'Нажмите и протяните для создания стеклопакета'}
          {currentTool === 'profile' && 'Нажмите и протяните для создания профиля'}
          {currentTool === 'select' && 'Щелкните для выбора элемента'}
        </div>
      </div>
    </div>
  )
}