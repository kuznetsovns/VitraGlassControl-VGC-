import type { VitrageItem, ProjectObject } from '../../types'
import { getObjectName, getVersionName, calculateTotalArea } from '../../utils/vitrageHelpers'

interface VitrageCardProps {
  vitrage: VitrageItem
  objects: ProjectObject[]
  onClick: (vitrage: VitrageItem) => void
}

export function VitrageCard({ vitrage, objects, onClick }: VitrageCardProps) {
  return (
    <div
      className="vitrage-card"
      onClick={() => onClick(vitrage)}
    >
      <div className="vitrage-card-header">
        <h3>{vitrage.name}</h3>
        <span className="vitrage-badge">
          {vitrage.rows} × {vitrage.cols}
        </span>
      </div>
      <div className="vitrage-card-info">
        <div className="info-row">
          <span className="info-label">Объект:</span>
          <span className="info-value">{getObjectName(vitrage, objects)}</span>
        </div>
        {getVersionName(vitrage, objects) && (
          <div className="info-row">
            <span className="info-label">Версия:</span>
            <span className="info-value">{getVersionName(vitrage, objects)}</span>
          </div>
        )}
        {vitrage.siteManager && (
          <div className="info-row">
            <span className="info-label">Начальник участка:</span>
            <span className="info-value">{vitrage.siteManager}</span>
          </div>
        )}
        {vitrage.creationDate && (
          <div className="info-row">
            <span className="info-label">Дата создания:</span>
            <span className="info-value">{vitrage.creationDate}</span>
          </div>
        )}
        <div className="info-row">
          <span className="info-label">Сегментов:</span>
          <span className="info-value">{vitrage.segments.length}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Площадь:</span>
          <span className="info-value">{calculateTotalArea(vitrage).toFixed(2)} м²</span>
        </div>
      </div>
    </div>
  )
}
