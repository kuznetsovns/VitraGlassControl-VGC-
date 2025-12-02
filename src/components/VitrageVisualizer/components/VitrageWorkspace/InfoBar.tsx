import React from 'react'
import type { CreatedVitrage } from '../../types'

interface InfoBarProps {
  vitrage: CreatedVitrage
}

export function InfoBar({ vitrage }: InfoBarProps) {
  return (
    <div className="vitrage-info-bar">
      <div className="info-bar-item">
        <span className="info-bar-label">Маркировка:</span>
        <span className="info-bar-value">{vitrage.name}</span>
      </div>
      <div className="info-bar-item">
        <span className="info-bar-label">Сетка:</span>
        <span className="info-bar-value">{vitrage.horizontal} × {vitrage.vertical}</span>
      </div>
      <div className="info-bar-item">
        <span className="info-bar-label">Всего сегментов:</span>
        <span className="info-bar-value">{vitrage.horizontal * vitrage.vertical}</span>
      </div>
    </div>
  )
}
