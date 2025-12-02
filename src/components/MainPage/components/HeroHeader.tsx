export function HeroHeader() {
  return (
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
  )
}
