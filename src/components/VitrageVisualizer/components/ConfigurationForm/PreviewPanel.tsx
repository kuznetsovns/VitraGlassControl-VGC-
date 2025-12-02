import React from 'react'
import { GridPreview } from '../SVGCanvas'

interface PreviewPanelProps {
  vitrageName: string
  siteManager: string
  creationDate: string
  horizontalSegments: string
  verticalSegments: string
}

export function PreviewPanel({
  vitrageName,
  siteManager,
  creationDate,
  horizontalSegments,
  verticalSegments
}: PreviewPanelProps) {
  const horizontal = parseInt(horizontalSegments) || 0
  const vertical = parseInt(verticalSegments) || 0

  return (
    <div className="preview-panel">
      <h3>Предварительный просмотр</h3>
      <div className="preview-info">
        <p><strong>Маркировка:</strong> {vitrageName || '—'}</p>
        <p><strong>Начальник участка:</strong> {siteManager || '—'}</p>
        <p><strong>Дата создания:</strong> {creationDate ? new Date(creationDate).toLocaleDateString('ru-RU') : '—'}</p>
        <p><strong>Сетка:</strong> {horizontalSegments || '0'} × {verticalSegments || '0'} сегментов</p>
        <p><strong>Всего сегментов:</strong> {horizontal * vertical}</p>
      </div>

      {horizontal > 0 && vertical > 0 && (
        <div className="grid-visualization">
          <GridPreview
            horizontalSegments={horizontal}
            verticalSegments={vertical}
            vitrageName={vitrageName}
          />
        </div>
      )}
    </div>
  )
}
