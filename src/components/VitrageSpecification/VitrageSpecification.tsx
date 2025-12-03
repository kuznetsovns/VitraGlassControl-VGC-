import { useState, useEffect } from 'react'
import { vitrageStorage } from '../../services/vitrageStorage'
import './VitrageSpecification.css'

export interface VitrageGrid {
  id: string
  name: string
  siteManager?: string
  creationDate?: string
  rows: number
  cols: number
  segments: VitrageSegment[]
  totalWidth: number
  totalHeight: number
  profileWidth: number
  createdAt: Date
}

export interface VitrageSegment {
  id: string
  row?: number
  col?: number
  x?: number
  y?: number
  width?: number
  height?: number
  type: string
  formula?: string
  label?: string
  selected?: boolean
  realWidth?: number
  realHeight?: number
  merged?: boolean
  mergedWith?: string[]
  rowSpan?: number
  colSpan?: number
  isStemalit?: boolean
  hidden?: boolean
  mergedInto?: number
}

interface SpecificationItem {
  type: 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door'
  count: number
  totalArea: number
  items: {
    label: string
    width: number
    height: number
    area: number
    formula?: string
    isStemalit?: boolean
  }[]
}

export default function VitrageSpecification() {
  const [vitrages, setVitrages] = useState<VitrageGrid[]>([])
  const [selectedVitrage, setSelectedVitrage] = useState<VitrageGrid | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterMinArea, setFilterMinArea] = useState<number>(0)
  const [filterMaxArea, setFilterMaxArea] = useState<number>(1000)
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  useEffect(() => {
    // Загружаем витражи через единый сервис (Supabase или localStorage)
    const loadVitrages = async () => {
      try {
        const { data, source } = await vitrageStorage.getAll()
        console.log(`📋 Витражи загружены из ${source}:`, data.length)

        // Преобразуем данные в формат VitrageGrid
        const vitrageGrids: VitrageGrid[] = data.map((v) => ({
          id: v.id,
          name: v.name,
          siteManager: v.siteManager,
          creationDate: v.creationDate,
          rows: v.rows,
          cols: v.cols,
          segments: v.segments || [],
          totalWidth: v.totalWidth,
          totalHeight: v.totalHeight,
          profileWidth: 12,
          createdAt: new Date(v.createdAt)
        }))

        setVitrages(vitrageGrids)
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error)
      }
    }

    loadVitrages()
  }, [])

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'glass': return 'Стеклопакет'
      case 'ventilation': return 'Вентрешетка'
      case 'sandwich': return 'Сэндвич-панель'
      case 'casement': return 'Створка'
      case 'door': return 'Дверной блок'
      default: return 'Пустой'
    }
  }

  const calculateSpecification = (vitrage: VitrageGrid): SpecificationItem[] => {
    const specification: { [key: string]: SpecificationItem } = {}

    vitrage.segments.forEach(segment => {
      // Пропускаем скрытые и объединенные сегменты
      if (segment.hidden || segment.merged) return

      // Используем поля width/height вместо realWidth/realHeight
      const segmentWidth = segment.width || segment.realWidth
      const segmentHeight = segment.height || segment.realHeight

      if (!segmentWidth || !segmentHeight) return

      const segmentType = segment.type as any || 'empty'

      if (!specification[segmentType]) {
        specification[segmentType] = {
          type: segmentType,
          count: 0,
          totalArea: 0,
          items: []
        }
      }

      const area = (segmentWidth * segmentHeight) / 1000000 // переводим в м²

      specification[segmentType].count++
      specification[segmentType].totalArea += area
      specification[segmentType].items.push({
        label: segment.label || `${getTypeLabel(segmentType)} ${specification[segmentType].count}`,
        width: segmentWidth,
        height: segmentHeight,
        area: area,
        formula: segment.formula,
        isStemalit: segment.isStemalit
      })
    })

    return Object.values(specification).filter(item => item.count > 0)
  }

  const getTotalArea = (vitrage: VitrageGrid): number => {
    return vitrage.segments
      .filter(s => !s.merged && !s.hidden)
      .reduce((total, segment) => {
        const width = segment.width || segment.realWidth || 0
        const height = segment.height || segment.realHeight || 0
        return total + (width * height) / 1000000
      }, 0)
  }

  const getUniqueSegmentTypes = (): string[] => {
    const types = new Set<string>()
    vitrages.forEach(vitrage => {
      vitrage.segments.forEach(segment => {
        if (!segment.merged && !segment.hidden) {
          types.add(segment.type)
        }
      })
    })
    return Array.from(types).sort()
  }

  const filteredVitrages = vitrages.filter(vitrage => {
    const totalArea = getTotalArea(vitrage)
    const createdDate = new Date(vitrage.createdAt)

    // Фильтр по типу элемента
    if (filterType !== 'all') {
      const hasType = vitrage.segments.some(s => s.type === filterType && !s.merged && !s.hidden)
      if (!hasType) return false
    }

    // Фильтр по площади
    if (totalArea < filterMinArea || totalArea > filterMaxArea) {
      return false
    }

    // Фильтр по дате начала
    if (filterDateFrom) {
      const dateFrom = new Date(filterDateFrom)
      if (createdDate < dateFrom) return false
    }

    // Фильтр по дате конца
    if (filterDateTo) {
      const dateTo = new Date(filterDateTo)
      dateTo.setHours(23, 59, 59, 999)
      if (createdDate > dateTo) return false
    }

    return true
  })

  const resetFilters = () => {
    setFilterType('all')
    setFilterMinArea(0)
    setFilterMaxArea(1000)
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  return (
    <div className="vitrage-specification">
      <div className="specification-header">
        <h2>Типовые витражи</h2>
        <div className="vitrage-stats">
          Создано витражей: <strong>{vitrages.length}</strong>
          {vitrages.length > 0 && (
            <>
              {' | '}Общая площадь: <strong>{vitrages.reduce((total, v) => total + getTotalArea(v), 0).toFixed(2)} м²</strong>
            </>
          )}
        </div>
      </div>

      <div className="specification-content">
        <div className="vitrages-list">
          <h3>Список витражей</h3>

          <div className="filters-panel">
            <div className="filters-header">
              <h4>Фильтры</h4>
              <button className="reset-filters-btn" onClick={resetFilters}>Очистить</button>
            </div>

            <div className="filter-group">
              <label>По типу элемента:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Все типы</option>
                {getUniqueSegmentTypes().map(type => (
                  <option key={type} value={type}>{getTypeLabel(type)}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Площадь (м²):</label>
              <div className="filter-range">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={filterMinArea}
                  onChange={(e) => setFilterMinArea(Number(e.target.value))}
                  placeholder="От"
                  className="filter-input"
                />
                <span className="range-sep">—</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={filterMaxArea}
                  onChange={(e) => setFilterMaxArea(Number(e.target.value))}
                  placeholder="До"
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Дата создания:</label>
              <div className="filter-date-range">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="filter-input"
                />
                <span className="range-sep">—</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          {vitrages.length === 0 ? (
            <div className="empty-state">
              <p>Витражи не созданы</p>
              <p>Перейдите на вкладку "Отрисовка витражей с размерами" для создания витража</p>
            </div>
          ) : filteredVitrages.length === 0 ? (
            <div className="empty-state">
              <p>Витражи не найдены</p>
              <p>Измените параметры фильтра</p>
            </div>
          ) : (
            <div className="vitrages-grid">
              {filteredVitrages.map((vitrage) => (
                <div 
                  key={vitrage.id} 
                  className={`vitrage-card ${selectedVitrage?.id === vitrage.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVitrage(vitrage)}
                >
                  <div className="vitrage-name">{vitrage.name}</div>
                  <div className="vitrage-info">
                    {vitrage.siteManager && (
                      <div>Начальник участка: {vitrage.siteManager}</div>
                    )}
                    {vitrage.creationDate && (
                      <div>Дата создания: {new Date(vitrage.creationDate).toLocaleDateString('ru-RU')}</div>
                    )}
                    <div>Сетка: {vitrage.rows}×{vitrage.cols}</div>
                    <div>Площадь: {getTotalArea(vitrage).toFixed(2)} м²</div>
                    <div>Создан: {vitrage.createdAt.toLocaleDateString('ru-RU')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedVitrage && (
          <div className="vitrage-details">
            <h3>Типовые витражи "{selectedVitrage.name}"</h3>
            {selectedVitrage.siteManager && (
              <p className="vitrage-site-manager"><strong>Начальник участка:</strong> {selectedVitrage.siteManager}</p>
            )}
            {selectedVitrage.creationDate && (
              <p className="vitrage-site-manager"><strong>Дата создания:</strong> {new Date(selectedVitrage.creationDate).toLocaleDateString('ru-RU')}</p>
            )}

            <div className="specification-table">
              <table>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Тип элемента</th>
                    <th>Обозначение</th>
                    <th>Размеры (мм)</th>
                    <th>Площадь (м²)</th>
                    <th>Формула</th>
                    <th>Примечания</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateSpecification(selectedVitrage).map((specItem, typeIndex) => (
                    specItem.items.map((item, itemIndex) => (
                      <tr key={`${typeIndex}-${itemIndex}`}>
                        <td>{typeIndex * 100 + itemIndex + 1}</td>
                        <td>{getTypeLabel(specItem.type)}</td>
                        <td>{item.label}</td>
                        <td>{item.width} × {item.height}</td>
                        <td>{item.area.toFixed(3)}</td>
                        <td>{item.formula || '—'}</td>
                        <td>{item.isStemalit ? 'Стемалит' : '—'}</td>
                      </tr>
                    ))
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={4}><strong>Итого:</strong></td>
                    <td><strong>{getTotalArea(selectedVitrage).toFixed(3)} м²</strong></td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="specification-summary">
              <h4>Сводка по типам элементов</h4>
              <div className="summary-grid">
                {calculateSpecification(selectedVitrage).map((item, index) => (
                  <div key={index} className="summary-item">
                    <div className="summary-type">{getTypeLabel(item.type)}</div>
                    <div className="summary-count"><span>Количество:</span> <strong>{item.count} шт</strong></div>
                    <div className="summary-area"><span>Площадь:</span> <strong>{item.totalArea.toFixed(3)} м²</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}