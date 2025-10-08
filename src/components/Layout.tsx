import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Layout.css'
import MainContent from './MainContent'

export interface MenuItem {
  id: string
  label: string
  icon?: string
}

export type Department = 'УОК' | 'Снабжение' | 'Гарантия' | null

// Меню для отдела УОК
const uokMenuItems: MenuItem[] = [
  { id: 'vitrage-visualizer', label: 'Визуализатор Витража', icon: '🎨' },
  { id: 'specification-new', label: 'Спецификация Витражей', icon: '📋' },
  { id: 'floor-plans', label: 'План этажей', icon: '🏢' },
  { id: 'facade-plans', label: 'Планы фасадов', icon: '🏗️' },
  { id: 'support', label: 'Поддержка', icon: '❓' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
  { id: 'admin', label: 'Администрирование', icon: '👥' }
]

// Меню для отдела снабжения
const supplyMenuItems: MenuItem[] = [
  { id: 'order-form', label: 'Оформление заказа', icon: '📝' },
  { id: 'support', label: 'Поддержка', icon: '❓' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' }
]

// Меню для гарантийного отдела
const warrantyMenuItems: MenuItem[] = [
  { id: 'order-form', label: 'Оформление заказа', icon: '📝' },
  { id: 'support', label: 'Поддержка', icon: '❓' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' }
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ id?: string; department?: string; section?: string }>()

  const [activeMenuItem, setActiveMenuItem] = useState('main')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [currentDepartment, setCurrentDepartment] = useState<Department>(null)
  const [selectedObject, setSelectedObject] = useState<{id: string, name: string} | null>(null)

  // Load object data from URL params
  useEffect(() => {
    const loadObjectFromParams = async () => {
      if (params.id && params.department && params.section) {
        // Load object data from Supabase
        const { data, error } = await supabase
          .from('objects')
          .select('id, name')
          .eq('id', params.id)
          .single()

        if (!error && data) {
          setSelectedObject({ id: data.id, name: data.name })
          setCurrentDepartment(params.department as Department)
          setActiveMenuItem(params.section)
          setSidebarCollapsed(false)
        }
      } else if (location.pathname === '/') {
        // Reset to main page
        setActiveMenuItem('main')
        setCurrentDepartment(null)
        setSelectedObject(null)
        setSidebarCollapsed(true)
      }
    }

    loadObjectFromParams()
  }, [params.id, params.department, params.section, location.pathname])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogoClick = () => {
    // Navigate to home page
    navigate('/')
  }

  const handleMenuItemClick = (itemId: string) => {
    setActiveMenuItem(itemId)
    if (selectedObject && currentDepartment) {
      // Update URL when menu item changes
      navigate(`/object/${selectedObject.id}/department/${currentDepartment}/${itemId}`)
    }
  }

  // Функция для выбора отдела и объекта (deprecated - now handled by URL params)
  const handleDepartmentSelect = (department: Department, objectId: string, objectName: string) => {
    setCurrentDepartment(department)
    setSelectedObject({ id: objectId, name: objectName })
    setSidebarCollapsed(false)
    // Устанавливаем первый пункт меню активным
    if (department === 'УОК') {
      setActiveMenuItem('vitrage-visualizer')
    } else {
      setActiveMenuItem('order-form')
    }
  }

  // Получаем текущее меню в зависимости от отдела
  const getCurrentMenuItems = (): MenuItem[] => {
    switch (currentDepartment) {
      case 'УОК':
        return uokMenuItems
      case 'Снабжение':
        return supplyMenuItems
      case 'Гарантия':
        return warrantyMenuItems
      default:
        return []
    }
  }

  const menuItems = getCurrentMenuItems()
  const showSidebar = currentDepartment !== null

  return (
    <div className={`layout ${sidebarCollapsed || !showSidebar ? 'sidebar-collapsed' : ''}`}>
      {showSidebar && (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo" onClick={handleLogoClick}>
                <span className="logo-text">VGC</span>
              </div>
            </div>
            {!sidebarCollapsed && (
              <>
                <h1 className="sidebar-title">VitraGlassControl</h1>
                <div className="sidebar-subtitle">
                  {selectedObject?.name}
                  <br />
                  <small style={{fontSize: '11px', opacity: 0.8}}>
                    Отдел: {currentDepartment}
                  </small>
                </div>
              </>
            )}
          </div>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(item.id)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="menu-icon">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="menu-label">{item.label}</span>
                )}
              </button>
            ))}

            <button
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "Развернуть панель" : "Свернуть панель"}
            >
              <span className="toggle-icon">
                {sidebarCollapsed ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {!sidebarCollapsed && (
                <span className="toggle-label">Свернуть меню</span>
              )}
            </button>
          </nav>
        </aside>
      )}
      <main className="main-content">
        <div className="content-area">
          <MainContent
            activeSection={activeMenuItem}
            onSectionChange={setActiveMenuItem}
            onDepartmentSelect={handleDepartmentSelect}
          />
        </div>
      </main>
    </div>
  )
}