import type { ProjectObject } from '../types'

interface ObjectCardProps {
  object: ProjectObject
  onOpen: (object: ProjectObject) => void
  onEdit: (object: ProjectObject) => void
  onDelete: (objectId: string) => void
}

export function ObjectCard({ object, onOpen, onEdit, onDelete }: ObjectCardProps) {
  return (
    <div className="object-card">
      <div className="object-image" onClick={() => onOpen(object)} style={{cursor: 'pointer'}}>
        {object.image ? (
          <img src={object.image} alt={object.name} />
        ) : (
          <div className="placeholder-image">
            <span>🏢</span>
          </div>
        )}
      </div>
      <div className="object-content" onClick={() => onOpen(object)} style={{cursor: 'pointer'}}>
        <h3 className="object-name">{object.name}</h3>
        <div className="object-details">
          <div className="detail-item">
            <span className="label">Заказчик:</span>
            <span className="value">{object.customer}</span>
          </div>
          <div className="detail-item">
            <span className="label">Адрес:</span>
            <span className="value">{object.address}</span>
          </div>
          <div className="detail-item">
            <span className="label">Корпусов:</span>
            <span className="value">{object.buildingsCount}</span>
          </div>
          <div className="detail-item">
            <span className="label">Создан:</span>
            <span className="value">{object.createdAt.toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
      <div className="object-actions">
        <button
          className="action-btn edit-btn"
          onClick={() => onEdit(object)}
        >
          Редактировать
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(object.id)}
        >
          Удалить
        </button>
      </div>
    </div>
  )
}
