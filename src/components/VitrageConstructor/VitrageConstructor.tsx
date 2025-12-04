import { useState, useRef, KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { vitrageStorage } from '../../services/vitrageStorage'
import './VitrageConstructor.css'

interface VitrageConstructorProps {
  selectedObject?: { id: string; name: string } | null
}

interface VitrageConfig {
  marking: string
  siteManager: string
  createdDate: string
  horizontalSegments: number
  verticalSegments: number
}

interface SegmentProperties {
  fillType: string
  label: string
  formula: string
  width: string
  height: string
}

type ViewMode = 'config' | 'editor'

const FILL_TYPES = [
  'Стеклопакет',
  'Глухое остекление',
  'Открывающееся окно',
  'Дверь',
  'Вентиляция',
  'Пустой'
]

export default function VitrageConstructor({ selectedObject }: VitrageConstructorProps) {
  const [config, setConfig] = useState<VitrageConfig>({
    marking: '',
    siteManager: '',
    createdDate: new Date().toISOString().split('T')[0],
    horizontalSegments: 0,
    verticalSegments: 0
  })
  const [viewMode, setViewMode] = useState<ViewMode>('config')
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set())
  const [segmentProperties, setSegmentProperties] = useState<Record<string, SegmentProperties>>({})
  // Объединённые сегменты: ключ - ID главного сегмента, значение - массив ID объединённых сегментов
  const [mergedSegments, setMergedSegments] = useState<Record<string, string[]>>({})
  // Сохранённые свойства сегментов перед объединением (для восстановления при разделении)
  const [originalPropertiesBeforeMerge, setOriginalPropertiesBeforeMerge] = useState<Record<string, Record<string, SegmentProperties>>>({})
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const workspaceRef = useRef<HTMLDivElement>(null)

  // Refs для полей ввода конфигурации
  const markingRef = useRef<HTMLInputElement>(null)
  const siteManagerRef = useRef<HTMLInputElement>(null)
  const createdDateRef = useRef<HTMLInputElement>(null)
  const horizontalRef = useRef<HTMLInputElement>(null)
  const verticalRef = useRef<HTMLInputElement>(null)

  const inputRefs = [markingRef, siteManagerRef, createdDateRef, horizontalRef, verticalRef]

  // Refs для полей свойств сегмента
  const propFillTypeRef = useRef<HTMLSelectElement>(null)
  const propLabelRef = useRef<HTMLInputElement>(null)
  const propFormulaRef = useRef<HTMLInputElement>(null)
  const propWidthRef = useRef<HTMLInputElement>(null)
  const propHeightRef = useRef<HTMLInputElement>(null)
  const propSaveBtnRef = useRef<HTMLButtonElement>(null)

  const propertyRefs = [propFillTypeRef, propLabelRef, propFormulaRef, propWidthRef, propHeightRef, propSaveBtnRef]

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = currentIndex + 1
      if (nextIndex < inputRefs.length) {
        inputRefs[nextIndex].current?.focus()
      } else {
        // Последнее поле - вызываем создание витража
        if (config.horizontalSegments > 0 && config.verticalSegments > 0) {
          handleCreate()
        }
      }
    }
  }

  // Обработчик Enter для полей свойств сегмента
  const handlePropertyKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = currentIndex + 1
      if (nextIndex < propertyRefs.length) {
        propertyRefs[nextIndex].current?.focus()
      }
      // Если последнее поле (высота) - нажимаем кнопку Сохранить
      if (currentIndex === 4) {
        closePropertiesPanel()
      }
    }
  }

  const handleConfigChange = (field: keyof VitrageConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreate = () => {
    if (config.horizontalSegments > 0 && config.verticalSegments > 0) {
      setViewMode('editor')
    }
  }

  const handleBack = () => {
    setViewMode('config')
    setSelectedSegments(new Set())
    setShowPropertiesPanel(false)
  }

  // Генерация SVG для сохранения витража
  const generateVitrageSVG = (): string => {
    const cols = config.horizontalSegments
    const rows = config.verticalSegments
    const padding = 50
    const defaultSize = 100

    // Вычисляем размеры столбцов и строк
    const columnWidths: number[] = Array(cols).fill(defaultSize)
    const rowHeights: number[] = Array(rows).fill(defaultSize)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const segmentId = `${row}-${col}`
        const props = segmentProperties[segmentId]
        if (props?.width) {
          columnWidths[col] = Math.max(columnWidths[col], parseFloat(props.width) / 10)
        }
        if (props?.height) {
          rowHeights[row] = Math.max(rowHeights[row], parseFloat(props.height) / 10)
        }
      }
    }

    const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0)
    const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0)
    const viewBoxWidth = totalWidth + padding * 2
    const viewBoxHeight = totalHeight + padding * 2

    let svgContent = `<svg width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">`
    svgContent += `<rect x="${padding}" y="${padding}" width="${totalWidth}" height="${totalHeight}" fill="none" stroke="#2c3e50" stroke-width="4"/>`

    const cumulativeX: number[] = [padding]
    for (let col = 0; col < cols; col++) {
      cumulativeX.push(cumulativeX[col] + columnWidths[col])
    }

    const cumulativeY: number[] = [padding]
    for (let row = 0; row < rows; row++) {
      cumulativeY.push(cumulativeY[row] + rowHeights[row])
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const segmentId = `${row}-${col}`
        const props = segmentProperties[segmentId]
        const isHidden = isSegmentHidden(segmentId)

        if (isHidden) continue

        const x = cumulativeX[col]
        const y = cumulativeY[row]
        let segWidth = columnWidths[col]
        let segHeight = rowHeights[row]

        // Для объединённых сегментов вычисляем общий размер
        if (mergedSegments[segmentId]) {
          const hiddenIds = mergedSegments[segmentId]
          const allIds = [segmentId, ...hiddenIds]
          let minCol = col, maxCol = col
          let minRow = row, maxRow = row

          allIds.forEach(id => {
            const [r, c] = id.split('-').map(Number)
            minCol = Math.min(minCol, c)
            maxCol = Math.max(maxCol, c)
            minRow = Math.min(minRow, r)
            maxRow = Math.max(maxRow, r)
          })

          segWidth = 0
          for (let c = minCol; c <= maxCol; c++) segWidth += columnWidths[c]
          segHeight = 0
          for (let r = minRow; r <= maxRow; r++) segHeight += rowHeights[r]
        }

        let fillColor = 'rgba(211, 211, 211, 0.2)'
        const fillType = props?.fillType || 'Пустой'
        if (fillType === 'Стеклопакет') fillColor = 'rgba(135, 206, 235, 0.2)'
        else if (fillType === 'Глухое остекление') fillColor = 'rgba(147, 112, 219, 0.2)'
        else if (fillType === 'Открывающееся окно') fillColor = 'rgba(144, 238, 144, 0.2)'
        else if (fillType === 'Дверь') fillColor = 'rgba(139, 69, 19, 0.2)'
        else if (fillType === 'Вентиляция') fillColor = 'rgba(0, 206, 209, 0.2)'

        // Используем числовой segmentId для совместимости с Дефектовкой (как в VitrageVisualizer)
        const numericSegmentId = row * cols + col + 1
        svgContent += `<rect x="${x}" y="${y}" width="${segWidth}" height="${segHeight}" fill="${fillColor}" stroke="#87ceeb" stroke-width="2" data-segment-id="${numericSegmentId}" class="vitrage-segment" style="cursor: pointer;"/>`

        const label = props?.label || `${numericSegmentId}`
        svgContent += `<text x="${x + segWidth / 2}" y="${y + segHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#2c3e50" font-weight="600" pointer-events="none">${label}</text>`
      }
    }

    svgContent += '</svg>'
    return svgContent
  }

  // Сохранение витража
  const handleSaveVitrage = async () => {
    if (!config.marking) {
      alert('Введите маркировку витража')
      return
    }

    if (!selectedObject) {
      alert('Объект не выбран. Пожалуйста, выберите объект на главной странице.')
      return
    }

    try {
      const cols = config.horizontalSegments
      const rows = config.verticalSegments

      // Преобразуем данные в формат для сохранения
      const segments = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const segmentId = `${row}-${col}`
          const props = segmentProperties[segmentId]

          segments.push({
            id: segmentId,
            type: props?.fillType || 'Пустой',
            width: props?.width ? parseFloat(props.width) : undefined,
            height: props?.height ? parseFloat(props.height) : undefined,
            formula: props?.formula || undefined,
            label: props?.label || `${row * cols + col + 1}`
          })
        }
      }

      const svgDrawing = generateVitrageSVG()

      // Преобразуем segmentProperties в формат для сохранения (с числовыми ключами)
      const segmentPropsForSave: Record<number, { type?: string; width?: string; height?: string; formula?: string; label?: string }> = {}
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const segmentId = `${row}-${col}`
          const numericId = row * cols + col + 1
          const props = segmentProperties[segmentId]
          if (props) {
            segmentPropsForSave[numericId] = {
              type: props.fillType,
              width: props.width,
              height: props.height,
              formula: props.formula,
              label: props.label
            }
          }
        }
      }

      const vitrageData = {
        name: config.marking,
        siteManager: config.siteManager,
        creationDate: config.createdDate,
        objectId: selectedObject.id,
        objectName: selectedObject.name,
        rows: rows,
        cols: cols,
        segments: segments,
        segmentProperties: segmentPropsForSave,
        mergedSegments: mergedSegments,
        totalWidth: 600,
        totalHeight: 400,
        svgDrawing: svgDrawing,
      }

      const { data: savedVitrage, source } = await vitrageStorage.create(vitrageData)

      if (savedVitrage) {
        const storageInfo = source === 'supabase'
          ? '☁️ Сохранено в облаке (Supabase)'
          : '📦 Сохранено локально (localStorage)'

        alert(`Витраж "${config.marking}" успешно сохранён!\n\n${storageInfo}\n\nПараметры:\n- Объект: ${selectedObject.name}\n- Сетка: ${cols} × ${rows}\n- Всего сегментов: ${cols * rows}\n- Сегментов с данными: ${Object.keys(segmentProperties).length}\n\nВитраж доступен во вкладке "Типовые витражи"`)

        // После успешного сохранения возвращаемся к форме конфигурации
        handleBack()
        setConfig({
          marking: '',
          siteManager: '',
          createdDate: new Date().toISOString().split('T')[0],
          horizontalSegments: 0,
          verticalSegments: 0
        })
        setSegmentProperties({})
        setMergedSegments({})
        setOriginalPropertiesBeforeMerge({})
      } else {
        throw new Error('Не удалось сохранить витраж')
      }
    } catch (error) {
      console.error('Ошибка при сохранении витража:', error)
      alert('Произошла ошибка при сохранении витража. Проверьте консоль для деталей.')
    }
  }

  const handleSegmentClick = (segmentId: string, event: React.MouseEvent) => {
    // Проверяем, не является ли этот сегмент частью объединённого (скрытым)
    const isHiddenInMerge = Object.values(mergedSegments).some(ids => ids.includes(segmentId))
    if (isHiddenInMerge) return

    if (event.ctrlKey || event.metaKey) {
      // Множественное выделение с Ctrl
      setSelectedSegments(prev => {
        const newSet = new Set(prev)
        if (newSet.has(segmentId)) {
          newSet.delete(segmentId)
        } else {
          newSet.add(segmentId)
        }
        return newSet
      })
      // Скрываем панель свойств при множественном выделении
      if (selectedSegments.size > 0) {
        setShowPropertiesPanel(false)
      }
    } else {
      // Одиночное выделение
      if (selectedSegments.size === 1 && selectedSegments.has(segmentId)) {
        setSelectedSegments(new Set())
        setShowPropertiesPanel(false)
      } else {
        setSelectedSegments(new Set([segmentId]))
        setShowPropertiesPanel(true)
      }
    }
  }

  // Получить первый выделенный сегмент для панели свойств
  const getFirstSelectedSegment = (): string | null => {
    const arr = Array.from(selectedSegments)
    return arr.length > 0 ? arr[0] : null
  }

  const DEFAULT_SEGMENT_SIZE = 100 // размер по умолчанию в единицах SVG

  const getSegmentProperties = (segmentId: string): SegmentProperties => {
    return segmentProperties[segmentId] || {
      fillType: 'Пустой',
      label: '',
      formula: '',
      width: '',
      height: ''
    }
  }

  // Получение размера сегмента в единицах SVG (масштабирование из мм)
  const getSegmentSize = (segmentId: string) => {
    const props = getSegmentProperties(segmentId)
    const widthMm = parseInt(props.width) || 0
    const heightMm = parseInt(props.height) || 0

    // Если размер не задан, используем размер по умолчанию
    // Масштаб: 1000мм = 100 единиц SVG (т.е. 10мм = 1 единица SVG)
    const scale = 0.1
    return {
      width: widthMm > 0 ? widthMm * scale : DEFAULT_SEGMENT_SIZE,
      height: heightMm > 0 ? heightMm * scale : DEFAULT_SEGMENT_SIZE
    }
  }

  // Проверка, является ли сегмент скрытым (частью объединённого)
  const isSegmentHidden = (segmentId: string): boolean => {
    return Object.values(mergedSegments).some(ids => ids.includes(segmentId))
  }

  // Найти главный сегмент для скрытого сегмента
  const findMainSegmentForHidden = (segmentId: string): string | null => {
    for (const [mainId, hiddenIds] of Object.entries(mergedSegments)) {
      if (hiddenIds.includes(segmentId)) {
        return mainId
      }
    }
    return null
  }

  // Вычисление позиций и размеров всех сегментов
  // Каждый сегмент имеет независимый размер
  const calculateSegmentLayouts = () => {
    const layouts: Record<string, { x: number; y: number; width: number; height: number; hidden?: boolean }> = {}

    // Проверка на валидность конфигурации
    if (config.verticalSegments <= 0 || config.horizontalSegments <= 0) {
      return { layouts, totalWidth: DEFAULT_SEGMENT_SIZE, totalHeight: DEFAULT_SEGMENT_SIZE }
    }

    const gap = 4 // Отступ между сегментами
    const startX = 2
    const startY = 2

    // Определяем границы объединённых групп
    const mergedGroupBounds: Record<string, { minRow: number; maxRow: number; minCol: number; maxCol: number }> = {}
    for (const [mainId, hiddenIds] of Object.entries(mergedSegments)) {
      const allIds = [mainId, ...hiddenIds]
      let minRow = Infinity, maxRow = -Infinity
      let minCol = Infinity, maxCol = -Infinity

      allIds.forEach(id => {
        const [row, col] = id.split('-').map(Number)
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
      })

      mergedGroupBounds[mainId] = { minRow, maxRow, minCol, maxCol }
    }

    // Получаем индивидуальные размеры каждого сегмента
    const segmentSizes: Record<string, { width: number; height: number }> = {}
    for (let row = 0; row < config.verticalSegments; row++) {
      for (let col = 0; col < config.horizontalSegments; col++) {
        const segmentId = `${row}-${col}`
        const size = getSegmentSize(segmentId)
        segmentSizes[segmentId] = {
          width: Math.max(size.width, 50),
          height: Math.max(size.height, 50)
        }
      }
    }

    // Вычисляем максимальную ширину для каждой строки (сумма ширин сегментов в строке)
    // и максимальную высоту для каждого столбца (сумма высот сегментов в столбце)
    let maxRowWidth = 0
    for (let row = 0; row < config.verticalSegments; row++) {
      let rowWidth = 0
      for (let col = 0; col < config.horizontalSegments; col++) {
        const segmentId = `${row}-${col}`
        if (!isSegmentHidden(segmentId)) {
          rowWidth += segmentSizes[segmentId].width + gap
        }
      }
      maxRowWidth = Math.max(maxRowWidth, rowWidth)
    }

    // Вычисляем позиции для каждого сегмента независимо
    // Каждая строка начинается с startX, сегменты размещаются последовательно
    let currentY = startY
    for (let row = 0; row < config.verticalSegments; row++) {
      let currentX = startX
      let maxHeightInRow = 0

      for (let col = 0; col < config.horizontalSegments; col++) {
        const segmentId = `${row}-${col}`
        const hidden = isSegmentHidden(segmentId)
        const isMainMerged = mergedSegments[segmentId] !== undefined

        if (hidden) {
          // Скрытый сегмент - записываем позицию, но не отображаем
          layouts[segmentId] = {
            x: currentX,
            y: currentY,
            width: 0,
            height: 0,
            hidden: true
          }
          continue
        }

        let segWidth = segmentSizes[segmentId].width
        let segHeight = segmentSizes[segmentId].height

        // Для объединённых сегментов используем размер главного сегмента
        if (isMainMerged) {
          const mainSize = getSegmentSize(segmentId)
          segWidth = Math.max(mainSize.width, 50)
          segHeight = Math.max(mainSize.height, 50)
        }

        layouts[segmentId] = {
          x: currentX,
          y: currentY,
          width: segWidth,
          height: segHeight,
          hidden: false
        }

        currentX += segWidth + gap
        maxHeightInRow = Math.max(maxHeightInRow, segHeight)
      }

      currentY += maxHeightInRow + gap
    }

    // Вычисляем общие размеры витража
    let totalWidth = startX
    let totalHeight = startY
    for (const layout of Object.values(layouts)) {
      if (!layout.hidden) {
        totalWidth = Math.max(totalWidth, layout.x + layout.width + gap)
        totalHeight = Math.max(totalHeight, layout.y + layout.height + gap)
      }
    }

    return { layouts, totalWidth: totalWidth || DEFAULT_SEGMENT_SIZE, totalHeight: totalHeight || DEFAULT_SEGMENT_SIZE }
  }

  const handlePropertyChange = (field: keyof SegmentProperties, value: string) => {
    const selectedSegment = getFirstSelectedSegment()
    if (!selectedSegment) return
    setSegmentProperties(prev => ({
      ...prev,
      [selectedSegment]: {
        ...getSegmentProperties(selectedSegment),
        [field]: value
      }
    }))
  }

  const closePropertiesPanel = () => {
    setShowPropertiesPanel(false)
    setSelectedSegments(new Set())
  }

  // Функция объединения сегментов
  const handleMergeSegments = () => {
    if (selectedSegments.size < 2) {
      alert('Выберите минимум 2 сегмента для объединения (Ctrl+клик)')
      return
    }

    const segmentIds = Array.from(selectedSegments)

    // Сортируем по позиции (сначала по строке, потом по столбцу)
    segmentIds.sort((a, b) => {
      const [rowA, colA] = a.split('-').map(Number)
      const [rowB, colB] = b.split('-').map(Number)
      if (rowA !== rowB) return rowA - rowB
      return colA - colB
    })

    // Первый сегмент становится главным
    const mainSegmentId = segmentIds[0]
    const mergedIds = segmentIds.slice(1)

    // Сохраняем оригинальные свойства всех сегментов перед объединением
    const originalProps: Record<string, SegmentProperties> = {}
    segmentIds.forEach(id => {
      originalProps[id] = { ...getSegmentProperties(id) }
    })
    setOriginalPropertiesBeforeMerge(prev => ({
      ...prev,
      [mainSegmentId]: originalProps
    }))

    // Вычисляем общий размер объединённого сегмента
    let totalWidth = 0
    let totalHeight = 0

    // Определяем границы объединённых сегментов
    let minRow = Infinity, maxRow = -Infinity
    let minCol = Infinity, maxCol = -Infinity

    segmentIds.forEach(id => {
      const [row, col] = id.split('-').map(Number)
      minRow = Math.min(minRow, row)
      maxRow = Math.max(maxRow, row)
      minCol = Math.min(minCol, col)
      maxCol = Math.max(maxCol, col)
    })

    // Суммируем ширины по столбцам и высоты по строкам
    for (let col = minCol; col <= maxCol; col++) {
      const segId = `${minRow}-${col}`
      const size = getSegmentSize(segId)
      totalWidth += size.width
    }

    for (let row = minRow; row <= maxRow; row++) {
      const segId = `${row}-${minCol}`
      const size = getSegmentSize(segId)
      totalHeight += size.height
    }

    // Устанавливаем начальный размер объединённого сегмента
    const mainProps = getSegmentProperties(mainSegmentId)
    setSegmentProperties(prev => ({
      ...prev,
      [mainSegmentId]: {
        ...mainProps,
        width: String(Math.round(totalWidth * 10)), // конвертируем обратно в мм
        height: String(Math.round(totalHeight * 10))
      }
    }))

    // Добавляем в список объединённых
    setMergedSegments(prev => ({
      ...prev,
      [mainSegmentId]: mergedIds
    }))

    // Сбрасываем выделение
    setSelectedSegments(new Set())
    setShowPropertiesPanel(false)
  }

  // Функция разделения объединённого сегмента
  const handleSplitSegments = () => {
    // Проверяем, выбран ли ровно один сегмент
    if (selectedSegments.size !== 1) {
      alert('Выберите один объединённый сегмент для разделения')
      return
    }

    const selectedSegment = Array.from(selectedSegments)[0]

    // Проверяем, является ли выбранный сегмент главным в объединённой группе
    if (!mergedSegments[selectedSegment]) {
      alert('Выбранный сегмент не является объединённым')
      return
    }

    // Восстанавливаем оригинальные свойства сегментов
    const originalProps = originalPropertiesBeforeMerge[selectedSegment]
    if (originalProps) {
      setSegmentProperties(prev => {
        const newProps = { ...prev }
        Object.entries(originalProps).forEach(([segmentId, props]) => {
          newProps[segmentId] = { ...props }
        })
        return newProps
      })
    }

    // Удаляем запись об объединении
    setMergedSegments(prev => {
      const newMerged = { ...prev }
      delete newMerged[selectedSegment]
      return newMerged
    })

    // Удаляем сохранённые оригинальные свойства
    setOriginalPropertiesBeforeMerge(prev => {
      const newOriginal = { ...prev }
      delete newOriginal[selectedSegment]
      return newOriginal
    })

    // Сбрасываем выделение
    setSelectedSegments(new Set())
    setShowPropertiesPanel(false)
  }

  // Проверка, является ли выбранный сегмент объединённым (для активации кнопки "Разделить")
  const canSplitSelected = (): boolean => {
    if (selectedSegments.size !== 1) return false
    const selectedSegment = Array.from(selectedSegments)[0]
    return !!mergedSegments[selectedSegment]
  }

  const handlePanelMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.properties-form')) return
    setIsDragging(true)
    const panel = e.currentTarget
    const rect = panel.getBoundingClientRect()
    const workspaceRect = workspaceRef.current?.getBoundingClientRect()
    if (workspaceRect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging || !workspaceRef.current) return
    const workspaceRect = workspaceRef.current.getBoundingClientRect()
    const newX = e.clientX - workspaceRect.left - dragOffset.x
    const newY = e.clientY - workspaceRect.top - dragOffset.y

    // Ограничиваем позицию в пределах рабочего пространства
    const maxX = workspaceRect.width - 320 // ширина панели
    const maxY = workspaceRect.height - 400 // примерная высота панели

    setPanelPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Получение цвета и обводки в зависимости от типа заполнения
  const getFillTypeStyles = (fillType: string) => {
    switch (fillType) {
      case 'Стеклопакет':
        return { fill: '#e3f2fd', stroke: '#1565c0' } // синий
      case 'Глухое остекление':
        return { fill: '#e1bee7', stroke: '#7b1fa2' } // фиолетовый
      case 'Открывающееся окно':
        return { fill: '#c8e6c9', stroke: '#388e3c' } // зелёный
      case 'Дверь':
        return { fill: '#ffecb3', stroke: '#f57c00' } // оранжевый
      case 'Вентиляция':
        return { fill: '#b2ebf2', stroke: '#00838f' } // бирюзовый
      case 'Пустой':
        return { fill: '#f5f5f5', stroke: '#9e9e9e' } // серый
      default:
        return { fill: '#e3f2fd', stroke: '#1565c0' }
    }
  }

  // Отрисовка содержимого сегмента в зависимости от типа заполнения
  const renderSegmentContent = (segmentId: string, x: number, y: number, width: number, height: number, segmentNumber: number) => {
    const props = getSegmentProperties(segmentId)
    // Защита от NaN и невалидных значений
    const safeWidth = isNaN(width) || width < 40 ? 96 : width
    const safeHeight = isNaN(height) || height < 40 ? 96 : height
    const centerX = x + safeWidth / 2
    const centerY = y + safeHeight / 2
    // Используем обозначение сегмента, если оно задано, иначе номер
    const displayLabel = props.label || String(segmentNumber)

    switch (props.fillType) {
      case 'Открывающееся окно':
        // Обозначение створки - диагональная линия и треугольник
        return (
          <>
            <line x1={x + 10} y1={y + 10} x2={x + safeWidth - 10} y2={y + safeHeight - 10} stroke="#388e3c" strokeWidth="2" />
            <polygon points={`${centerX},${y + 20} ${centerX - 20},${y + safeHeight - 20} ${centerX + 20},${y + safeHeight - 20}`} fill="none" stroke="#388e3c" strokeWidth="2" />
            <text x={centerX} y={y + 15} textAnchor="middle" fontSize="10" fill="#388e3c" style={{ pointerEvents: 'none' }}>
              {displayLabel}
            </text>
          </>
        )
      case 'Дверь':
        // Обозначение двери - прямоугольник с дугой
        {
          const doorHeight = Math.max(safeHeight - 30, 20)
          return (
            <>
              <rect x={centerX - 15} y={y + 15} width={30} height={doorHeight} fill="none" stroke="#f57c00" strokeWidth="2" />
              <path d={`M ${centerX - 15} ${y + 15 + doorHeight} Q ${centerX - 30} ${centerY} ${centerX - 15} ${y + 15}`} fill="none" stroke="#f57c00" strokeWidth="1.5" strokeDasharray="4,2" />
              <circle cx={centerX + 8} cy={centerY} r="3" fill="#f57c00" />
              <text x={centerX} y={y + 12} textAnchor="middle" fontSize="10" fill="#f57c00" style={{ pointerEvents: 'none' }}>
                {displayLabel}
              </text>
            </>
          )
        }
      case 'Вентиляция':
        // Вертикальные линии - распределяем равномерно
        {
          const lineCount = Math.max(3, Math.floor(safeWidth / 20))
          const lineSpacing = safeWidth / (lineCount + 1)
          return (
            <>
              {Array.from({ length: lineCount }).map((_, i) => (
                <line key={i} x1={x + lineSpacing * (i + 1)} y1={y + 15} x2={x + lineSpacing * (i + 1)} y2={y + safeHeight - 15} stroke="#00838f" strokeWidth="2" />
              ))}
              <text x={centerX} y={y + 12} textAnchor="middle" fontSize="10" fill="#00838f" style={{ pointerEvents: 'none' }}>
                {displayLabel}
              </text>
            </>
          )
        }
      case 'Глухое остекление':
        // Диагональная штриховка тире-точка под 45 градусов
        {
          const maxDimension = Math.max(safeWidth, safeHeight) * 2
          const lineOffsets = []
          for (let offset = 0; offset < maxDimension; offset += 15) {
            lineOffsets.push(offset)
          }
          const clipWidth = Math.max(safeWidth - 4, 10)
          const clipHeight = Math.max(safeHeight - 4, 10)
          return (
            <>
              <defs>
                <clipPath id={`clip-${segmentId}`}>
                  <rect x={x + 2} y={y + 2} width={clipWidth} height={clipHeight} rx="4" />
                </clipPath>
              </defs>
              <g clipPath={`url(#clip-${segmentId})`}>
                {lineOffsets.map((offset, i) => (
                  <line
                    key={i}
                    x1={x - safeHeight + offset}
                    y1={y}
                    x2={x + offset}
                    y2={y + safeHeight}
                    stroke="#7b1fa2"
                    strokeWidth="1"
                    strokeDasharray="6,3,2,3"
                  />
                ))}
              </g>
              <text x={centerX} y={y + 15} textAnchor="middle" fontSize="10" fill="#7b1fa2" style={{ pointerEvents: 'none' }}>
                {displayLabel}
              </text>
            </>
          )
        }
      case 'Стеклопакет':
        // Короткие вертикальные черточки, распределённые по площади
        {
          const positions = []
          const cols = Math.max(2, Math.floor(safeWidth / 35))
          const rows = Math.max(2, Math.floor(safeHeight / 35))
          const contentHeight = Math.max(safeHeight - 30, 20)
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              positions.push({
                cx: x + (safeWidth / (cols + 1)) * (c + 1),
                cy: y + 20 + (contentHeight / rows) * (r + 0.5)
              })
            }
          }
          return (
            <>
              {positions.map((pos, i) => (
                <g key={i}>
                  <line x1={pos.cx - 4} y1={pos.cy - 4} x2={pos.cx - 4} y2={pos.cy + 4} stroke="#1565c0" strokeWidth="1.5" />
                  <line x1={pos.cx} y1={pos.cy - 4} x2={pos.cx} y2={pos.cy + 4} stroke="#1565c0" strokeWidth="1.5" />
                  <line x1={pos.cx + 4} y1={pos.cy - 4} x2={pos.cx + 4} y2={pos.cy + 4} stroke="#1565c0" strokeWidth="1.5" />
                </g>
              ))}
              <text x={centerX} y={y + 15} textAnchor="middle" fontSize="10" fill="#1565c0" style={{ pointerEvents: 'none' }}>
                {displayLabel}
              </text>
            </>
          )
        }
      default:
        // Пустой - просто обозначение или номер
        return (
          <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill={getFillTypeStyles(props.fillType).stroke} style={{ pointerEvents: 'none' }}>
            {displayLabel}
          </text>
        )
    }
  }

  // Режим редактора витража
  if (viewMode === 'editor') {
    return (
      <div className="vitrage-constructor">
        <header className="vitrage-constructor-header">
          <div className="header-left">
            <button className="back-btn" onClick={handleBack}>
              ← Назад
            </button>
            <h1 className="vitrage-constructor-title">
              Редактор: {config.marking || 'Витраж'}
            </h1>
          </div>
          <div className="header-actions">
            <button
              className="header-action-btn"
              onClick={handleMergeSegments}
              disabled={selectedSegments.size < 2}
              title="Выделите несколько сегментов с Ctrl+клик"
            >
              Объединить сегменты {selectedSegments.size > 1 ? `(${selectedSegments.size})` : ''}
            </button>
            <button
              className="header-action-btn"
              onClick={handleSplitSegments}
              disabled={!canSplitSelected()}
              title="Выберите объединённый сегмент для разделения"
            >
              Разделить сегменты
            </button>
            <button className="header-action-btn save-btn" onClick={handleSaveVitrage}>
              Сохранить витраж
            </button>
          </div>
          {selectedObject && (
            <div className="vitrage-constructor-object">
              <span className="object-label">Объект:</span>
              <span className="object-name">{selectedObject.name}</span>
            </div>
          )}
        </header>

        <div
          className="vitrage-editor-workspace"
          ref={workspaceRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="vitrage-editor-canvas">
            {(() => {
              const { layouts, totalWidth, totalHeight } = calculateSegmentLayouts()
              return (
                <svg
                  viewBox={`0 0 ${totalWidth + 4} ${totalHeight + 4}`}
                  className="vitrage-editor-svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {Array.from({ length: config.verticalSegments }).map((_, rowIndex) =>
                    Array.from({ length: config.horizontalSegments }).map((_, colIndex) => {
                      const segmentId = `${rowIndex}-${colIndex}`
                      const layout = layouts[segmentId]

                      // Пропускаем скрытые сегменты (часть объединённых)
                      if (layout.hidden || layout.width <= 0 || layout.height <= 0) {
                        return null
                      }

                      const isSelected = selectedSegments.has(segmentId)
                      const segmentProps = getSegmentProperties(segmentId)
                      const styles = getFillTypeStyles(segmentProps.fillType)
                      const segmentNumber = rowIndex * config.horizontalSegments + colIndex + 1

                      return (
                        <g
                          key={segmentId}
                          className="segment-group"
                          onClick={(e) => handleSegmentClick(segmentId, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          <rect
                            x={layout.x}
                            y={layout.y}
                            width={layout.width}
                            height={layout.height}
                            fill={isSelected ? '#bbdefb' : styles.fill}
                            stroke={isSelected ? '#0d47a1' : styles.stroke}
                            strokeWidth={isSelected ? 3 : 2}
                            rx="4"
                          />
                          {renderSegmentContent(segmentId, layout.x, layout.y, layout.width, layout.height, segmentNumber)}
                        </g>
                      )
                    })
                  )}
                </svg>
              )
            })()}
          </div>

          <div className="vitrage-editor-info">
            <div className="info-item">
              <span className="info-label">Маркировка:</span>
              <span className="info-value">{config.marking || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Начальник участка:</span>
              <span className="info-value">{config.siteManager || '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Дата создания:</span>
              <span className="info-value">{config.createdDate ? new Date(config.createdDate).toLocaleDateString('ru-RU') : '—'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Размер:</span>
              <span className="info-value">{config.horizontalSegments} x {config.verticalSegments}</span>
            </div>
          </div>

          {/* Панель свойств сегмента */}
          {showPropertiesPanel && selectedSegments.size === 1 && (() => {
            const selectedSegment = getFirstSelectedSegment()
            if (!selectedSegment) return null
            return (
            <div
              className={`segment-properties-panel ${isDragging ? 'dragging' : ''}`}
              style={{
                left: panelPosition.x,
                top: panelPosition.y
              }}
              onMouseDown={handlePanelMouseDown}
            >
              <div className="properties-header">
                <h3>Свойства сегмента #{selectedSegment.split('-').map(n => parseInt(n) + 1).join('-')}</h3>
                <button className="properties-close-btn" onClick={closePropertiesPanel}>
                  ✕
                </button>
              </div>
              <div className="properties-form">
                <div className="property-field">
                  <label>Тип заполнения</label>
                  <select
                    ref={propFillTypeRef}
                    value={getSegmentProperties(selectedSegment).fillType}
                    onChange={(e) => handlePropertyChange('fillType', e.target.value)}
                    onKeyDown={(e) => handlePropertyKeyDown(e, 0)}
                  >
                    {FILL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="property-field">
                  <label>Обозначение сегмента</label>
                  <input
                    ref={propLabelRef}
                    type="text"
                    value={getSegmentProperties(selectedSegment).label}
                    onChange={(e) => handlePropertyChange('label', e.target.value)}
                    onKeyDown={(e) => handlePropertyKeyDown(e, 1)}
                    placeholder="Например: С1"
                  />
                </div>

                <div className="property-field">
                  <label>Формула стеклопакета</label>
                  <input
                    ref={propFormulaRef}
                    type="text"
                    value={getSegmentProperties(selectedSegment).formula}
                    onChange={(e) => handlePropertyChange('formula', e.target.value)}
                    onKeyDown={(e) => handlePropertyKeyDown(e, 2)}
                    placeholder="Например: 4М1-16-4М1"
                  />
                </div>

                <div className="property-field">
                  <label>Ширина (мм)</label>
                  <input
                    ref={propWidthRef}
                    type="text"
                    value={getSegmentProperties(selectedSegment).width}
                    onChange={(e) => handlePropertyChange('width', e.target.value)}
                    onKeyDown={(e) => handlePropertyKeyDown(e, 3)}
                    placeholder="1200"
                  />
                </div>

                <div className="property-field">
                  <label>Высота (мм)</label>
                  <input
                    ref={propHeightRef}
                    type="text"
                    value={getSegmentProperties(selectedSegment).height}
                    onChange={(e) => handlePropertyChange('height', e.target.value)}
                    onKeyDown={(e) => handlePropertyKeyDown(e, 4)}
                    placeholder="1500"
                  />
                </div>

                <button
                  ref={propSaveBtnRef}
                  className="properties-save-btn"
                  type="button"
                  onClick={closePropertiesPanel}
                  onKeyDown={(e) => { if (e.key === 'Enter') closePropertiesPanel() }}
                >
                  Сохранить
                </button>
              </div>
            </div>
          )
          })()}
        </div>
      </div>
    )
  }

  // Режим конфигуратора
  return (
    <div className="vitrage-constructor">
      <header className="vitrage-constructor-header">
        <h1 className="vitrage-constructor-title">Конструктор Витражей</h1>
        {selectedObject && (
          <div className="vitrage-constructor-object">
            <span className="object-label">Объект:</span>
            <span className="object-name">{selectedObject.name}</span>
          </div>
        )}
      </header>

      <div className="vitrage-constructor-content">
        <div className="constructor-layout">
          {/* Левая панель - Конфигуратор */}
          <div className="config-panel">
            <h2 className="config-title">Параметры витража</h2>

            <div className="config-form">
              <div className="config-field">
                <label htmlFor="marking">Маркировка витража</label>
                <input
                  ref={markingRef}
                  id="marking"
                  type="text"
                  value={config.marking}
                  onChange={(e) => handleConfigChange('marking', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 0)}
                  placeholder="Например: В-001"
                  autoFocus
                />
              </div>

              <div className="config-field">
                <label htmlFor="siteManager">Начальник участка</label>
                <input
                  ref={siteManagerRef}
                  id="siteManager"
                  type="text"
                  value={config.siteManager}
                  onChange={(e) => handleConfigChange('siteManager', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                  placeholder="ФИО начальника"
                />
              </div>

              <div className="config-field">
                <label htmlFor="createdDate">Дата создания</label>
                <input
                  ref={createdDateRef}
                  id="createdDate"
                  type="date"
                  value={config.createdDate}
                  onChange={(e) => handleConfigChange('createdDate', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 2)}
                />
              </div>

              <div className="config-field">
                <label htmlFor="horizontalSegments">Количество сегментов по горизонтали</label>
                <input
                  ref={horizontalRef}
                  id="horizontalSegments"
                  type="text"
                  value={config.horizontalSegments || ''}
                  onChange={(e) => handleConfigChange('horizontalSegments', parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                  placeholder="Например: 3"
                />
              </div>

              <div className="config-field">
                <label htmlFor="verticalSegments">Количество сегментов по вертикали</label>
                <input
                  ref={verticalRef}
                  id="verticalSegments"
                  type="text"
                  value={config.verticalSegments || ''}
                  onChange={(e) => handleConfigChange('verticalSegments', parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => handleKeyDown(e, 4)}
                  placeholder="Например: 2"
                />
              </div>
            </div>

            <button
              className="create-btn"
              type="button"
              onClick={handleCreate}
              disabled={config.horizontalSegments <= 0 || config.verticalSegments <= 0}
            >
              Создать
            </button>
          </div>

          {/* Правая панель - Предпросмотр витража */}
          <div className="preview-panel">
            <h2 className="preview-title">Предпросмотр витража</h2>
            <div className="vitrage-preview">
              {config.horizontalSegments > 0 && config.verticalSegments > 0 ? (
                <svg
                  viewBox={`0 0 ${config.horizontalSegments * 100} ${config.verticalSegments * 100}`}
                  className="vitrage-svg"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Отрисовка сегментов */}
                  {Array.from({ length: config.verticalSegments }).map((_, rowIndex) =>
                    Array.from({ length: config.horizontalSegments }).map((_, colIndex) => (
                      <g key={`${rowIndex}-${colIndex}`}>
                        <rect
                          x={colIndex * 100 + 2}
                          y={rowIndex * 100 + 2}
                          width={96}
                          height={96}
                          fill="#e3f2fd"
                          stroke="#1565c0"
                          strokeWidth="2"
                          rx="4"
                        />
                        <text
                          x={colIndex * 100 + 50}
                          y={rowIndex * 100 + 50}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="14"
                          fill="#1565c0"
                        >
                          {rowIndex * config.horizontalSegments + colIndex + 1}
                        </text>
                      </g>
                    ))
                  )}
                </svg>
              ) : (
                <div className="preview-placeholder">
                  Введите количество сегментов для предпросмотра
                </div>
              )}
            </div>

            {config.marking && (
              <div className="preview-info">
                <strong>Маркировка:</strong> {config.marking}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
