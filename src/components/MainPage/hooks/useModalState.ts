import { useState, useEffect } from 'react'
import type { ProjectObject, ObjectFormData } from '../types'

const initialFormData: ObjectFormData = {
  name: '',
  customer: '',
  address: '',
  buildingsCount: 1
}

export function useModalState() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ObjectFormData>(initialFormData)

  // Handle Escape key to close dialogs
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditDialog) {
          closeEditDialog()
        } else if (showCreateDialog) {
          closeCreateDialog()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showEditDialog, showCreateDialog])

  // Block body scroll when any modal is open
  useEffect(() => {
    if (showCreateDialog || showEditDialog) {
      const scrollY = window.scrollY

      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [showCreateDialog, showEditDialog])

  const openCreateDialog = () => {
    setFormData(initialFormData)
    setShowCreateDialog(true)
  }

  const closeCreateDialog = () => {
    setShowCreateDialog(false)
    setFormData(initialFormData)
  }

  const openEditDialog = (object: ProjectObject) => {
    setEditingObjectId(object.id)
    setFormData({
      name: object.name,
      customer: object.customer,
      address: object.address,
      buildingsCount: object.buildingsCount
    })
    setShowEditDialog(true)
  }

  const closeEditDialog = () => {
    setShowEditDialog(false)
    setEditingObjectId(null)
    setFormData(initialFormData)
  }

  return {
    showCreateDialog,
    showEditDialog,
    editingObjectId,
    formData,
    setFormData,
    openCreateDialog,
    closeCreateDialog,
    openEditDialog,
    closeEditDialog
  }
}
