import type { VitrageItem } from '../../types'

interface WorkspaceHeaderProps {
  vitrage: VitrageItem
  zoom: number
  onBack: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export function WorkspaceHeader({
  vitrage,
  zoom,
  onBack,
  onZoomIn,
  onZoomOut,
  onResetZoom
}: WorkspaceHeaderProps) {
  return (
    <div className="workspace-header">
      <div className="header-left">
        <h2 className="vitrage-title">{vitrage.name}</h2>
        {vitrage.siteManager && (
          <p className="vitrage-subtitle">Начальник участка: {vitrage.siteManager}</p>
        )}
        {vitrage.creationDate && (
          <p className="vitrage-subtitle">Дата создания: {vitrage.creationDate}</p>
        )}
      </div>

      <div className="header-controls">
        <button className="action-btn back-btn" onClick={onBack} title="Вернуться к списку">
          <span className="btn-icon">←</span>
          <span className="btn-text">Назад к списку</span>
        </button>

        <div className="zoom-controls">
          <button className="zoom-btn" onClick={onZoomOut} title="Уменьшить (Ctrl + колесо мыши)">−</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={onZoomIn} title="Увеличить (Ctrl + колесо мыши)">+</button>
          <button className="zoom-btn" onClick={onResetZoom} title="Сбросить масштаб">⟲</button>
        </div>
      </div>
    </div>
  )
}
