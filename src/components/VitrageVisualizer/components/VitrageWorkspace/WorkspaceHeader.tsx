import React from 'react'
import type { CreatedVitrage } from '../../types'

interface WorkspaceHeaderProps {
  vitrage: CreatedVitrage
  zoom: number
  onNewVitrage: () => void
  onSaveVitrage: () => void
  onMergeSegments: () => void
  onUnmergeSegments: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export function WorkspaceHeader({
  vitrage,
  zoom,
  onNewVitrage,
  onSaveVitrage,
  onMergeSegments,
  onUnmergeSegments,
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
          <p className="vitrage-subtitle">Дата создания: {new Date(vitrage.creationDate).toLocaleDateString('ru-RU')}</p>
        )}
      </div>

      <div className="header-controls">
        <button className="action-btn new-btn" onClick={onNewVitrage} title="Создать новый витраж">
          <span className="btn-icon">+</span>
          <span className="btn-text">Новый витраж</span>
        </button>
        <button className="action-btn save-btn" onClick={onSaveVitrage} title="Сохранить текущий витраж">
          <span className="btn-icon">💾</span>
          <span className="btn-text">Сохранить витраж</span>
        </button>
        <button className="action-btn merge-btn" onClick={onMergeSegments} title="Объединить выбранные сегменты">
          <span className="btn-icon">⊞</span>
          <span className="btn-text">Объединить сегменты</span>
        </button>
        <button className="action-btn unmerge-btn" onClick={onUnmergeSegments} title="Разъединить выбранный сегмент">
          <span className="btn-icon">⊟</span>
          <span className="btn-text">Разъединить сегменты</span>
        </button>

        <div className="zoom-controls">
          <button className="zoom-btn" onClick={onZoomOut} title="Уменьшить (Ctrl + колесо мыши)">
            −
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="zoom-btn" onClick={onZoomIn} title="Увеличить (Ctrl + колесо мыши)">
            +
          </button>
          <button className="zoom-btn" onClick={onResetZoom} title="Сбросить масштаб">
            ⟲
          </button>
        </div>
      </div>
    </div>
  )
}
