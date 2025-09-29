import './MainPage.css'

export default function MainPage() {
  return (
    <div className="main-page">
      <div className="main-page-container">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              VitraGlassControl
            </h1>
            <h2 className="hero-subtitle">
              VGC - Система управления витражами
            </h2>
            <p className="hero-description">
              Профессиональное решение для проектирования, учета и управления витражными конструкциями со стеклопакетами
            </p>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏗️</div>
            <h3>Проектирование</h3>
            <p>Создание и редактирование витражных конструкций с точными размерами и спецификациями</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Спецификации</h3>
            <p>Автоматическое формирование спецификаций витражей с детальным описанием компонентов</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Планы этажей</h3>
            <p>Размещение витражей на планах этажей с возможностью масштабирования и позиционирования</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Управление</h3>
            <p>Полный контроль над проектами с возможностью экспорта и обмена данными</p>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>О системе</h3>
            <p>
              VitraGlassControl (VGC) - это комплексная система для работы с витражными конструкциями, 
              разработанная для архитекторов, проектировщиков и производителей стеклянных конструкций.
            </p>
            <p>
              Система позволяет создавать детальные спецификации витражей, размещать их на планах зданий 
              и управлять всем циклом проектирования витражных фасадов.
            </p>
          </div>

          <div className="info-card">
            <h3>Возможности</h3>
            <ul>
              <li>Создание витражей с настраиваемой сеткой сегментов</li>
              <li>Различные типы заполнения: стекло, вентиляция, сэндвич-панели</li>
              <li>Размещение витражей на планах этажей и фасадов</li>
              <li>Масштабирование и позиционирование элементов</li>
              <li>Экспорт проектных данных</li>
              <li>Работа с подложками планов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}