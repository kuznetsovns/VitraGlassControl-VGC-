import { useState } from 'react'

interface DefectSelectorProps {
  availableDefects: string[]
  selectedDefects: string[]
  onToggleDefect: (defect: string) => void
  onAddNewDefect: (name: string) => Promise<boolean>
}

export function DefectSelector({
  availableDefects,
  selectedDefects,
  onToggleDefect,
  onAddNewDefect
}: DefectSelectorProps) {
  const [showDefectDropdown, setShowDefectDropdown] = useState(false)
  const [showAddDefectForm, setShowAddDefectForm] = useState(false)
  const [newDefectName, setNewDefectName] = useState('')

  const handleAddDefect = async () => {
    const success = await onAddNewDefect(newDefectName)
    if (success) {
      setNewDefectName('')
      setShowAddDefectForm(false)
    }
  }

  return (
    <div className="defects-list">
      <h4>Список дефектов</h4>

      {selectedDefects.length > 0 && (
        <div className="selected-defects">
          {selectedDefects.map(defect => (
            <div key={defect} className="defect-tag">
              <span>{defect}</span>
              <button
                className="remove-defect-btn"
                onClick={() => onToggleDefect(defect)}
                title="Удалить"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="defect-dropdown-container">
        <button
          className="add-defect-btn"
          onClick={() => setShowDefectDropdown(!showDefectDropdown)}
        >
          {selectedDefects.length === 0 ? '+ Добавить дефект' : '+ Добавить еще'}
        </button>

        {showDefectDropdown && (
          <div className="defect-dropdown">
            <div className="defect-dropdown-header">
              <span>Выберите дефекты:</span>
              <button
                className="close-dropdown-btn"
                onClick={() => setShowDefectDropdown(false)}
              >
                ×
              </button>
            </div>
            <div className="defect-options">
              {availableDefects.map(defect => (
                <label key={defect} className="defect-option">
                  <input
                    type="checkbox"
                    checked={selectedDefects.includes(defect)}
                    onChange={() => onToggleDefect(defect)}
                  />
                  <span>{defect}</span>
                </label>
              ))}
            </div>
            <div className="defect-dropdown-footer">
              {!showAddDefectForm ? (
                <button
                  className="new-defect-btn"
                  onClick={() => setShowAddDefectForm(true)}
                >
                  + Создать новый тип дефекта
                </button>
              ) : (
                <div className="new-defect-form">
                  <input
                    type="text"
                    className="new-defect-input"
                    placeholder="Название дефекта"
                    value={newDefectName}
                    onChange={(e) => setNewDefectName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDefect()
                      }
                    }}
                    autoFocus
                  />
                  <div className="new-defect-actions">
                    <button
                      className="save-defect-btn"
                      onClick={handleAddDefect}
                    >
                      Добавить
                    </button>
                    <button
                      className="cancel-defect-btn"
                      onClick={() => {
                        setShowAddDefectForm(false)
                        setNewDefectName('')
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
