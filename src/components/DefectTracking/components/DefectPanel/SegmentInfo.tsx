import type { VitrageItem } from '../../types'

interface SegmentInfoProps {
  selectedSegmentId: string
  selectedVitrage: VitrageItem
}

export function SegmentInfo({ selectedSegmentId, selectedVitrage }: SegmentInfoProps) {
  const segment = selectedVitrage.segments.find((s, index) => (index + 1).toString() === selectedSegmentId)

  return (
    <div className="segment-info">
      <h4>Информация о сегменте</h4>
      <div className="info-row">
        <span className="info-label">ID:</span>
        <span className="info-value">{selectedSegmentId}</span>
      </div>
      {segment && (
        <>
          <div className="info-row">
            <span className="info-label">Тип:</span>
            <span className="info-value">{segment.type || 'Не указан'}</span>
          </div>
          {segment.width && (
            <div className="info-row">
              <span className="info-label">Ширина:</span>
              <span className="info-value">{segment.width} мм</span>
            </div>
          )}
          {segment.height && (
            <div className="info-row">
              <span className="info-label">Высота:</span>
              <span className="info-value">{segment.height} мм</span>
            </div>
          )}
          {segment.formula && (
            <div className="info-row">
              <span className="info-label">Формула:</span>
              <span className="info-value">{segment.formula}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
