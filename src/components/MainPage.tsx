import { useState, useEffect, useRef } from 'react'
import './MainPage.css'

export interface ProjectObject {
  id: string
  name: string
  customer: string
  address: string
  buildingsCount: number
  image?: string // Base64 image data
  createdAt: Date
  updatedAt: Date
}

export interface MainPageProps {
}

export default function MainPage({}: MainPageProps) {
  const [objects, setObjects] = useState<ProjectObject[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newObjectData, setNewObjectData] = useState({
    name: '',
    customer: '',
    address: '',
    buildingsCount: 1
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load saved objects on mount
  useEffect(() => {
    const savedObjects = localStorage.getItem('project-objects')
    if (savedObjects) {
      try {
        const parsed = JSON.parse(savedObjects) as ProjectObject[]
        setObjects(parsed.map(obj => ({
          ...obj,
          createdAt: new Date(obj.createdAt),
          updatedAt: new Date(obj.updatedAt)
        })))
      } catch (error) {
        console.error('Error loading objects:', error)
      }
    }
  }, [])

  // Save objects to localStorage
  const saveObjectsToStorage = (objects: ProjectObject[]) => {
    localStorage.setItem('project-objects', JSON.stringify(objects))
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.includes('image')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setSelectedImage(result)
      }
      reader.readAsDataURL(file)
    } else {
      alert('Пожалуйста, выберите изображение (PNG, JPG, GIF)')
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Create new object
  const createObject = () => {
    if (!newObjectData.name || !newObjectData.customer || !newObjectData.address) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    const newObject: ProjectObject = {
      id: Date.now().toString(),
      name: newObjectData.name,
      customer: newObjectData.customer,
      address: newObjectData.address,
      buildingsCount: newObjectData.buildingsCount,
      image: selectedImage || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedObjects = [...objects, newObject]
    setObjects(updatedObjects)
    saveObjectsToStorage(updatedObjects)

    // Reset form
    setNewObjectData({
      name: '',
      customer: '',
      address: '',
      buildingsCount: 1
    })
    setSelectedImage(null)
    setShowCreateDialog(false)
  }

  // Delete object
  const deleteObject = (objectId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот объект?')) {
      const updatedObjects = objects.filter(obj => obj.id !== objectId)
      setObjects(updatedObjects)
      saveObjectsToStorage(updatedObjects)
    }
  }

  // Clear image selection
  const clearImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="main-page">
      <div className="main-content">
        {objects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>Нет созданных объектов</h3>
            <p>Создайте новый объект для начала работы с витражами</p>
            <button
              className="create-first-object-btn"
              onClick={() => setShowCreateDialog(true)}
            >
              Создать первый объект
            </button>
          </div>
        ) : (
          <div className="objects-grid">
            {objects.map(object => (
              <div key={object.id} className="object-card">
                <div className="object-image">
                  {object.image ? (
                    <img src={object.image} alt={object.name} />
                  ) : (
                    <div className="placeholder-image">
                      <span>🏢</span>
                    </div>
                  )}
                </div>
                <div className="object-content">
                  <h3 className="object-name">{object.name}</h3>
                  <div className="object-details">
                    <div className="detail-item">
                      <span className="label">Заказчик:</span>
                      <span className="value">{object.customer}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Адрес:</span>
                      <span className="value">{object.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Корпусов:</span>
                      <span className="value">{object.buildingsCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Создан:</span>
                      <span className="value">{object.createdAt.toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
                <div className="object-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => console.log('Edit object:', object.id)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteObject(object.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}

            {/* Create Object Card */}
            <div className="create-object-card" onClick={() => setShowCreateDialog(true)}>
              <div className="create-card-content">
                <div className="plus-icon-container">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="plus-icon">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="create-card-text">Создать объект</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Object Dialog */}
      {showCreateDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Создать новый объект</h3>

            <div className="form-group">
              <label>Название объекта: *</label>
              <input
                type="text"
                value={newObjectData.name}
                onChange={(e) => setNewObjectData({...newObjectData, name: e.target.value})}
                placeholder="Жилой комплекс «Северный»"
              />
            </div>

            <div className="form-group">
              <label>Заказчик: *</label>
              <input
                type="text"
                value={newObjectData.customer}
                onChange={(e) => setNewObjectData({...newObjectData, customer: e.target.value})}
                placeholder="ООО «СтройИнвест»"
              />
            </div>

            <div className="form-group">
              <label>Адрес: *</label>
              <input
                type="text"
                value={newObjectData.address}
                onChange={(e) => setNewObjectData({...newObjectData, address: e.target.value})}
                placeholder="г. Москва, ул. Примерная, д. 123"
              />
            </div>

            <div className="form-group">
              <label>Количество корпусов:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newObjectData.buildingsCount}
                onChange={(e) => setNewObjectData({...newObjectData, buildingsCount: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="form-group">
              <label>Изображение объекта:</label>
              <div className="image-upload-section">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
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
                      onClick={clearImage}
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
                onClick={() => {
                  setShowCreateDialog(false)
                  setSelectedImage(null)
                  setNewObjectData({
                    name: '',
                    customer: '',
                    address: '',
                    buildingsCount: 1
                  })
                }}
              >
                Отмена
              </button>
              <button
                className="primary"
                onClick={createObject}
                disabled={!newObjectData.name || !newObjectData.customer || !newObjectData.address}
              >
                Создать объект
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}