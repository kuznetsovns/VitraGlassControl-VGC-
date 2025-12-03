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
  row: number
  col: number
  x: number
  y: number
  width: number
  height: number
  type: 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door'
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
      if (segment.merged || !segment.realWidth || !segment.realHeight) return
      
      if (!specification[segment.type]) {
        specification[segment.type] = {
          type: segment.type,
          count: 0,
          totalArea: 0,
          items: []
        }
      }
      
      const area = (segment.realWidth * segment.realHeight) / 1000000 // переводим в м²
      
      specification[segment.type].count++
      specification[segment.type].totalArea += area
      specification[segment.type].items.push({
        label: segment.label || `${getTypeLabel(segment.type)} ${specification[segment.type].count}`,
        width: segment.realWidth,
        height: segment.realHeight,
        area: area,
        formula: segment.formula,
        isStemalit: segment.isStemalit
      })
    })
    
    return Object.values(specification).filter(item => item.count > 0)
  }

  const getTotalArea = (vitrage: VitrageGrid): number => {
    return vitrage.segments
      .filter(s => !s.merged && s.realWidth && s.realHeight)
      .reduce((total, segment) => total + (segment.realWidth! * segment.realHeight!) / 1000000, 0)
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
          {vitrages.length === 0 ? (
            <div className="empty-state">
              <p>Витражи не созданы</p>
              <p>Перейдите на вкладку "Отрисовка витражей с размерами" для создания витража</p>
            </div>
          ) : (
            <div className="vitrages-grid">
              {vitrages.map((vitrage) => (
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
            <h3>Спецификация витража "{selectedVitrage.name}"</h3>
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
              <h4>Сводка по типам элементов:</h4>
              <div className="summary-grid">
                {calculateSpecification(selectedVitrage).map((item, index) => (
                  <div key={index} className="summary-item">
                    <div className="summary-type">{getTypeLabel(item.type)}</div>
                    <div className="summary-count">Количество: {item.count}</div>
                    <div className="summary-area">Площадь: {item.totalArea.toFixed(3)} м²</div>
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