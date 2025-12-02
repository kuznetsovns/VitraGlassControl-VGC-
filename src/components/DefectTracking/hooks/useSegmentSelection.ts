import { useState, useEffect } from 'react'
import type { VitrageItem } from '../types'
import type { SegmentDefectData } from '../../../services/defectStorage'

export function useSegmentSelection(
  selectedVitrage: VitrageItem | null,
  svgContainerRef: React.RefObject<HTMLDivElement>,
  segmentDefectsData: Map<string, SegmentDefectData>
) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [showDefectPanel, setShowDefectPanel] = useState(false)

  // Обработка кликов по сегментам SVG
  useEffect(() => {
    if (!svgContainerRef.current || !selectedVitrage) return

    const handleSvgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('vitrage-segment')) {
        const segmentId = target.getAttribute('data-segment-id')
        if (segmentId) {
          handleSegmentClick(segmentId)
        }
      }
    }

    const container = svgContainerRef.current
    container.addEventListener('click', handleSvgClick)

    return () => {
      container.removeEventListener('click', handleSvgClick)
    }
  }, [selectedVitrage])

  // Визуальное выделение выбранного сегмента и отображение дефектов
  useEffect(() => {
    if (!svgContainerRef.current || !selectedVitrage) return

    // Убираем выделение со всех сегментов
    const allSegments = svgContainerRef.current.querySelectorAll('.vitrage-segment')
    allSegments.forEach(segment => {
      (segment as SVGRectElement).setAttribute('stroke', '#87ceeb')
      (segment as SVGRectElement).setAttribute('stroke-width', '2')
    })

    // Выделяем выбранный сегмент
    if (selectedSegmentId) {
      const selectedSegment = svgContainerRef.current.querySelector(`[data-segment-id="${selectedSegmentId}"]`)
      if (selectedSegment) {
        (selectedSegment as SVGRectElement).setAttribute('stroke', '#ff6b6b')
        (selectedSegment as SVGRectElement).setAttribute('stroke-width', '4')
      }
    }

    // Отображаем индикаторы дефектов на сегментах
    const svgElement = svgContainerRef.current.querySelector('svg')
    if (!svgElement) return

    // Удаляем старые индикаторы дефектов
    svgElement.querySelectorAll('.defect-indicator').forEach(el => el.remove())

    // Добавляем индикаторы для сегментов с дефектами
    allSegments.forEach(segment => {
      const segmentId = segment.getAttribute('data-segment-id')
      if (!segmentId) return

      const key = `${selectedVitrage.id}-${segmentId}`
      const defectData = segmentDefectsData.get(key)

      if (defectData && defectData.defects.length > 0) {
        const rect = segment as SVGRectElement
        const x = parseFloat(rect.getAttribute('x') || '0')
        const y = parseFloat(rect.getAttribute('y') || '0')

        // Создаем группу для индикатора
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        group.classList.add('defect-indicator')

        // Фон для текста дефектов
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        bgRect.setAttribute('x', (x + 5).toString())
        bgRect.setAttribute('y', (y + 5).toString())
        bgRect.setAttribute('rx', '4')
        bgRect.setAttribute('ry', '4')
        bgRect.setAttribute('fill', 'rgba(255, 68, 68, 0.95)')
        bgRect.setAttribute('stroke', '#ffffff')
        bgRect.setAttribute('stroke-width', '1.5')

        // Создаем текстовые элементы для каждого дефекта
        const lineHeight = 16
        const padding = 6
        let maxTextWidth = 0

        const textElements: SVGTextElement[] = []
        defectData.defects.forEach((defect, index) => {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
          text.setAttribute('x', (x + 5 + padding).toString())
          text.setAttribute('y', (y + 5 + padding + (index * lineHeight) + 12).toString())
          text.setAttribute('fill', '#ffffff')
          text.setAttribute('font-size', '11')
          text.setAttribute('font-weight', '600')
          text.setAttribute('pointer-events', 'none')
          text.textContent = `• ${defect}`

          textElements.push(text)

          // Временно добавляем текст для измерения ширины
          svgElement.appendChild(text)
          const bbox = text.getBBox()
          maxTextWidth = Math.max(maxTextWidth, bbox.width)
          svgElement.removeChild(text)
        })

        // Устанавливаем размеры фона
        const bgWidth = maxTextWidth + padding * 2
        const bgHeight = defectData.defects.length * lineHeight + padding * 2
        bgRect.setAttribute('width', bgWidth.toString())
        bgRect.setAttribute('height', bgHeight.toString())

        // Добавляем элементы в группу
        group.appendChild(bgRect)
        textElements.forEach(text => group.appendChild(text))

        svgElement.appendChild(group)
      }
    })
  }, [selectedSegmentId, selectedVitrage?.id, segmentDefectsData.size])

  const handleSegmentClick = (segmentId: string) => {
    setSelectedSegmentId(segmentId)
    setShowDefectPanel(true)
  }

  const handleCloseDefectPanel = () => {
    setSelectedSegmentId(null)
    setShowDefectPanel(false)
  }

  return {
    selectedSegmentId,
    showDefectPanel,
    handleSegmentClick,
    handleCloseDefectPanel
  }
}
