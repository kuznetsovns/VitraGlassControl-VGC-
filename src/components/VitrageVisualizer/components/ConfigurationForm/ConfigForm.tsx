import React from 'react'

interface ConfigFormProps {
  vitrageName: string
  siteManager: string
  creationDate: string
  horizontalSegments: string
  verticalSegments: string
  onVitrageNameChange: (value: string) => void
  onSiteManagerChange: (value: string) => void
  onCreationDateChange: (value: string) => void
  onHorizontalChange: (value: string) => void
  onVerticalChange: (value: string) => void
  onCreateVitrage: () => void
  vitrageNameRef: React.RefObject<HTMLInputElement>
  siteManagerRef: React.RefObject<HTMLInputElement>
  creationDateRef: React.RefObject<HTMLInputElement>
  horizontalRef: React.RefObject<HTMLInputElement>
  verticalRef: React.RefObject<HTMLInputElement>
  createBtnRef: React.RefObject<HTMLButtonElement>
  onKeyDown: (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLElement>) => void
}

export function ConfigForm({
  vitrageName,
  siteManager,
  creationDate,
  horizontalSegments,
  verticalSegments,
  onVitrageNameChange,
  onSiteManagerChange,
  onCreationDateChange,
  onHorizontalChange,
  onVerticalChange,
  onCreateVitrage,
  vitrageNameRef,
  siteManagerRef,
  creationDateRef,
  horizontalRef,
  verticalRef,
  createBtnRef,
  onKeyDown
}: ConfigFormProps) {
  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="vitrage-name">Маркировка витража:</label>
        <input
          ref={vitrageNameRef}
          id="vitrage-name"
          type="text"
          value={vitrageName}
          onChange={(e) => onVitrageNameChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, siteManagerRef)}
          placeholder="Например: В-01, ВТ-003"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="site-manager">Начальник участка:</label>
        <input
          ref={siteManagerRef}
          id="site-manager"
          type="text"
          value={siteManager}
          onChange={(e) => onSiteManagerChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, creationDateRef)}
          placeholder="Введите ФИО начальника участка"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="creation-date">Дата создания:</label>
        <input
          ref={creationDateRef}
          id="creation-date"
          type="date"
          value={creationDate}
          onChange={(e) => onCreationDateChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, horizontalRef)}
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="horizontal-segments">Количество сегментов по горизонтали:</label>
        <input
          ref={horizontalRef}
          id="horizontal-segments"
          type="number"
          min="1"
          max="10"
          value={horizontalSegments}
          onChange={(e) => onHorizontalChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, verticalRef)}
          placeholder="0"
          autoComplete="off"
        />
      </div>

      <div className="form-group">
        <label htmlFor="vertical-segments">Количество сегментов по вертикали:</label>
        <input
          ref={verticalRef}
          id="vertical-segments"
          type="number"
          min="1"
          max="10"
          value={verticalSegments}
          onChange={(e) => onVerticalChange(e.target.value)}
          onKeyDown={(e) => onKeyDown(e, createBtnRef)}
          placeholder="0"
          autoComplete="off"
        />
      </div>

      <button ref={createBtnRef} className="create-btn" onClick={onCreateVitrage}>
        Создать витраж
      </button>
    </div>
  )
}
