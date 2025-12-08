import type { VitrageItem, ProjectObject } from '../../types'
import type { SegmentDefectData } from '../../../../services/defectStorage'
import { VitrageCard } from './VitrageCard'

interface DefectListViewProps {
  vitrages: VitrageItem[]
  objects: ProjectObject[]
  selectedObject?: { id: string; name: string } | null
  storageSource: 'supabase' | 'localStorage'
  segmentDefectsData: Map<string, SegmentDefectData>
  onVitrageClick: (vitrage: VitrageItem) => void
  showExportMenu: boolean
  setShowExportMenu: (show: boolean) => void
  onExportAll: () => void
  onExportSelected: (vitrage: VitrageItem | null) => void
  onExportOnlyWithDefects: () => void
  selectedVitrage: VitrageItem | null
}

export function DefectListView({
  vitrages,
  objects,
  selectedObject,
  storageSource,
  segmentDefectsData,
  onVitrageClick,
  showExportMenu,
  setShowExportMenu,
  onExportAll,
  onExportSelected,
  onExportOnlyWithDefects,
  selectedVitrage
}: DefectListViewProps) {
  return (
    <div className="defect-tracking">
      <div className="main-content-wrapper">
        <div className="defect-header">
          <h2>Дефектовка</h2>
          <div className="header-filters">
            <div className="storage-indicator" title={storageSource === 'supabase' ? 'Данные из облака (Supabase)' : 'Локальные данные (localStorage)'}>
              {storageSource === 'supabase' ? '☁️' : '📦'}
            </div>
            {selectedObject && (
              <div className="object-info-badge">
                <span className="object-info-label">Объект:</span>
                <span className="object-info-name">{selectedObject.name}</span>
              </div>
            )}
            <div className="export-dropdown">
              <button
                className="export-data-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={vitrages.length === 0}
                title="Экспортировать данные о дефектах в Excel"
              >
                📊 Экспорт данных ▾
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button
                    className="export-menu-item"
                    onClick={onExportAll}
                  >
                    📋 Все витражи ({vitrages.length})
                  </button>
                  <button
                    className="export-menu-item"
                    onClick={onExportOnlyWithDefects}
                  >
                    ⚠️ Только с дефектами
                  </button>
                  <button
                    className="export-menu-item"
                    onClick={() => onExportSelected(selectedVitrage)}
                    disabled={!selectedVitrage}
                  >
                    📄 Выбранный витраж
                    {selectedVitrage && ` (${selectedVitrage.name})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="defect-content">
          {!selectedObject ? (
            <div className="empty-state">
              <p>📍 Выберите объект</p>
              <p className="empty-hint">
                Для работы с дефектовкой необходимо выбрать объект в главном меню
              </p>
            </div>
          ) : vitrages.length === 0 ? (
            <div className="empty-state">
              <p>🎯 Нет витражей с дефектами</p>
              <p className="empty-hint">
                Витражи появятся здесь после назначения дефектов на странице "Планы этажей"
              </p>
              <p className="empty-description" style={{fontSize: '13px', marginTop: '12px', opacity: 0.8}}>
                1. Перейдите на страницу "Планы этажей"<br/>
                2. Разместите витражи на плане<br/>
                3. Нажмите "Задать ID секций" и назначьте дефекты<br/>
                4. Витражи с дефектами автоматически появятся здесь
              </p>
            </div>
          ) : (
            <div className="vitrages-grid">
              {vitrages.map(vitrage => (
                <VitrageCard
                  key={vitrage.id}
                  vitrage={vitrage}
                  objects={objects}
                  segmentDefectsData={segmentDefectsData}
                  onClick={onVitrageClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
