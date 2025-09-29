import { useState } from 'react'
import './Layout.css'
import MainContent from './MainContent'

export interface MenuItem {
  id: string
  label: string
  icon?: string
}

const menuItems: MenuItem[] = [
  { id: 'vitrage-drawing', label: 'Отрисовка витражей с размерами', icon: '📐' },
  { id: 'specification', label: 'Спецификация витражей', icon: '📋' },
  { id: 'floor-plans', label: 'План этажей', icon: '🏢' },
  { id: 'facade-plans', label: 'Планы фасадов', icon: '🏗️' },
  { id: 'support', label: 'Поддержка', icon: '❓' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
  { id: 'admin', label: 'Администрирование', icon: '👥' }
]

export default function Layout() {
  const [activeMenuItem, setActiveMenuItem] = useState('main')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Start expanded

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleLogoClick = () => {
    setActiveMenuItem('main')
  }

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
              <div className="sidebar-subtitle">Учет витражей со стеклопакетами</div>
            </>
          )}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Развернуть панель" : "Свернуть панель"}
        >
          <span className="toggle-icon">
            {sidebarCollapsed ? '▶' : '◀'}
          </span>
        </button>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenuItem(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="menu-icon">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="menu-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <div className="content-area">
          <MainContent 
            activeSection={activeMenuItem} 
            onSectionChange={setActiveMenuItem}
          />
        </div>
      </main>
    </div>
  )
}