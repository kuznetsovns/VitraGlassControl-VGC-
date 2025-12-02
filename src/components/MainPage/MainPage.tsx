import { useNavigate } from 'react-router-dom'
import { useObjectsManagement } from './hooks/useObjectsManagement'
import { useModalState } from './hooks/useModalState'
import { useImageUpload } from './hooks/useImageUpload'
import { HeroHeader } from './components/HeroHeader'
import { ObjectsGrid } from './components/ObjectsGrid'
import { ObjectFormDialog } from './components/ObjectFormDialog'
import type { MainPageProps } from './types'
import '../MainPage.css'

export default function MainPage({ onDepartmentSelect }: MainPageProps) {
  const navigate = useNavigate()
  const { objects, createObject, updateObject, deleteObject } = useObjectsManagement()
  const {
    showCreateDialog,
    showEditDialog,
    editingObjectId,
    formData,
    setFormData,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog
  } = useModalState()
  const {
    selectedImage,
    setSelectedImage,
    fileInputRef,
    handleImageUpload,
    clearImage
  } = useImageUpload()

  const handleCreateObject = async () => {
    const result = await createObject(formData, selectedImage)
    if (result) {
      closeCreateDialog()
      clearImage()
    }
  }

  const handleUpdateObject = async () => {
    if (!editingObjectId) return
    const result = await updateObject(editingObjectId, formData, selectedImage)
    if (result) {
      closeEditDialog()
      clearImage()
    }
  }

  const handleOpenObject = (object: typeof objects[0]) => {
    navigate(`/object/${object.id}`)
  }

  const handleCancelCreate = () => {
    closeCreateDialog()
    clearImage()
  }

  const handleCancelEdit = () => {
    closeEditDialog()
    clearImage()
  }

  return (
    <div className="main-page">
      <HeroHeader />

      <div className="main-content">
        <div className="objects-section-header">
          <div>
            <h2 className="objects-section-title">Объекты СУ-10</h2>
            <div className="objects-count">
              {objects.length} {objects.length === 1 ? 'объект' : objects.length < 5 ? 'объекта' : 'объектов'}
            </div>
          </div>
        </div>

        <ObjectsGrid
          objects={objects}
          onObjectOpen={handleOpenObject}
          onObjectEdit={openEditDialog}
          onObjectDelete={deleteObject}
          onCreateClick={openCreateDialog}
        />
      </div>

      {showCreateDialog && (
        <ObjectFormDialog
          mode="create"
          formData={formData}
          selectedImage={selectedImage}
          fileInputRef={fileInputRef}
          onFormDataChange={setFormData}
          onImageUpload={handleImageUpload}
          onImageClear={clearImage}
          onSubmit={handleCreateObject}
          onCancel={handleCancelCreate}
        />
      )}

      {showEditDialog && (
        <ObjectFormDialog
          mode="edit"
          formData={formData}
          selectedImage={selectedImage}
          fileInputRef={fileInputRef}
          onFormDataChange={setFormData}
          onImageUpload={handleImageUpload}
          onImageClear={clearImage}
          onSubmit={handleUpdateObject}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  )
}

// Re-export types for backwards compatibility
export type { ProjectObject, MainPageProps } from './types'
