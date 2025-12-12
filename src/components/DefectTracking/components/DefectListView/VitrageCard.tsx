import type { VitrageItem, ProjectObject } from '../../types'
import type { SegmentDefectData } from '../../../../services/defectStorage'
import { getObjectName, getVersionName, calculateTotalArea } from '../../utils/vitrageHelpers'

interface VitrageCardProps {
  vitrage: VitrageItem
  objects: ProjectObject[]
  segmentDefectsData: Map<string, SegmentDefectData>
  onClick: (vitrage: VitrageItem) => void
  onDelete?: (vitrage: VitrageItem) => void
}

export function VitrageCard({ vitrage, objects, segmentDefectsData, onClick, onDelete }: VitrageCardProps) {
  // Собираем дефекты по сегментам (из segmentDefects или из segmentDefectsData)
  const segmentDefects: Map<string, string[]> = new Map()

  // Сначала проверяем segmentDefects из витража (данные из Supabase)
  if (vitrage.segmentDefects) {
    Object.entries(vitrage.segmentDefects).forEach(([segmentKey, data]) => {
      if (data.defects && data.defects.length > 0) {
        segmentDefects.set(segmentKey, data.defects)
      }
    })
  }

  // Также проверяем segmentDefectsData (локальные данные)
  Array.from(segmentDefectsData.entries())
    .filter(([key]) => key.startsWith(vitrage.id))
    .forEach(([key, data]) => {
      if (data.defects.length > 0) {
        const segmentId = key.replace(`${vitrage.id}-`, '')
        segmentDefects.set(segmentId, data.defects)
      }
    })

  const defectsCount = Array.from(segmentDefects.values())
    .reduce((total, defects) => total + defects.length, 0)

  const hasDefects = defectsCount > 0

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm(`Удалить витраж "${vitrage.name}" из дефектовки?`)) {
      onDelete(vitrage)
    }
  }

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
          {onDelete && (
            <button
              className="delete-vitrage-btn"
              onClick={handleDelete}
              title="Удалить из дефектовки"
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="vitrage-card-info">
        <div className="info-row">
          <span className="info-label">Объект:</span>
          <span className="info-value">{getObjectName(vitrage, objects)}</span>
        </div>
        {vitrage.corpus && (
          <div className="info-row">
            <span className="info-label">Корпус:</span>
            <span className="info-value">{vitrage.corpus}</span>
          </div>
        )}
        {vitrage.section && (
          <div className="info-row">
            <span className="info-label">Секция:</span>
            <span className="info-value">{vitrage.section}</span>
          </div>
        )}
        {vitrage.floor && (
          <div className="info-row">
            <span className="info-label">Этаж:</span>
            <span className="info-value">{vitrage.floor}</span>
          </div>
        )}
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

      {/* Список дефектов по сегментам */}
      {hasDefects && (
        <div className="vitrage-defects-summary" style={{
          marginTop: '12px',
          padding: '12px',
          background: '#fff3cd',
          borderRadius: '4px',
          border: '1px solid #ffc107'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#856404' }}>
            📋 Дефекты по сегментам:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from(segmentDefects.entries()).map(([segmentKey, defects]) => {
              // Извлекаем индекс сегмента из ключа (например, "segment-5" → 5)
              const segmentIndexMatch = segmentKey.match(/segment-(\d+)/)
              const segmentIndex = segmentIndexMatch ? parseInt(segmentIndexMatch[1]) : null

              // Получаем ID сегмента из массива segments
              let segmentId = segmentKey.replace('segment-', '')
              if (segmentIndex !== null && vitrage.segments[segmentIndex]) {
                segmentId = vitrage.segments[segmentIndex].id || segmentId
              }

              return (
                <div key={segmentKey} style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: 'white',
                  borderRadius: '3px',
                  border: '1px solid #ffc107'
                }}>
                  <strong style={{ color: '#d9534f' }}>
                    Сегмент {segmentId}:
                  </strong>
                  {' '}
                  <span style={{ color: '#333' }}>
                    {defects.join(', ')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
