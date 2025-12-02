interface EmptyStateProps {
  onCreateClick: () => void
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">🏢</div>
      <h3>Нет созданных объектов</h3>
      <p>Создайте новый объект для начала работы с витражами</p>
      <button
        className="create-first-object-btn"
        onClick={onCreateClick}
      >
        Создать первый объект
      </button>
    </div>
  )
}
