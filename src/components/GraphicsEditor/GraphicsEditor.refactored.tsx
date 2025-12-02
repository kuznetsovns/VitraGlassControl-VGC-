import { useEffect, useCallback } from 'react'
import './GraphicsEditor.css'
import type { GraphicsEditorProps, VitrageSegment } from './types'
import { useGraphicsEditor, useCanvasDrawing } from './hooks'
import { getMousePos, findSegmentAt, findDimensionAt, canMergeSegments } from './utils'
import { calculateProportionalSizes } from './utils/vitrageCalculations'

export default function GraphicsEditor({ width, height }: GraphicsEditorProps) {
  const editor = useGraphicsEditor()

  const isProfileNeeded = useCallback((row: number, col: number, direction: 'horizontal' | 'vertical'): boolean => {
    if (!editor.vitrageGrid) return true

    const activeSegments = editor.vitrageGrid.segments.filter(s => !s.merged)

    if (direction === 'horizontal') {
      return !activeSegments.some(segment =>
        segment.row < row &&
        segment.row + (segment.rowSpan || 1) > row &&
        segment.col <= col &&
        segment.col + (segment.colSpan || 1) > col &&
        (segment.rowSpan || 1) > 1
      )
    } else {
      return !activeSegments.some(segment =>
        segment.col < col &&
        segment.col + (segment.colSpan || 1) > col &&
        segment.row <= row &&
        segment.row + (segment.rowSpan || 1) > row &&
        (segment.colSpan || 1) > 1
      )
    }
  }, [editor.vitrageGrid])

  const { drawCanvas } = useCanvasDrawing(
    editor.canvasRef,
    editor.vitrageGrid,
    editor.canvasDimensions,
    editor.mergeMode,
    editor.selectedForMerge,
    isProfileNeeded
  )

  // Auto-resize canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      if (editor.containerRef.current && !width && !height) {
        const rect = editor.containerRef.current.getBoundingClientRect()
        editor.setCanvasDimensions({
          width: Math.floor(rect.width - 40),
          height: Math.floor(rect.height - 40)
        })
      }
    }

    const timeoutId = setTimeout(updateCanvasSize, 100)
    const handleResize = () => {
      setTimeout(updateCanvasSize, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [width, height, editor])

  // Draw canvas on update
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleMergeSelection = (segment: VitrageSegment) => {
    const isAlreadySelected = editor.selectedForMerge.some(s => s.id === segment.id)

    if (isAlreadySelected) {
      editor.setSelectedForMerge(prev => prev.filter(s => s.id !== segment.id))
    } else {
      editor.setSelectedForMerge(prev => [...prev, segment])
    }
  }

  const handleMergeSegments = () => {
    if (!editor.vitrageGrid || editor.selectedForMerge.length < 2 || !canMergeSegments(editor.selectedForMerge)) {
      return
    }

    const mainSegment = editor.selectedForMerge.reduce((prev, curr) => {
      if (curr.row < prev.row || (curr.row === prev.row && curr.col < prev.col)) {
        return curr
      }
      return prev
    })

    const minRow = Math.min(...editor.selectedForMerge.map(s => s.row))
    const maxRow = Math.max(...editor.selectedForMerge.map(s => s.row))
    const minCol = Math.min(...editor.selectedForMerge.map(s => s.col))
    const maxCol = Math.max(...editor.selectedForMerge.map(s => s.col))

    const rowSpan = maxRow - minRow + 1
    const colSpan = maxCol - minCol + 1

    let totalRealWidth = 0
    let totalRealHeight = 0
    let hasRealDimensions = false

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const segment = editor.selectedForMerge.find(s => s.row === r && s.col === c)
        if (segment && segment.realWidth && segment.realHeight) {
          if (r === minRow) totalRealWidth += segment.realWidth
          if (c === minCol) totalRealHeight += segment.realHeight
          hasRealDimensions = true
        }
      }
    }

    const updatedSegments = editor.vitrageGrid.segments.map(segment => {
      if (segment.id === mainSegment.id) {
        return {
          ...segment,
          rowSpan,
          colSpan,
          realWidth: hasRealDimensions ? totalRealWidth : (segment.realWidth || 0) * colSpan,
          realHeight: hasRealDimensions ? totalRealHeight : (segment.realHeight || 0) * rowSpan,
          mergedWith: editor.selectedForMerge.filter(s => s.id !== mainSegment.id).map(s => s.id)
        }
      } else if (editor.selectedForMerge.some(s => s.id === segment.id)) {
        return { ...segment, merged: true }
      }
      return segment
    })

    editor.setVitrageGrid({
      ...editor.vitrageGrid,
      segments: updatedSegments
    })

    editor.setSelectedForMerge([])
    editor.setMergeMode(false)

    setTimeout(() => {
      const updated = calculateProportionalSizes(editor.vitrageGrid!, editor.canvasDimensions)
      editor.setVitrageGrid(updated)
    }, 50)
  }

  const handleDimensionEdit = (newValue: number) => {
    if (!editor.editingDimension || !editor.vitrageGrid) return

    const segment = editor.vitrageGrid.segments.find(s => s.id === editor.editingDimension!.segmentId)
    if (!segment) return

    const property = editor.editingDimension.type === 'width' ? 'realWidth' : 'realHeight'
    editor.updateSegmentProperties(property, newValue)
    editor.setEditingDimension(null)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e, editor.canvasRef)
    const segment = findSegmentAt(pos.x, pos.y, editor.vitrageGrid)
    const dimension = findDimensionAt(pos.x, pos.y, editor.vitrageGrid)

    if (editor.mergeMode) {
      if (segment && !segment.merged) {
        handleMergeSelection(segment)
      }
    } else if (dimension) {
      editor.setEditingDimension({
        segmentId: dimension.segment.id,
        type: dimension.type,
        x: dimension.type === 'width' ? dimension.segment.x + dimension.segment.width / 2 : dimension.segment.x - 20,
        y: dimension.type === 'width' ? dimension.segment.y - 9 : dimension.segment.y + dimension.segment.height / 2,
        value: dimension.type === 'width' ? (dimension.segment.realWidth || 0) : (dimension.segment.realHeight || 0)
      })
    } else if (segment) {
      editor.handleSegmentClick(segment)
    } else {
      if (editor.vitrageGrid) {
        editor.setVitrageGrid({
          ...editor.vitrageGrid,
          segments: editor.vitrageGrid.segments.map(s => ({ ...s, selected: false }))
        })
        editor.setSelectedSegment(null)
        editor.setShowProperties(false)
      }
    }
  }

  const saveVitrage = () => {
    if (!editor.vitrageGrid) return

    try {
      const existingVitrages = localStorage.getItem('saved-vitrages')
      let vitrages: any[] = []

      if (existingVitrages) {
        vitrages = JSON.parse(existingVitrages)
      }

      const existingIndex = vitrages.findIndex(v => v.id === editor.vitrageGrid!.id)

      if (existingIndex >= 0) {
        vitrages[existingIndex] = editor.vitrageGrid
        alert(`Витраж "${editor.vitrageGrid.name}" обновлен в спецификации!`)
      } else {
        vitrages.push(editor.vitrageGrid)
        alert(`Витраж "${editor.vitrageGrid.name}" сохранен в спецификации!`)
      }

      localStorage.setItem('saved-vitrages', JSON.stringify(vitrages))
    } catch (error) {
      console.error('Ошибка при сохранении витража:', error)
      alert('Ошибка при сохранении витража')
    }
  }

  return (
    <div className="graphics-editor">
      {editor.showGridConfig && (
        <div className="grid-config-panel">
          <h3>Конфигурация витража</h3>

          <div className="config-group">
            <div className="config-item">
              <label>Маркировка витража:</label>
              <input
                type="text"
                value={editor.vitrageName}
                onChange={(e) => editor.setVitrageName(e.target.value)}
                placeholder="Например: В-01, ВТ-003"
              />
            </div>

            <div className="config-item">
              <label>Количество сегментов по горизонтали:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={editor.gridCols}
                onChange={(e) => editor.setGridCols(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="config-item">
              <label>Количество сегментов по вертикали:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={editor.gridRows}
                onChange={(e) => editor.setGridRows(parseInt(e.target.value) || 1)}
              />
            </div>

            <button className="create-grid-btn" onClick={editor.createGrid}>
              Создать витраж
            </button>
          </div>
        </div>
      )}

      {!editor.showGridConfig && (
        <>
          <div className="editor-toolbar">
            <div className="tool-group">
              <button onClick={editor.clearCanvas} title="Новый витраж">
                🗑️ Новый витраж
              </button>
              <button onClick={saveVitrage} title="Сохранить витраж в спецификацию">
                💾 Сохранить витраж
              </button>
              <button
                className={editor.mergeMode ? 'active' : ''}
                onClick={() => {
                  editor.setMergeMode(!editor.mergeMode)
                  editor.setSelectedForMerge([])
                  if (!editor.mergeMode) {
                    editor.setShowProperties(false)
                    editor.setSelectedSegment(null)
                  }
                }}
                title="Объединить сегменты"
              >
                🔗 Объединить
              </button>
              {editor.mergeMode && editor.selectedForMerge.length >= 2 && canMergeSegments(editor.selectedForMerge) && (
                <button
                  onClick={handleMergeSegments}
                  className="merge-confirm-btn"
                  title="Подтвердить объединение"
                >
                  ✓ Объединить {editor.selectedForMerge.length} сегментов
                </button>
              )}
            </div>
          </div>

          <div ref={editor.containerRef} className="editor-workspace">
            <canvas
              ref={editor.canvasRef}
              width={editor.canvasDimensions.width}
              height={editor.canvasDimensions.height}
              onMouseDown={handleMouseDown}
              className="drawing-canvas"
            />

            {editor.editingDimension && (
              <input
                type="number"
                value={editor.editingDimension.value}
                onChange={(e) => editor.setEditingDimension({
                  ...editor.editingDimension,
                  value: parseInt(e.target.value) || 0
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDimensionEdit(editor.editingDimension!.value)
                  } else if (e.key === 'Escape') {
                    editor.setEditingDimension(null)
                  }
                }}
                onBlur={() => handleDimensionEdit(editor.editingDimension!.value)}
                autoFocus
                style={{
                  position: 'absolute',
                  left: editor.editingDimension.x - 25,
                  top: editor.editingDimension.y - 10,
                  width: '50px',
                  height: '20px',
                  fontSize: '10px',
                  textAlign: 'center',
                  border: '1px solid #4a90e2',
                  borderRadius: '2px',
                  background: 'white',
                  zIndex: 1001
                }}
              />
            )}

            {editor.showProperties && editor.selectedSegment && !editor.mergeMode && (
              <div className="properties-panel">
                <h3>Свойства сегмента</h3>

                <div className="property-group">
                  <label>Тип сегмента:</label>
                  <select
                    value={editor.selectedSegment.type}
                    onChange={(e) => editor.updateSegmentProperties('type', e.target.value)}
                  >
                    <option value="empty">Пустой</option>
                    <option value="glass">Стеклопакет</option>
                    <option value="ventilation">Вентрешетка</option>
                    <option value="sandwich">Сэндвич-панель</option>
                    <option value="casement">Створка</option>
                    <option value="door">Дверной блок</option>
                  </select>
                </div>

                <div className="property-group">
                  <label>Ширина (мм):</label>
                  <input
                    type="number"
                    min="1"
                    value={editor.selectedSegment.realWidth || 0}
                    onChange={(e) => editor.updateSegmentProperties('realWidth', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="property-group">
                  <label>Высота (мм):</label>
                  <input
                    type="number"
                    min="1"
                    value={editor.selectedSegment.realHeight || 0}
                    onChange={(e) => editor.updateSegmentProperties('realHeight', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="property-group">
                  <label>Обозначение:</label>
                  <input
                    type="text"
                    value={editor.selectedSegment.label || ''}
                    onChange={(e) => editor.updateSegmentProperties('label', e.target.value)}
                    placeholder="Например: G1, V1"
                  />
                </div>

                {editor.selectedSegment.type === 'glass' && (
                  <div className="property-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editor.selectedSegment.isStemalit || false}
                        onChange={(e) => editor.updateSegmentProperties('isStemalit', e.target.checked)}
                      />
                      Стемалит
                    </label>
                  </div>
                )}

                {editor.selectedSegment.type !== 'ventilation' && (
                  <div className="property-group">
                    <label>Формула:</label>
                    <input
                      type="text"
                      value={editor.selectedSegment.formula || ''}
                      onChange={(e) => editor.updateSegmentProperties('formula', e.target.value)}
                      placeholder={editor.selectedSegment.type === 'glass' ? 'Например: 4М1-16-4М1' : 'Формула элемента'}
                    />
                  </div>
                )}

                <button
                  className="close-properties"
                  onClick={() => editor.setShowProperties(false)}
                >
                  Закрыть
                </button>
              </div>
            )}

            {editor.mergeMode && (
              <div className="merge-info-panel">
                <h3>Режим объединения</h3>
                <p>Выберите 2 или более соседних сегмента для объединения</p>
                <p>Выбрано сегментов: {editor.selectedForMerge.length}</p>
                {editor.selectedForMerge.length >= 2 && !canMergeSegments(editor.selectedForMerge) && (
                  <p className="error">Сегменты должны быть соседними</p>
                )}
              </div>
            )}
          </div>

          <div className="editor-info">
            <div className="stats">
              {editor.vitrageGrid && (
                <>
                  <strong>{editor.vitrageGrid.name}</strong> |
                  Сетка: {editor.vitrageGrid.rows} × {editor.vitrageGrid.cols} |
                  Стеклопакетов: {editor.vitrageGrid.segments.filter(s => s.type === 'glass').length} |
                  Вентрешеток: {editor.vitrageGrid.segments.filter(s => s.type === 'ventilation').length}
                </>
              )}
            </div>
            <div className="instructions">
              Кликните на сегмент для настройки параметров или на размеры для быстрого редактирования
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export type { GraphicsEditorProps } from './types'
