import { useState, useEffect } from 'react'
import { objectStorage } from '../../../services/objectStorage'
import type { ProjectObject, ObjectFormData } from '../types'

export function useObjectsManagement() {
  const [objects, setObjects] = useState<ProjectObject[]>([])

  useEffect(() => {
    loadObjects()
  }, [])

  const loadObjects = async () => {
    try {
      const { data, error, usingFallback } = await objectStorage.getAll()

      if (error) {
        console.error('Error loading objects:', error)
        alert('Ошибка загрузки объектов')
        return
      }

      if (usingFallback) {
        console.info('📦 Using localStorage fallback (Supabase unavailable)')
      }

      setObjects(data)
    } catch (error) {
      console.error('Error loading objects:', error)
    }
  }

  const createObject = async (formData: ObjectFormData, image?: string | null) => {
    if (!formData.name || !formData.customer || !formData.address) {
      alert('Пожалуйста, заполните все обязательные поля')
      return null
    }

    try {
      const { data, error, usingFallback } = await objectStorage.create({
        name: formData.name,
        customer: formData.customer,
        address: formData.address,
        buildingsCount: formData.buildingsCount,
        image: image || undefined
      })

      if (error) {
        console.error('Error creating object:', error)
        alert('Ошибка создания объекта')
        return null
      }

      if (usingFallback) {
        console.info('📦 Object created in localStorage (Supabase unavailable)')
      }

      if (data) {
        setObjects([data, ...objects])
        return data
      }

      return null
    } catch (error) {
      console.error('Error creating object:', error)
      alert('Ошибка создания объекта')
      return null
    }
  }

  const updateObject = async (objectId: string, formData: ObjectFormData, image?: string | null) => {
    if (!formData.name || !formData.customer || !formData.address) {
      alert('Пожалуйста, заполните все обязательные поля')
      return null
    }

    try {
      const { data, error, usingFallback } = await objectStorage.update(objectId, {
        name: formData.name,
        customer: formData.customer,
        address: formData.address,
        buildingsCount: formData.buildingsCount,
        image: image || undefined
      })

      if (error) {
        console.error('Error updating object:', error)
        alert('Ошибка обновления объекта')
        return null
      }

      if (usingFallback) {
        console.info('📦 Object updated in localStorage (Supabase unavailable)')
      }

      if (data) {
        setObjects(objects.map(obj => obj.id === objectId ? data : obj))
        return data
      }

      return null
    } catch (error) {
      console.error('Error updating object:', error)
      alert('Ошибка обновления объекта')
      return null
    }
  }

  const deleteObject = async (objectId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот объект?')) return false

    try {
      const { error, usingFallback } = await objectStorage.delete(objectId)

      if (error) {
        console.error('Error deleting object:', error)
        alert('Ошибка удаления объекта')
        return false
      }

      if (usingFallback) {
        console.info('📦 Object deleted from localStorage (Supabase unavailable)')
      }

      setObjects(objects.filter(obj => obj.id !== objectId))
      return true
    } catch (error) {
      console.error('Error deleting object:', error)
      alert('Ошибка удаления объекта')
      return false
    }
  }

  return {
    objects,
    createObject,
    updateObject,
    deleteObject
  }
}
