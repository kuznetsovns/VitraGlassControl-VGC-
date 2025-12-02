interface CreateObjectCardProps {
  onClick: () => void
}

export function CreateObjectCard({ onClick }: CreateObjectCardProps) {
  return (
    <div className="create-object-card" onClick={onClick}>
      <div className="create-card-content">
        <div className="plus-icon-container">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="plus-icon">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="create-card-text">Создать объект</span>
      </div>
    </div>
  )
}
