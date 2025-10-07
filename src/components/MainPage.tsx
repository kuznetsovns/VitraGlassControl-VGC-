import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Department } from './Layout'
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
  onDepartmentSelect?: (department: Department, objectId: string, objectName: string) => void
}

export default function MainPage({ onDepartmentSelect }: MainPageProps) {
  const [objects, setObjects] = useState<ProjectObject[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [selectedObjectForOpen, setSelectedObjectForOpen] = useState<ProjectObject | null>(null)
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [newObjectData, setNewObjectData] = useState({
    name: '',
    customer: '',
    address: '',
    buildingsCount: 1
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load objects from Supabase on mount
  useEffect(() => {
    loadObjects()
  }, [])

  // Handle Escape key to close dialogs
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDepartmentDialog) {
          setShowDepartmentDialog(false)
          setSelectedObjectForOpen(null)
        } else if (showEditDialog) {
          setShowEditDialog(false)
          setEditingObjectId(null)
          setSelectedImage(null)
          setNewObjectData({
            name: '',
            customer: '',
            address: '',
            buildingsCount: 1
          })
        } else if (showCreateDialog) {
          setShowCreateDialog(false)
          setSelectedImage(null)
          setNewObjectData({
            name: '',
            customer: '',
            address: '',
            buildingsCount: 1
          })
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDepartmentDialog, showEditDialog, showCreateDialog])

  // Block body scroll when any modal is open
  useEffect(() => {
    if (showCreateDialog || showEditDialog || showDepartmentDialog) {
      // Save current scroll position
      const scrollY = window.scrollY

      // Block scroll on main page body
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        // Restore styles
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''

        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [showCreateDialog, showEditDialog, showDepartmentDialog])

  const loadObjects = async () => {
    try {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading objects from Supabase:', error)
        alert('Ошибка загрузки объектов: ' + error.message)
        return
      }

      if (data) {
        const objects = data.map(obj => ({
          id: obj.id,
          name: obj.name,
          customer: obj.customer || '',
          address: obj.address || '',
          buildingsCount: obj.corpus_count || 1,
          image: obj.photo_url || undefined,
          createdAt: new Date(obj.created_at),
          updatedAt: new Date(obj.updated_at)
        }))
        setObjects(objects)
      }
    } catch (error) {
      console.error('Error loading objects:', error)
    }
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
  const createObject = async () => {
    if (!newObjectData.name || !newObjectData.customer || !newObjectData.address) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    try {
      const { data, error } = await supabase
        .from('objects')
        .insert({
          name: newObjectData.name,
          customer: newObjectData.customer,
          address: newObjectData.address,
          corpus_count: newObjectData.buildingsCount,
          photo_url: selectedImage || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating object:', error)
        alert('Ошибка создания объекта: ' + error.message)
        return
      }

      if (data) {
        // Add new object to local state
        const newObject: ProjectObject = {
          id: data.id,
          name: data.name,
          customer: data.customer || '',
          address: data.address || '',
          buildingsCount: data.corpus_count || 1,
          image: data.photo_url || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
        setObjects([newObject, ...objects])
      }

      // Reset form
      setNewObjectData({
        name: '',
        customer: '',
        address: '',
        buildingsCount: 1
      })
      setSelectedImage(null)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Error creating object:', error)
      alert('Ошибка создания объекта')
    }
  }

  // Delete object
  const deleteObject = async (objectId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот объект?')) return

    try {
      const { error } = await supabase
        .from('objects')
        .delete()
        .eq('id', objectId)

      if (error) {
        console.error('Error deleting object:', error)
        alert('Ошибка удаления объекта: ' + error.message)
        return
      }

      // Remove from local state
      setObjects(objects.filter(obj => obj.id !== objectId))
    } catch (error) {
      console.error('Error deleting object:', error)
      alert('Ошибка удаления объекта')
    }
  }

  // Open edit dialog
  const openEditDialog = (object: ProjectObject) => {
    setEditingObjectId(object.id)
    setNewObjectData({
      name: object.name,
      customer: object.customer,
      address: object.address,
      buildingsCount: object.buildingsCount
    })
    setSelectedImage(object.image || null)
    setShowEditDialog(true)
  }

  // Update object
  const updateObject = async () => {
    if (!editingObjectId || !newObjectData.name || !newObjectData.customer || !newObjectData.address) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    try {
      const { data, error } = await supabase
        .from('objects')
        .update({
          name: newObjectData.name,
          customer: newObjectData.customer,
          address: newObjectData.address,
          corpus_count: newObjectData.buildingsCount,
          photo_url: selectedImage || null
        })
        .eq('id', editingObjectId)
        .select()
        .single()

      if (error) {
        console.error('Error updating object:', error)
        alert('Ошибка обновления объекта: ' + error.message)
        return
      }

      if (data) {
        // Update object in local state
        const updatedObject: ProjectObject = {
          id: data.id,
          name: data.name,
          customer: data.customer || '',
          address: data.address || '',
          buildingsCount: data.corpus_count || 1,
          image: data.photo_url || undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        }
        setObjects(objects.map(obj => obj.id === editingObjectId ? updatedObject : obj))
      }

      // Reset form
      setNewObjectData({
        name: '',
        customer: '',
        address: '',
        buildingsCount: 1
      })
      setSelectedImage(null)
      setEditingObjectId(null)
      setShowEditDialog(false)
    } catch (error) {
      console.error('Error updating object:', error)
      alert('Ошибка обновления объекта')
    }
  }

  // Open object - show department selection
  const openObject = (object: ProjectObject) => {
    setSelectedObjectForOpen(object)
    setShowDepartmentDialog(true)
  }

  // Select department and navigate
  const selectDepartment = (departmentName: string) => {
    if (!selectedObjectForOpen || !onDepartmentSelect) return

    // Map department name to Department type
    let department: Department = null
    switch (departmentName) {
      case 'Отдел УОК':
        department = 'УОК'
        break
      case 'Отдел снабжения':
        department = 'Снабжение'
        break
      case 'Гарантийный отдел':
        department = 'Гарантия'
        break
    }

    if (department) {
      onDepartmentSelect(department, selectedObjectForOpen.id, selectedObjectForOpen.name)
    }

    setShowDepartmentDialog(false)
    setSelectedObjectForOpen(null)
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
      {/* Hero Header */}
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-logo">
            <div className="logo-icon">🏢</div>
          </div>
          <h1 className="hero-title">VitraGlassControl</h1>
          <p className="hero-subtitle">Профессиональная система управления витражными конструкциями</p>
          <div className="hero-features">
            <div className="hero-feature">
              <span className="feature-icon">✓</span>
              <span>Контроль производства</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">✓</span>
              <span>Управление заказами</span>
            </div>
            <div className="hero-feature">
              <span className="feature-icon">✓</span>
              <span>Работа с объектами</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="objects-section-header">
          <div>
            <h2 className="objects-section-title">Объекты СУ-10</h2>
            <div className="objects-count">{objects.length} {objects.length === 1 ? 'объект' : objects.length < 5 ? 'объекта' : 'объектов'}</div>
          </div>
        </div>

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
                <div className="object-image" onClick={() => openObject(object)} style={{cursor: 'pointer'}}>
                  {object.image ? (
                    <img src={object.image} alt={object.name} />
                  ) : (
                    <div className="placeholder-image">
                      <span>🏢</span>
                    </div>
                  )}
                </div>
                <div className="object-content" onClick={() => openObject(object)} style={{cursor: 'pointer'}}>
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
                    onClick={() => openEditDialog(object)}
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
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateDialog(false)
              setSelectedImage(null)
              setNewObjectData({
                name: '',
                customer: '',
                address: '',
                buildingsCount: 1
              })
            }
          }}
        >
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

      {/* Edit Object Dialog */}
      {showEditDialog && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditDialog(false)
              setEditingObjectId(null)
              setSelectedImage(null)
              setNewObjectData({
                name: '',
                customer: '',
                address: '',
                buildingsCount: 1
              })
            }
          }}
        >
          <div className="modal">
            <h3>Редактировать объект</h3>

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
                  setShowEditDialog(false)
                  setEditingObjectId(null)
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
                onClick={updateObject}
                disabled={!newObjectData.name || !newObjectData.customer || !newObjectData.address}
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Selection Dialog */}
      {showDepartmentDialog && selectedObjectForOpen && (
        <div
          className="department-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDepartmentDialog(false)
              setSelectedObjectForOpen(null)
            }
          }}
        >
          <div className="department-modal-container">
            {/* Header */}
            <div className="department-modal-header">
              <div className="department-header-icon">🏢</div>
              <h2 className="department-modal-title">Выберите отдел</h2>
              <p className="department-modal-subtitle">
                Объект: <strong>{selectedObjectForOpen.name}</strong>
              </p>
            </div>

            {/* Department Cards */}
            <div className="department-cards-grid">
              <div
                className="department-card"
                onClick={() => selectDepartment('Отдел снабжения')}
              >
                <div className="department-card-icon">📦</div>
                <h3 className="department-card-title">Отдел снабжения</h3>
                <p className="department-card-description">
                  Управление поставками, оформление заказов и контроль материалов
                </p>
                <div className="department-card-arrow">→</div>
              </div>

              <div
                className="department-card"
                onClick={() => selectDepartment('Гарантийный отдел')}
              >
                <div className="department-card-icon">🛠️</div>
                <h3 className="department-card-title">Гарантийный отдел</h3>
                <p className="department-card-description">
                  Обработка гарантийных случаев и техническая поддержка
                </p>
                <div className="department-card-arrow">→</div>
              </div>

              <div
                className="department-card"
                onClick={() => selectDepartment('Отдел УОК')}
              >
                <div className="department-card-icon">📋</div>
                <h3 className="department-card-title">Отдел УОК</h3>
                <p className="department-card-description">
                  Полный доступ к проектированию, спецификациям и визуализации
                </p>
                <div className="department-card-arrow">→</div>
              </div>
            </div>

            {/* Close Button */}
            <button
              className="department-close-btn"
              onClick={() => {
                setShowDepartmentDialog(false)
                setSelectedObjectForOpen(null)
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}