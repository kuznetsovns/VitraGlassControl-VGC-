import type { VitrageItem, ProjectObject } from '../../types'
import type { SegmentDefectData } from '../../../../services/defectStorage'
import { getObjectName, getVersionName, calculateTotalArea } from '../../utils/vitrageHelpers'

interface VitrageCardProps {
  vitrage: VitrageItem
  objects: ProjectObject[]
  segmentDefectsData: Map<string, SegmentDefectData>
  onClick: (vitrage: VitrageItem) => void
}

export function VitrageCard({ vitrage, objects, segmentDefectsData, onClick }: VitrageCardProps) {
  // Подсчитываем количество дефектов для данного витража
  const defectsCount = Array.from(segmentDefectsData.entries())
    .filter(([key, data]) => key.startsWith(vitrage.id) && data.defects.length > 0)
    .reduce((total, [, data]) => total + data.defects.length, 0)

  const hasDefects = defectsCount > 0

  return (
    <div
      className={`vitrage-card ${hasDefects ? 'has-defects' : ''}`}
      onClick={() => onClick(vitrage)}
    >
      <div className="vitrage-card-header">
        <h3>{vitrage.name}</h3>
        <div className="vitrage-badges">
          <span className="vitrage-badge">
            {vitrage.rows} × {vitrage.cols}
          </span>
          {hasDefects && (
            <span className="vitrage-badge defects-badge" title={`Найдено дефектов: ${defectsCount}`}>
              ⚠️ {defectsCount}
            </span>
          )}
        </div>
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
