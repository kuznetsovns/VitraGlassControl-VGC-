import type { VitrageItem } from '../../types'

interface SegmentInfoProps {
  selectedSegmentId: string
  selectedVitrage: VitrageItem
}

export function SegmentInfo({ selectedSegmentId, selectedVitrage }: SegmentInfoProps) {
  // selectedSegmentId is in format "segment-0-0", extract row and col
  const match = selectedSegmentId.match(/segment-(\d+)-(\d+)/)
  let segment = null
  let displayId = selectedSegmentId

  if (match) {
    const row = parseInt(match[1])
    const col = parseInt(match[2])
    const index = row * selectedVitrage.cols + col
    segment = selectedVitrage.segments[index]
    // Use segment.id which contains the full ID
    if (segment) {
      displayId = segment.id
    }
  }

  return (
    <div className="segment-info">
      <h4>Информация о сегменте</h4>
      <div className="info-row">
        <span className="info-label">ID:</span>
        <span className="info-value">{displayId}</span>
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
