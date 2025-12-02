import { useState } from 'react'
import './VitrageVisualizer.css'
import type { VitrageVisualizerProps, SegmentProperties, CreatedVitrage } from './types'
import { vitrageStorage } from '../../services/vitrageStorage'
import { useVitrageForm, useSegmentSelection, useSegmentProperties, useCanvasControls } from './hooks'
import { WorkspaceHeader, WorkspaceCanvas, InfoBar } from './components/VitrageWorkspace'
import { PropertiesForm } from './components/PropertiesPanel'
import { ConfigForm, PreviewPanel } from './components/ConfigurationForm'
import { mergeSegments, unmergeSegments } from './utils/segmentMerging'

export default function VitrageVisualizer({ selectedObject }: VitrageVisualizerProps) {
  const formHook = useVitrageForm()
  const selectionHook = useSegmentSelection()
  const propertiesHook = useSegmentProperties()
  const canvasHook = useCanvasControls()

  const handleCreateVitrage = () => {
    const horizontal = parseInt(formHook.horizontalSegments)
    const vertical = parseInt(formHook.verticalSegments)

    if (!formHook.vitrageName.trim()) {
      alert('Пожалуйста, укажите маркировку витража')
      return
    }

    if (!horizontal || horizontal < 1 || horizontal > 10) {
      alert('Пожалуйста, укажите количество сегментов по горизонтали (1-10)')
      return
    }

    if (!vertical || vertical < 1 || vertical > 10) {
      alert('Пожалуйста, укажите количество сегментов по вертикали (1-10)')
      return
    }

    formHook.setCreatedVitrage({
      name: formHook.vitrageName,
      siteManager: formHook.siteManager.trim() || undefined,
      creationDate: formHook.creationDate.trim() || undefined,
      horizontal,
      vertical
    })
  }

  const handleNewVitrage = () => {
    formHook.resetForm()
    selectionHook.clearSelection()
    propertiesHook.clearProperties()
    canvasHook.setZoom(1)
    canvasHook.setPan({ x: 0, y: 0 })
  }

  const handleSaveVitrage = async () => {
    if (!formHook.createdVitrage) {
      console.error('Витраж не создан')
      return
    }

    if (!selectedObject) {
      alert('Объект не выбран. Пожалуйста, выберите объект на главной странице.')
      return
    }

    try {
      const cols = formHook.createdVitrage.horizontal
      const rows = formHook.createdVitrage.vertical

      // Преобразуем данные
      const segments = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const segmentId = row * cols + col + 1
          const props = propertiesHook.segmentProperties[segmentId]

          segments.push({
            id: `${row}-${col}`,
            type: props?.type || 'Пустой',
            width: props?.width ? parseFloat(props.width) : undefined,
            height: props?.height ? parseFloat(props.height) : undefined,
            formula: props?.formula || undefined,
            label: props?.label || `${segmentId}`
          })
        }
      }

      const vitrageData = {
        name: formHook.createdVitrage.name,
        siteManager: formHook.createdVitrage.siteManager,
        creationDate: formHook.createdVitrage.creationDate,
        objectId: selectedObject.id,
        objectName: selectedObject.name,
        rows,
        cols,
        segments,
        segmentProperties: propertiesHook.segmentProperties,
        totalWidth: 600,
        totalHeight: 400,
        svgDrawing: ''
      }

      const { data: savedVitrage, source } = await vitrageStorage.create(vitrageData)

      if (savedVitrage) {
        const storageInfo = source === 'supabase'
          ? '☁️ Сохранено в облаке (Supabase)'
          : '📦 Сохранено локально (localStorage)'

        alert(`Витраж "${formHook.createdVitrage.name}" успешно сохранён!\n\n${storageInfo}\n\nПараметры:\n- Объект: ${selectedObject.name}\n- Сетка: ${formHook.createdVitrage.horizontal} × ${formHook.createdVitrage.vertical}\n- Всего сегментов: ${formHook.createdVitrage.horizontal * formHook.createdVitrage.vertical}\n- Сегментов с данными: ${Object.keys(propertiesHook.segmentProperties).length}\n\nВитраж доступен во вкладке "Спецификация Витражей"`)
      }
    } catch (error) {
      console.error('Ошибка при сохранении витража:', error)
      alert('Произошла ошибка при сохранении витража. Проверьте консоль для деталей.')
    }
  }

  const handlePropertyChange = (segmentId: number, property: 'type' | 'width' | 'height' | 'formula' | 'label', value: string) => {
    if (!formHook.createdVitrage) return
    const cols = formHook.createdVitrage.horizontal
    const rows = formHook.createdVitrage.vertical
    propertiesHook.updateProperty(segmentId, property, value, cols, rows)
  }

  const handleMergeSegments = () => {
    if (selectionHook.selectedSegments.size < 2) {
      alert('Выберите минимум 2 сегмента для объединения.\n\nУдерживайте Ctrl и кликайте на сегменты для выбора.')
      return
    }

    if (!formHook.createdVitrage) return

    try {
      const cols = formHook.createdVitrage.horizontal
      const { newProperties } = mergeSegments(selectionHook.selectedSegments, propertiesHook.segmentProperties, cols)
      propertiesHook.setSegmentProperties(newProperties)
      selectionHook.setSelectedSegments(new Set())
      alert(`Объединено сегментов: ${selectionHook.selectedSegments.size}`)
    } catch (error) {
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleUnmergeSegments = () => {
    try {
      const { newProperties } = unmergeSegments(selectionHook.selectedSegment, selectionHook.selectedSegments, propertiesHook.segmentProperties)
      propertiesHook.setSegmentProperties(newProperties)
      selectionHook.setSelectedSegments(new Set())
      selectionHook.setSelectedSegment(null)
      alert('Сегменты разъединены успешно')
    } catch (error) {
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleSegmentClick = (segmentId: number, ctrlKey: boolean) => {
    selectionHook.selectSegment(segmentId, ctrlKey)
  }

  const handleFormKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  // Если витраж создан - показываем рабочее пространство
  if (formHook.createdVitrage) {
    return (
      <div className="vitrage-visualizer">
        <WorkspaceHeader
          vitrage={formHook.createdVitrage}
          zoom={canvasHook.zoom}
          onNewVitrage={handleNewVitrage}
          onSaveVitrage={handleSaveVitrage}
          onMergeSegments={handleMergeSegments}
          onUnmergeSegments={handleUnmergeSegments}
          onZoomIn={canvasHook.handleZoomIn}
          onZoomOut={canvasHook.handleZoomOut}
          onResetZoom={canvasHook.handleResetZoom}
        />

        <div className="workspace-layout">
          <div className="workspace-container"
            onMouseMove={handleFormKeyDown as any}
            onMouseUp={canvasHook.handleCanvasMouseUp}
          >
            <WorkspaceCanvas
              vitrage={formHook.createdVitrage}
              segmentProperties={propertiesHook.segmentProperties}
              selectedSegment={selectionHook.selectedSegment}
              selectedSegments={selectionHook.selectedSegments}
              onSegmentClick={handleSegmentClick}
              zoom={canvasHook.zoom}
              pan={canvasHook.pan}
              isPanning={canvasHook.isPanning}
              onWheel={canvasHook.handleWheel}
              onMouseDown={canvasHook.handleCanvasMouseDown}
              onMouseMove={canvasHook.handleCanvasMouseMove}
              onMouseUp={canvasHook.handleCanvasMouseUp}
            />

            <div className="workspace-info">
              {selectionHook.selectedSegment && (
                <PropertiesForm
                  selectedSegment={selectionHook.selectedSegment}
                  segmentProperties={propertiesHook.segmentProperties}
                  onPropertyChange={handlePropertyChange}
                  onSaveSegment={() => alert(`Сегмент #${selectionHook.selectedSegment} сохранён`)}
                  onClose={() => selectionHook.setSelectedSegment(null)}
                />
              )}
            </div>
          </div>

          <InfoBar vitrage={formHook.createdVitrage} />
        </div>
      </div>
    )
  }

  // Показываем форму конфигурации
  return (
    <div className="vitrage-visualizer">
      <div className="visualizer-header">
        <h2>Визуализатор Витража</h2>
        {selectedObject && (
          <div className="object-info-badge">
            <span className="object-info-label">Объект:</span>
            <span className="object-info-name">{selectedObject.name}</span>
          </div>
        )}
      </div>

      <div className="config-panel">
        <h3>Конфигурация витража</h3>
        <ConfigForm
          vitrageName={formHook.vitrageName}
          siteManager={formHook.siteManager}
          creationDate={formHook.creationDate}
          horizontalSegments={formHook.horizontalSegments}
          verticalSegments={formHook.verticalSegments}
          onVitrageNameChange={formHook.setVitrageName}
          onSiteManagerChange={formHook.setSiteManager}
          onCreationDateChange={formHook.setCreationDate}
          onHorizontalChange={formHook.setHorizontalSegments}
          onVerticalChange={formHook.setVerticalSegments}
          onCreateVitrage={handleCreateVitrage}
          vitrageNameRef={formHook.vitrageNameRef}
          siteManagerRef={formHook.siteManagerRef}
          creationDateRef={formHook.creationDateRef}
          horizontalRef={formHook.horizontalRef}
          verticalRef={formHook.verticalRef}
          createBtnRef={formHook.createBtnRef}
          onKeyDown={handleFormKeyDown}
        />
      </div>

      <PreviewPanel
        vitrageName={formHook.vitrageName}
        siteManager={formHook.siteManager}
        creationDate={formHook.creationDate}
        horizontalSegments={formHook.horizontalSegments}
        verticalSegments={formHook.verticalSegments}
      />
    </div>
  )
}

export type { VitrageVisualizerProps } from './types'
