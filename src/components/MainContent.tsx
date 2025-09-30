import GraphicsEditor from './GraphicsEditor/GraphicsEditor'
import VitrageSpecification from './VitrageSpecification/VitrageSpecification'
import FloorPlanEditor from './FloorPlanEditor/FloorPlanEditor'
import FacadePlanEditor from './FacadePlanEditor/FacadePlanEditor'
import MainPage from './MainPage'
import './MainContent.css'

export interface ContentSectionProps {
  activeSection: string
  onSectionChange?: (section: string) => void
}

export default function MainContent({ activeSection, onSectionChange }: ContentSectionProps) {
  const renderContent = () => {
    switch (activeSection) {
      case 'main':
        return <MainPage />
        
      case 'vitrage-drawing':
        return (
          <div className="content-section">
            <h2>Отрисовка витражей с размерами</h2>
            <div className="graphics-container responsive-graphics">
              <GraphicsEditor />
            </div>
          </div>
        )
      
      case 'specification':
        return (
          <div className="content-section">
            <VitrageSpecification />
          </div>
        )
      
      case 'floor-plans':
        return (
          <div className="content-section fullscreen-section">
            <div className="compact-header">
              <div className="header-content">
                <button 
                  className="exit-fullscreen-btn"
                  onClick={() => onSectionChange?.('vitrage-drawing')}
                  title="Выйти из полноэкранного режима"
                >
                  ✕
                </button>
                <h2>План этажей</h2>
              </div>
            </div>
            <div className="fullscreen-container">
              <FloorPlanEditor />
            </div>
          </div>
        )
      
      case 'facade-plans':
        return (
          <div className="content-section fullscreen-section">
            <div className="compact-header">
              <div className="header-content">
                <button
                  className="exit-fullscreen-btn"
                  onClick={() => onSectionChange?.('vitrage-drawing')}
                  title="Выйти из полноэкранного режима"
                >
                  ✕
                </button>
                <h2>Планы фасадов</h2>
              </div>
            </div>
            <div className="fullscreen-container">
              <FacadePlanEditor />
            </div>
          </div>
        )
      
      case 'support':
        return (
          <div className="content-section">
            <h2>Поддержка</h2>
            <div className="content-card">
              <p>Техническая поддержка и документация системы.</p>
              <div className="feature-list">
                <div className="feature-item">📖 Руководство пользователя</div>
                <div className="feature-item">❓ Часто задаваемые вопросы</div>
                <div className="feature-item">📧 Обратная связь</div>
                <div className="feature-item">🔧 Техническая поддержка</div>
              </div>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="content-section">
            <h2>Настройки</h2>
            <div className="content-card">
              <p>Настройки системы и пользовательских параметров.</p>
              <div className="feature-list">
                <div className="feature-item">👤 Профиль пользователя</div>
                <div className="feature-item">🎨 Настройки интерфейса</div>
                <div className="feature-item">📊 Единицы измерения</div>
                <div className="feature-item">🔔 Уведомления</div>
              </div>
            </div>
          </div>
        )
      
      case 'admin':
        return (
          <div className="content-section">
            <h2>Администрирование</h2>
            <div className="content-card">
              <p>Административные функции и управление системой.</p>
              <div className="feature-list">
                <div className="feature-item">👥 Управление пользователями</div>
                <div className="feature-item">🔐 Права доступа</div>
                <div className="feature-item">📈 Аналитика</div>
                <div className="feature-item">🗄️ Резервное копирование</div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="content-section">
            <h2>Добро пожаловать в VitraGlassControl</h2>
            <div className="content-card">
              <p>Система учета витражей со стеклопакетами</p>
              <p>Выберите раздел в боковом меню для начала работы.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="main-content-wrapper">
      {renderContent()}
    </div>
  )
}