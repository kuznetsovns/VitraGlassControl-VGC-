import { useState, useEffect, useRef, useCallback } from 'react'

export function useCanvasControls(selectedVitrageId?: string) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  // Автоматическая подгонка масштаба витража под размер рабочего пространства
  useEffect(() => {
    if (!svgContainerRef.current || !selectedVitrageId) return

    // Небольшая задержка, чтобы SVG успел отрендериться
    const timer = setTimeout(() => {
      if (!svgContainerRef.current) return

      const svgElement = svgContainerRef.current.querySelector('svg')
      if (!svgElement) return

      // Получаем размеры SVG
      const svgWidth = parseFloat(svgElement.getAttribute('width') || '0')
      const svgHeight = parseFloat(svgElement.getAttribute('height') || '0')

      if (!svgWidth || !svgHeight) return

      // Получаем размеры рабочего пространства
      const workspace = svgContainerRef.current.parentElement
      if (!workspace) return

      const workspaceWidth = workspace.clientWidth
      const workspaceHeight = workspace.clientHeight

      // Вычисляем масштаб с отступами (90% от доступного пространства)
      const scaleX = (workspaceWidth * 0.9) / svgWidth
      const scaleY = (workspaceHeight * 0.9) / svgHeight
      const autoScale = Math.min(scaleX, scaleY, 1) // Не увеличиваем, только уменьшаем

      setZoom(autoScale)
      setPan({ x: 0, y: 0 })
    }, 100)

    return () => clearTimeout(timer)
  }, [selectedVitrageId])

  // Native wheel handler with passive: false to allow preventDefault
  const handleNativeWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5))
    }
  }, [])

  // Attach native wheel listener with passive: false
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    workspace.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => {
      workspace.removeEventListener('wheel', handleNativeWheel)
    }
  }, [handleNativeWheel])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // React wheel handler (for non-ctrl wheel events)
  const handleWheel = (_e: React.WheelEvent) => {
    // Ctrl+wheel is handled by native listener
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  return {
    zoom,
    pan,
    isPanning,
    svgContainerRef,
    workspaceRef,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleWheel,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp
  }
}
