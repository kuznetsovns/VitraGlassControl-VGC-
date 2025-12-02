import type { VitrageItem, ProjectObject } from '../types'
import type { SegmentDefectData } from '../../../services/defectStorage'
import { getObjectName } from './vitrageHelpers'

export function exportDefectsToExcel(
  vitragesToExport: VitrageItem[],
  filename: string,
  segmentDefectsData: Map<string, SegmentDefectData>,
  objects: ProjectObject[]
) {
  // Создаем CSV данные с BOM для правильного отображения кириллицы в Excel
  let csvContent = '\uFEFF'

  // Заголовок
  csvContent += 'Витраж;Объект;Начальник участка;Дата создания витража;Сетка;Номер сегмента;Тип сегмента;Ширина (мм);Высота (мм);Формула стекла;Дата осмотра;Проверяющий;Начальник участка (осмотр);Дефекты\n'

  // Данные
  vitragesToExport.forEach(vitrage => {
    const objectName = getObjectName(vitrage, objects)
    const grid = `${vitrage.rows} × ${vitrage.cols}`

    vitrage.segments.forEach((segment, idx) => {
      const segmentIndex = idx + 1
      const key = `${vitrage.id}-${segmentIndex}`
      const defectData = segmentDefectsData.get(key)

      const segmentType = segment.type || 'Не указан'
      const segmentWidth = segment.width || '—'
      const segmentHeight = segment.height || '—'
      const segmentFormula = segment.formula || '—'

      // Данные осмотра
      const inspDate = defectData?.inspectionDate || '—'
      const insp = defectData?.inspector || '—'
      const siteMgr = defectData?.siteManager || '—'
      const defects = defectData?.defects?.length > 0 ? defectData.defects.join(', ') : 'Нет дефектов'

      csvContent += `${vitrage.name};${objectName};${vitrage.siteManager || '—'};${vitrage.creationDate || '—'};${grid};${segmentIndex};${segmentType};${segmentWidth};${segmentHeight};${segmentFormula};${inspDate};${insp};${siteMgr};${defects}\n`
    })
  })

  // Создаем Blob и скачиваем файл
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
