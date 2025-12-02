import type { ProjectObject } from '../types'
import { ObjectCard } from './ObjectCard'
import { CreateObjectCard } from './CreateObjectCard'
import { EmptyState } from './EmptyState'

interface ObjectsGridProps {
  objects: ProjectObject[]
  onObjectOpen: (object: ProjectObject) => void
  onObjectEdit: (object: ProjectObject) => void
  onObjectDelete: (objectId: string) => void
  onCreateClick: () => void
}

export function ObjectsGrid({
  objects,
  onObjectOpen,
  onObjectEdit,
  onObjectDelete,
  onCreateClick
}: ObjectsGridProps) {
  if (objects.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />
  }

  return (
    <div className="objects-grid">
      {objects.map(object => (
        <ObjectCard
          key={object.id}
          object={object}
          onOpen={onObjectOpen}
          onEdit={onObjectEdit}
          onDelete={onObjectDelete}
        />
      ))}
      <CreateObjectCard onClick={onCreateClick} />
    </div>
  )
}
