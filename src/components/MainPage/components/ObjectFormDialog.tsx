import type { ObjectFormData } from '../types'

interface ObjectFormDialogProps {
  mode: 'create' | 'edit'
  formData: ObjectFormData
  selectedImage: string | null
  fileInputRef: React.RefObject<HTMLInputElement>
  onFormDataChange: (data: ObjectFormData) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageClear: () => void
  onSubmit: () => void
  onCancel: () => void
}

export function ObjectFormDialog({
  mode,
  formData,
  selectedImage,
  fileInputRef,
  onFormDataChange,
  onImageUpload,
  onImageClear,
  onSubmit,
  onCancel
}: ObjectFormDialogProps) {
  const title = mode === 'create' ? 'Создать новый объект' : 'Редактировать объект'
  const submitText = mode === 'create' ? 'Создать объект' : 'Сохранить изменения'
  const isValid = formData.name && formData.customer && formData.address

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onCancel()
      }
    }}>
      <div className="modal">
        <h3>{title}</h3>

        <div className="form-group">
          <label>Название объекта: *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormDataChange({...formData, name: e.target.value})}
            placeholder="Жилой комплекс «Северный»"
          />
        </div>

        <div className="form-group">
          <label>Заказчик: *</label>
          <input
            type="text"
            value={formData.customer}
            onChange={(e) => onFormDataChange({...formData, customer: e.target.value})}
            placeholder="ООО «СтройИнвест»"
          />
        </div>

        <div className="form-group">
          <label>Адрес: *</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => onFormDataChange({...formData, address: e.target.value})}
            placeholder="г. Москва, ул. Примерная, д. 123"
          />
        </div>

        <div className="form-group">
          <label>Количество корпусов:</label>
          <input
            type="number"
            min="1"
            max="50"
            value={formData.buildingsCount}
            onChange={(e) => onFormDataChange({...formData, buildingsCount: parseInt(e.target.value) || 1})}
          />
        </div>

        <div className="form-group">
          <label>Изображение объекта:</label>
          <div className="image-upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Выбрать изображение
            </button>
            {selectedImage && (
              <div className="image-preview">
                <img src={selectedImage} alt="Preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={onImageClear}
                  title="Удалить изображение"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            className="primary"
            onClick={onSubmit}
            disabled={!isValid}
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  )
}
