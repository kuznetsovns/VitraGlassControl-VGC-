import React, { useRef, useEffect } from 'react'
import type { SegmentProperties } from '../../types'

interface PropertiesFormProps {
  selectedSegment: number | null
  segmentProperties: SegmentProperties
  onPropertyChange: (segmentId: number, property: 'type' | 'width' | 'height' | 'formula' | 'label', value: string) => void
  onSaveSegment: () => void
  onClose: () => void
}

export function PropertiesForm({
  selectedSegment,
  segmentProperties,
  onPropertyChange,
  onSaveSegment,
  onClose
}: PropertiesFormProps) {
  const typeRef = useRef<HTMLSelectElement>(null)
  const labelRef = useRef<HTMLInputElement>(null)
  const formulaRef = useRef<HTMLInputElement>(null)
  const widthRef = useRef<HTMLInputElement>(null)
  const heightRef = useRef<HTMLInputElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  if (!selectedSegment) return null

  const props = segmentProperties[selectedSegment] || {
    type: 'Пустой',
    width: '',
    height: '',
    formula: '',
    label: ''
  }

  useEffect(() => {
    typeRef.current?.focus()
  }, [selectedSegment])

  const handleKeyDown = (key: string, nextRef: React.RefObject<HTMLElement>) => {
    if (key === 'Enter') {
      nextRef.current?.focus()
    }
  }

  return (
    <div className="properties-panel-sidebar">
      <div className="properties-panel-header">
        <h3>Свойства сегмента #{selectedSegment}</h3>
        <button className="close-panel-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="properties-form">
        <div className="form-group">
          <label htmlFor="segment-type">Тип заполнения:</label>
          <select
            ref={typeRef}
            id="segment-type"
            value={props.type}
            onChange={(e) => onPropertyChange(selectedSegment, 'type', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e.key, labelRef)}
            className="property-select"
          >
            <option value="Пустой">Пустой</option>
            <option value="Стеклопакет">Стеклопакет</option>
            <option value="Стемалит">Стемалит</option>
            <option value="Вент решётка">Вент решётка</option>
            <option value="Створка">Створка</option>
            <option value="Дверной блок">Дверной блок</option>
            <option value="Сэндвич-панель">Сэндвич-панель</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="segment-label">Обозначение сегмента:</label>
          <input
            ref={labelRef}
            id="segment-label"
            type="text"
            value={props.label}
            onChange={(e) => onPropertyChange(selectedSegment, 'label', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e.key, formulaRef)}
            placeholder="Например: СП-1, В-01"
            className="property-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="segment-formula">Формула стеклопакета:</label>
          <input
            ref={formulaRef}
            id="segment-formula"
            type="text"
            value={props.formula}
            onChange={(e) => onPropertyChange(selectedSegment, 'formula', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e.key, widthRef)}
            placeholder="Например: 4М1-16-4М1"
            className="property-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="segment-width">Ширина (мм):</label>
          <input
            ref={widthRef}
            id="segment-width"
            type="number"
            value={props.width}
            onChange={(e) => onPropertyChange(selectedSegment, 'width', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e.key, heightRef)}
            placeholder="Например: 1000"
            className="property-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="segment-height">Высота (мм):</label>
          <input
            ref={heightRef}
            id="segment-height"
            type="number"
            value={props.height}
            onChange={(e) => onPropertyChange(selectedSegment, 'height', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e.key, saveButtonRef)}
            placeholder="Например: 1500"
            className="property-input"
          />
        </div>
        <button ref={saveButtonRef} className="save-segment-btn" onClick={onSaveSegment}>
          Сохранить
        </button>
      </div>
    </div>
  )
}
