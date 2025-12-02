interface InspectionFormProps {
  inspectionDate: string
  inspector: string
  siteManager: string
  onInspectionDateChange: (value: string) => void
  onInspectorChange: (value: string) => void
  onSiteManagerChange: (value: string) => void
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>, nextInputId?: string) => void
}

export function InspectionForm({
  inspectionDate,
  inspector,
  siteManager,
  onInspectionDateChange,
  onInspectorChange,
  onSiteManagerChange,
  onKeyPress
}: InspectionFormProps) {
  return (
    <div className="inspection-info">
      <h4>Информация об осмотре</h4>
      <div className="info-row">
        <span className="info-label">Дата осмотра:</span>
        <input
          id="inspection-date"
          type="date"
          className="info-input"
          value={inspectionDate}
          onChange={(e) => onInspectionDateChange(e.target.value)}
          onKeyPress={(e) => onKeyPress(e, 'inspection-inspector')}
        />
      </div>
      <div className="info-row">
        <span className="info-label">Проверяющий:</span>
        <input
          id="inspection-inspector"
          type="text"
          className="info-input"
          placeholder="Введите ФИО"
          value={inspector}
          onChange={(e) => onInspectorChange(e.target.value)}
          onKeyPress={(e) => onKeyPress(e, 'inspection-manager')}
        />
      </div>
      <div className="info-row">
        <span className="info-label">Начальник участка:</span>
        <input
          id="inspection-manager"
          type="text"
          className="info-input"
          placeholder="Введите ФИО"
          value={siteManager}
          onChange={(e) => onSiteManagerChange(e.target.value)}
          onKeyPress={(e) => onKeyPress(e)}
        />
      </div>
    </div>
  )
}
