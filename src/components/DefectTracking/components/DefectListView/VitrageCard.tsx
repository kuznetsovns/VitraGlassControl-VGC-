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
  // Подсчитываем количество дефектов и исправленных сегментов из segmentDefectsData (Map)
  let defectsFromMap = 0
  let defectiveSegmentsFromMap = 0
  Array.from(segmentDefectsData.entries())
    .filter(([key]) => key.startsWith(vitrage.id))
    .forEach(([, data]) => {
      if (data.defects && data.defects.length > 0) {
        defectsFromMap += data.defects.length
        defectiveSegmentsFromMap++
      }
    })

  // Также проверяем дефекты, хранящиеся напрямую в витраже (из placedVitrageStorage)
  let defectsFromVitrage = 0
  let defectiveSegmentsFromVitrage = 0
  let fixedSegmentsCount = 0

  if (vitrage.segmentDefects) {
    for (const segmentKey in vitrage.segmentDefects) {
      const segment = vitrage.segmentDefects[segmentKey]
      if (segment?.defects && segment.defects.length > 0) {
        defectsFromVitrage += segment.defects.length
        defectiveSegmentsFromVitrage++
      }
      // Считаем исправленные сегменты (без дефектов и со статусом fixed)
      if (segment?.status === 'fixed' && (!segment.defects || segment.defects.length === 0)) {
        fixedSegmentsCount++
      }
    }
  }

  // Используем актуальные данные о дефектах (не из закешированного totalDefectsCount)
  const defectsCount = Math.max(defectsFromMap, defectsFromVitrage)
  const defectiveSegmentsCount = Math.max(defectiveSegmentsFromMap, defectiveSegmentsFromVitrage)

  const hasDefects = defectsCount > 0
  const hasFixedSegments = fixedSegmentsCount > 0

  // Карточка зелёная только если ВСЕ дефекты исправлены (нет активных дефектов, но есть исправленные)
  const allFixed = hasFixedSegments && !hasDefects

  // Определяем CSS класс для карточки
  let cardClass = 'vitrage-card'
  if (hasDefects) {
    cardClass += ' has-defects'
  } else if (allFixed) {
    cardClass += ' all-fixed'
  }

  return (
    <div
      className={cardClass}
      onClick={() => onClick(vitrage)}
    >
      <div className="vitrage-card-header">
        <h3>{vitrage.name}</h3>
        <div className="vitrage-badges">
          <span className="vitrage-badge">
            {vitrage.rows} × {vitrage.cols}
          </span>
          {hasDefects && (
            <span className="vitrage-badge defects-badge" title={`Сегментов с дефектами: ${defectiveSegmentsCount}, всего дефектов: ${defectsCount}`}>
              ⚠️ {defectiveSegmentsCount}
            </span>
          )}
          {hasFixedSegments && (
            <span className="vitrage-badge fixed-badge" title={`Исправлено сегментов: ${fixedSegmentsCount}`}>
              ✅ {fixedSegmentsCount}
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
