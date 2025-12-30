import { useEffect, useRef, useCallback } from 'react'
import type { VitrageItem } from '../../types'
import type { SegmentDefectData } from '../../../../services/defectStorage'

interface VitrageGridRendererProps {
  vitrage: VitrageItem
  zoom: number
  pan: { x: number; y: number }
  isPanning: boolean
  svgContainerRef: React.RefObject<HTMLDivElement>
  workspaceRef: React.RefObject<HTMLDivElement>
  segmentDefectsData: Map<string, SegmentDefectData>
  selectedSegmentId: string | null
  onSegmentClick: (segmentIndex: number) => void
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

export function VitrageGridRenderer({
  vitrage,
  zoom,
  pan,
  isPanning,
  svgContainerRef,
  workspaceRef,
  segmentDefectsData,
  selectedSegmentId,
  onSegmentClick,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp
}: VitrageGridRendererProps) {
  const overlayRef = useRef<SVGSVGElement>(null)

  // Проверяем есть ли дефекты у сегмента
  const getSegmentDefects = useCallback((segmentIndex: number): string[] => {
    // Проверяем segmentDefectsData (Map)
    const key = `${vitrage.id}-${segmentIndex}`
    const defectData = segmentDefectsData.get(key)
    if (defectData?.defects && defectData.defects.length > 0) {
      console.log(`🔍 Сегмент ${segmentIndex}: найдены дефекты в segmentDefectsData:`, defectData.defects)
      return defectData.defects
    }

    // Проверяем дефекты напрямую в витраже (из placed_vitrages)
    if (vitrage.segmentDefects) {
      const segmentKey = `segment-${segmentIndex}`
      const vitrageDefectData = vitrage.segmentDefects[segmentKey]
      if (vitrageDefectData?.defects && vitrageDefectData.defects.length > 0) {
        console.log(`🔍 Сегмент ${segmentIndex}: найдены дефекты в vitrage.segmentDefects:`, vitrageDefectData.defects)
        return vitrageDefectData.defects
      }
    }

    return []
  }, [vitrage.id, vitrage.segmentDefects, segmentDefectsData])

  // Проверяем статус сегмента (fixed = исправлен)
  const getSegmentStatus = useCallback((segmentIndex: number): 'ok' | 'defective' | 'fixed' | null => {
    // Проверяем в vitrage.segmentDefects (из placed_vitrages)
    if (vitrage.segmentDefects) {
      const segmentKey = `segment-${segmentIndex}`
      const vitrageDefectData = vitrage.segmentDefects[segmentKey]
      if (vitrageDefectData?.status) {
        return vitrageDefectData.status as 'ok' | 'defective' | 'fixed'
      }
    }
    return null
  }, [vitrage.segmentDefects])

  // Обработка кликов на сегменты через делегирование событий
  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element

    // Ищем элемент с data-segment-id (может быть сам target или родитель)
    let element: Element | null = target
    while (element && !element.getAttribute('data-segment-id')) {
      element = element.parentElement
      // Не выходим за пределы SVG
      if (element?.tagName === 'svg' || element?.tagName === 'DIV') {
        element = null
        break
      }
    }

    if (element) {
      const segmentId = element.getAttribute('data-segment-id')
      if (segmentId) {
        onSegmentClick(parseInt(segmentId))
      }
    }
  }, [onSegmentClick])

  // Подсветка выбранного сегмента, сегментов с дефектами и исправленных
  useEffect(() => {
    if (!svgContainerRef.current) return

    const svg = svgContainerRef.current.querySelector('svg')
    if (!svg) return

    // Сбрасываем все стили
    const allSegments = svg.querySelectorAll('[data-segment-id]')
    allSegments.forEach((segment) => {
      const rect = segment as SVGElement
      const segmentId = parseInt(rect.getAttribute('data-segment-id') || '0')
      const defects = getSegmentDefects(segmentId)
      const status = getSegmentStatus(segmentId)
      const hasDefects = defects.length > 0
      const isFixed = status === 'fixed' && !hasDefects
      const isSelected = selectedSegmentId === String(segmentId)

      // Убираем старые стили
      rect.style.removeProperty('stroke')
      rect.style.removeProperty('stroke-width')
      rect.style.removeProperty('fill')

      // Применяем новые стили в зависимости от состояния
      if (isSelected) {
        rect.setAttribute('stroke', '#0d47a1')
        rect.setAttribute('stroke-width', '4')
      } else if (hasDefects) {
        rect.setAttribute('stroke', '#c62828')
        rect.setAttribute('stroke-width', '3')
      } else if (isFixed) {
        rect.setAttribute('stroke', '#43a047')
        rect.setAttribute('stroke-width', '3')
      }
    })
  }, [selectedSegmentId, segmentDefectsData, vitrage.segmentDefects, svgContainerRef, getSegmentDefects, getSegmentStatus])

  // Получаем размеры SVG для оверлея с индикаторами дефектов
  const getSvgDimensions = () => {
    if (!vitrage.svgDrawing) return { width: 400, height: 300 }

    const match = vitrage.svgDrawing.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/)
    if (match) {
      return { width: parseFloat(match[1]), height: parseFloat(match[2]) }
    }
    return { width: 400, height: 300 }
  }

  // Рассчитываем позиции сегментов для оверлея дефектов
  const getSegmentPositions = () => {
    const positions: { segmentId: number; x: number; y: number; width: number; height: number; defects: string[]; status: 'ok' | 'defective' | 'fixed' | null }[] = []

    if (!vitrage.svgDrawing) return positions

    // Парсим позиции сегментов из сохранённого SVG (атрибуты могут быть в любом порядке)
    const rectRegex = /<rect[^>]*data-segment-id="(\d+)"[^>]*>/g
    let match

    while ((match = rectRegex.exec(vitrage.svgDrawing)) !== null) {
      const rectTag = match[0]
      const segmentId = parseInt(match[1])

      // Извлекаем атрибуты отдельно (они могут быть в любом порядке)
      const xMatch = rectTag.match(/\bx="([^"]+)"/)
      const yMatch = rectTag.match(/\by="([^"]+)"/)
      const widthMatch = rectTag.match(/\bwidth="([^"]+)"/)
      const heightMatch = rectTag.match(/\bheight="([^"]+)"/)

      if (xMatch && yMatch && widthMatch && heightMatch) {
        const defects = getSegmentDefects(segmentId)
        const status = getSegmentStatus(segmentId)

        positions.push({
          segmentId,
          x: parseFloat(xMatch[1]),
          y: parseFloat(yMatch[1]),
          width: parseFloat(widthMatch[1]),
          height: parseFloat(heightMatch[1]),
          defects,
          status
        })
      }
    }

    const fixedCount = positions.filter(p => p.status === 'fixed').length
    const defectCount = positions.filter(p => p.defects.length > 0).length
    console.log(`📍 Найдено ${positions.length} сегментов, с дефектами: ${defectCount}, исправлено: ${fixedCount}`)

    return positions
  }

  const svgDimensions = getSvgDimensions()
  const segmentPositions = getSegmentPositions()

  // Отладка: проверяем наличие svgDrawing и дефектов
  console.log(`🎨 VitrageGridRenderer: витраж "${vitrage.name}" (id: ${vitrage.id})`)
  console.log(`   svgDrawing:`, vitrage.svgDrawing ? `${vitrage.svgDrawing.length} символов` : 'отсутствует')
  console.log(`   vitrage.segmentDefects:`, vitrage.segmentDefects ? Object.keys(vitrage.segmentDefects) : 'нет')
  console.log(`   segmentDefectsData keys:`, Array.from(segmentDefectsData.keys()).filter(k => k.startsWith(vitrage.id)))

  // Если нет сохранённого SVG, показываем сообщение
  if (!vitrage.svgDrawing) {
    return (
      <div
        ref={workspaceRef}
        className="vitrage-editor-workspace"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px'
        }}
      >
        <div
          className="vitrage-editor-canvas"
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '40px',
            textAlign: 'center',
            color: '#6c757d'
          }}
        >
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Отрисовка недоступна</p>
          <p style={{ fontSize: '14px' }}>Витраж был создан в старой версии.</p>
          <p style={{ fontSize: '14px' }}>Пересоздайте витраж в Конструкторе для просмотра отрисовки.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={workspaceRef}
      className="vitrage-editor-workspace"
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
        padding: '24px',
        background: '#f5f5f5'
      }}
    >
      <div
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          position: 'relative'
        }}
      >
        {/* Оригинальный SVG из Конструктора */}
        <div
          ref={svgContainerRef}
          onClick={handleSvgClick}
          className="vitrage-editor-canvas"
          dangerouslySetInnerHTML={{ __html: vitrage.svgDrawing }}
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            padding: '32px',
            cursor: 'pointer'
          }}
        />

        {/* Оверлей с индикаторами дефектов и исправленных сегментов */}
        <svg
          ref={overlayRef}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          style={{
            position: 'absolute',
            top: '32px',
            left: '32px',
            width: `calc(100% - 64px)`,
            height: `calc(100% - 64px)`,
            pointerEvents: 'none'
          }}
        >
          {/* Исправленные сегменты - зелёная заливка и галочка */}
          {segmentPositions
            .filter(seg => seg.status === 'fixed' && seg.defects.length === 0)
            .map(seg => (
              <g key={`fixed-${seg.segmentId}`}>
                {/* Полупрозрачная зелёная заливка */}
                <rect
                  x={seg.x}
                  y={seg.y}
                  width={seg.width}
                  height={seg.height}
                  fill="rgba(67, 160, 71, 0.15)"
                  stroke="#43a047"
                  strokeWidth="2"
                />

                {/* Зелёный бейдж с галочкой в углу */}
                <circle
                  cx={seg.x + seg.width - 14}
                  cy={seg.y + 14}
                  r="14"
                  fill="#43a047"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <text
                  x={seg.x + seg.width - 14}
                  y={seg.y + 19}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#fff"
                >
                  ✓
                </text>

                {/* Текст "Исправлено" в центре */}
                <text
                  x={seg.x + seg.width / 2}
                  y={seg.y + seg.height / 2 + 5}
                  textAnchor="middle"
                  fontSize={Math.min(Math.max(seg.width / 10, 10), 16)}
                  fontWeight="600"
                  fill="#2e7d32"
                >
                  Исправлено
                </text>
              </g>
            ))}

          {/* Сегменты с дефектами - красная заливка */}
          {segmentPositions
            .filter(seg => seg.defects.length > 0)
            .map(seg => {
              // Сокращения для типов дефектов
              const defectAbbreviations: Record<string, string> = {
                'Царапины': 'Цар',
                'Сколы': 'Скол',
                'Трещины': 'Трещ',
                'Загрязнения': 'Загр',
                'Деформация': 'Деф',
                'Разгерметизация': 'Разг',
                'Запотевание': 'Зап',
                'Некачественный монтаж': 'Монт'
              }

              // Вычисляем размер шрифта в зависимости от размера сегмента
              const fontSize = Math.min(Math.max(seg.width / 12, 8), 14)
              const lineHeight = fontSize * 1.3

              return (
                <g key={`defect-${seg.segmentId}`}>
                  {/* Полупрозрачная красная заливка */}
                  <rect
                    x={seg.x}
                    y={seg.y}
                    width={seg.width}
                    height={seg.height}
                    fill="rgba(198, 40, 40, 0.15)"
                    stroke="none"
                  />

                  {/* Иконка предупреждения */}
                  <text
                    x={seg.x + 8}
                    y={seg.y + fontSize + 4}
                    fontSize={fontSize + 2}
                    fill="#c62828"
                  >
                    ⚠️
                  </text>

                  {/* Список дефектов */}
                  <text
                    x={seg.x + seg.width / 2}
                    y={seg.y + seg.height / 2 - (seg.defects.length > 2 ? lineHeight : 0)}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight="600"
                    fill="#c62828"
                  >
                    {seg.defects.length <= 3 ? (
                      seg.defects.map((defect, i) => (
                        <tspan
                          key={i}
                          x={seg.x + seg.width / 2}
                          dy={i === 0 ? 0 : lineHeight}
                        >
                          {defectAbbreviations[defect] || defect.substring(0, 6)}
                        </tspan>
                      ))
                    ) : (
                      <>
                        <tspan x={seg.x + seg.width / 2} dy={0}>
                          {defectAbbreviations[seg.defects[0]] || seg.defects[0].substring(0, 6)}
                        </tspan>
                        <tspan x={seg.x + seg.width / 2} dy={lineHeight}>
                          {defectAbbreviations[seg.defects[1]] || seg.defects[1].substring(0, 6)}
                        </tspan>
                        <tspan x={seg.x + seg.width / 2} dy={lineHeight}>
                          +{seg.defects.length - 2} ещё
                        </tspan>
                      </>
                    )}
                  </text>

                  {/* Красный бейдж с количеством дефектов в углу */}
                  <circle
                    cx={seg.x + seg.width - 14}
                    cy={seg.y + 14}
                    r="14"
                    fill="#c62828"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={seg.x + seg.width - 14}
                    y={seg.y + 19}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {seg.defects.length}
                  </text>
                </g>
              )
            })}
        </svg>
      </div>
    </div>
  )
}
