import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { objectStorage } from '../services/objectStorage'
import type { Department } from './Layout'
import type { ProjectObject } from './MainPage'
import './ObjectPage.css'

export default function ObjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [object, setObject] = useState<ProjectObject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadObject()
  }, [id])

  const loadObject = async () => {
    if (!id) return

    try {
      const { data, error, usingFallback } = await objectStorage.getById(id)

      if (error || !data) {
        console.error('Error loading object:', error)
        navigate('/')
        return
      }

      if (usingFallback) {
        console.info('📦 Using localStorage fallback (Supabase unavailable)')
      }

      setObject(data)
    } catch (error) {
      console.error('Error loading object:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const selectDepartment = (departmentName: string) => {
    if (!object) return

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
      // Navigate to department with object context
      const section = department === 'УОК' ? 'vitrage-visualizer' : 'order-form'
      navigate(`/object/${object.id}/department/${department}/${section}`)
    }
  }

  if (loading) {
    return (
      <div className="object-page loading">
        <div className="loader">Загрузка...</div>
      </div>
    )
  }

  if (!object) {
    return (
      <div className="object-page error">
        <h2>Объект не найден</h2>
        <button onClick={() => navigate('/')}>Вернуться на главную</button>
      </div>
    )
  }

  return (
    <div className="object-page">
      {/* Back button */}
      <button className="back-button" onClick={() => navigate('/')}>
        ← Вернуться к списку объектов
      </button>

      {/* Object Info */}
      <div className="object-info-section">
        <div className="object-hero">
          {object.image ? (
            <div className="object-hero-image">
              <img src={object.image} alt={object.name} />
            </div>
          ) : (
            <div className="object-hero-placeholder">
              <span>🏢</span>
            </div>
          )}
          <div className="object-hero-content">
            <h1 className="object-title">{object.name}</h1>
            <div className="object-meta">
              <div className="meta-item">
                <span className="meta-label">Заказчик:</span>
                <span className="meta-value">{object.customer}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Адрес:</span>
                <span className="meta-value">{object.address}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Корпусов:</span>
                <span className="meta-value">{object.buildingsCount}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Создан:</span>
                <span className="meta-value">{object.createdAt.toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Selection */}
      <div className="department-selection-section">
        <h2 className="section-title">Выберите отдел для работы</h2>
        <div className="department-cards">
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
      </div>
    </div>
  )
}