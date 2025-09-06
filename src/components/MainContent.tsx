import GraphicsEditor from './GraphicsEditor/GraphicsEditor'
import { useState } from 'react'
import './MainContent.css'

export interface ContentSectionProps {
  activeSection: string
}

export default function MainContent({ activeSection }: ContentSectionProps) {
  const renderContent = () => {
    switch (activeSection) {
      case 'vitrage-drawing':
        return (
          <div className="content-section">
            <h2>Отрисовка витражей с размерами</h2>
            <div className="graphics-container">
              <GraphicsEditor width={1000} height={700} />
            </div>
          </div>
        )
      
      case 'floor-plans':
        return (
          <div className="content-section">
            <h2>План этажей</h2>
            <div className="content-card">
              <p>Управление планами этажей зданий для размещения витражных конструкций.</p>
              <div className="feature-list">
                <div className="feature-item">🏢 Создание планов этажей</div>
                <div className="feature-item">📍 Размещение витражей</div>
                <div className="feature-item">📊 Просмотр статистики</div>
                <div className="feature-item">🔄 Импорт/экспорт планов</div>
              </div>
            </div>
          </div>
        )
      
      case 'facade-plans':
        return (
          <div className="content-section">
            <h2>Планы фасадов</h2>
            <div className="content-card">
              <p>Работа с фасадными планами и размещением витражных элементов.</p>
              <div className="feature-list">
                <div className="feature-item">🏗️ Редактор фасадов</div>
                <div className="feature-item">📐 Размерные линии</div>
                <div className="feature-item">🎯 Привязка к конструкциям</div>
                <div className="feature-item">📋 Спецификации</div>
              </div>
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