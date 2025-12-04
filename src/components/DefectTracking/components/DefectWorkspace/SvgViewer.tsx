import type { VitrageItem } from '../../types'

interface SvgViewerProps {
  vitrage: VitrageItem
  zoom: number
  pan: { x: number; y: number }
  isPanning: boolean
  svgContainerRef: React.RefObject<HTMLDivElement>
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

export function SvgViewer({
  vitrage,
  zoom,
  pan,
  isPanning,
  svgContainerRef,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp
}: SvgViewerProps) {
  return (
    <div
      className="grid-visualization-workspace"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8f9fa'
      }}
    >
      {vitrage.svgDrawing ? (
        // Используем сохраненный SVG из Визуализатора
        <div
          ref={svgContainerRef}
          dangerouslySetInnerHTML={{ __html: vitrage.svgDrawing }}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        />
      ) : (
        // Если SVG не сохранен, показываем сообщение
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Отрисовка недоступна</p>
          <p style={{ fontSize: '14px' }}>Витраж был создан в старой версии и не содержит данных отрисовки.</p>
          <p style={{ fontSize: '14px' }}>Пересоздайте витраж в Конструкторе или Визуализаторе для просмотра отрисовки.</p>
        </div>
      )}
    </div>
  )
}
