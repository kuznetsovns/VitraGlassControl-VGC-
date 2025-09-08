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
  const [activeMenuItem, setActiveMenuItem] = useState('vitrage-drawing')

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">VitraGlassControl</h1>
          <div className="sidebar-subtitle">Учет витражей со стеклопакетами</div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenuItem(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <div className="content-area">
          <MainContent activeSection={activeMenuItem} />
        </div>
      </main>
    </div>
  )
}