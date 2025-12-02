import type { ProjectObject, VitrageItem } from '../types'

export function getObjectName(vitrage: VitrageItem, objects: ProjectObject[]): string {
  // Сначала проверяем objectName (новый формат)
  if (vitrage.objectName) {
    return vitrage.objectName
  }
  // Затем ищем в списке объектов (старый формат)
  const obj = objects.find(o => o.id === vitrage.objectId)
  return obj?.name || 'Неизвестный объект'
}

export function getVersionName(vitrage: VitrageItem, objects: ProjectObject[]): string {
  // Если нет versionId, возвращаем пустую строку
  if (!vitrage.versionId) {
    return ''
  }
  const obj = objects.find(o => o.id === vitrage.objectId)
  if (!obj?.versions) {
    return ''
  }
  const version = obj.versions.find(v => v.id === vitrage.versionId)
  return version?.name || ''
}

export function calculateTotalArea(vitrage: VitrageItem): number {
  return vitrage.segments.reduce((total, segment) => {
    if (segment.width && segment.height) {
      return total + (segment.width * segment.height) / 1000000 // в м²
    }
    return total
  }, 0)
}
