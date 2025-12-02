import type { SegmentProperties } from '../types/segment.types'

// Обновить свойство сегмента
export function updateSegmentProperty(
  segmentId: number,
  property: 'type' | 'width' | 'height' | 'formula' | 'label',
  value: string,
  segmentProperties: SegmentProperties,
  cols: number,
  rows: number
): SegmentProperties {
  const updated = { ...segmentProperties };
  const currentSegmentProps = updated[segmentId];
  const currentRow = Math.floor((segmentId - 1) / cols);
  const currentCol = (segmentId - 1) % cols;

  // Для изменения ширины - применяем ко всему столбцу
  if (property === 'width') {
    // Если это объединенный сегмент, определяем все столбцы которые он занимает
    const isMerged = currentSegmentProps?.merged;
    const colSpan = isMerged ? (currentSegmentProps?.colSpan || 1) : 1;

    // Применяем ширину ко всем затрагиваемым столбцам
    for (let c = currentCol; c < currentCol + colSpan && c < cols; c++) {
      for (let row = 0; row < rows; row++) {
        const targetSegmentId = row * cols + c + 1;
        // Пропускаем скрытые сегменты
        if (updated[targetSegmentId]?.hidden) continue;

        // Для необъединенных сегментов просто ставим ширину
        if (!updated[targetSegmentId]?.merged) {
          updated[targetSegmentId] = {
            ...updated[targetSegmentId],
            type: updated[targetSegmentId]?.type || 'Пустой',
            width: value,
            height: updated[targetSegmentId]?.height || '',
            formula: updated[targetSegmentId]?.formula || '',
            label: updated[targetSegmentId]?.label || ''
          };
        } else {
          // Для объединенных сегментов пересчитываем суммарную ширину
          const mergedColSpan = updated[targetSegmentId]?.colSpan || 1;
          const totalWidth = parseFloat(value || '0') * mergedColSpan;

          updated[targetSegmentId] = {
            ...updated[targetSegmentId],
            width: totalWidth.toString()
          };
        }
      }
    }
  }
  // Для изменения высоты - применяем ко всей строке
  else if (property === 'height') {
    // Если это объединенный сегмент, определяем все строки которые он занимает
    const isMerged = currentSegmentProps?.merged;
    const rowSpan = isMerged ? (currentSegmentProps?.rowSpan || 1) : 1;

    // Применяем высоту ко всем затрагиваемым строкам
    for (let r = currentRow; r < currentRow + rowSpan && r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const targetSegmentId = r * cols + col + 1;
        // Пропускаем скрытые сегменты
        if (updated[targetSegmentId]?.hidden) continue;

        // Для необъединенных сегментов просто ставим высоту
        if (!updated[targetSegmentId]?.merged) {
          updated[targetSegmentId] = {
            ...updated[targetSegmentId],
            type: updated[targetSegmentId]?.type || 'Пустой',
            width: updated[targetSegmentId]?.width || '',
            height: value,
            formula: updated[targetSegmentId]?.formula || '',
            label: updated[targetSegmentId]?.label || ''
          };
        } else {
          // Для объединенных сегментов пересчитываем суммарную высоту
          const mergedRowSpan = updated[targetSegmentId]?.rowSpan || 1;
          const totalHeight = parseFloat(value || '0') * mergedRowSpan;

          updated[targetSegmentId] = {
            ...updated[targetSegmentId],
            height: totalHeight.toString()
          };
        }
      }
    }
  }
  // Для остальных свойств - применяем только к текущему сегменту
  else {
    updated[segmentId] = {
      ...updated[segmentId],
      type: updated[segmentId]?.type || 'Пустой',
      width: updated[segmentId]?.width || '',
      height: updated[segmentId]?.height || '',
      formula: updated[segmentId]?.formula || '',
      label: updated[segmentId]?.label || '',
      [property]: value
    };
  }

  return updated;
}

// Получить свойства сегмента или значения по умолчанию
export function getSegmentProperties(
  segmentId: number,
  segmentProperties: SegmentProperties
) {
  return segmentProperties[segmentId] || {
    type: 'Пустой',
    width: '',
    height: '',
    formula: '',
    label: ''
  };
}

// Инициализировать пустые свойства для всех сегментов
export function initializeSegmentProperties(
  rows: number,
  cols: number
): SegmentProperties {
  const properties: SegmentProperties = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const segmentId = row * cols + col + 1;
      properties[segmentId] = {
        type: 'Пустой',
        width: '',
        height: '',
        formula: '',
        label: ''
      };
    }
  }
  return properties;
}

// Очистить свойства сегмента
export function clearSegmentProperties(segmentId: number, segmentProperties: SegmentProperties): SegmentProperties {
  const updated = { ...segmentProperties };
  delete updated[segmentId];
  return updated;
}
