import type { SegmentProperties } from '../types/segment.types'

// Проверить, находятся ли два сегмента в одном объединенном сегменте
export function areInSameMergedSegment(
  segId1: number,
  segId2: number,
  segmentProperties: SegmentProperties
): boolean {
  const props1 = segmentProperties[segId1];
  const props2 = segmentProperties[segId2];

  // Если оба сегмента скрыты и объединены в один
  if (props1?.mergedInto && props2?.mergedInto && props1.mergedInto === props2.mergedInto) {
    return true;
  }

  // Если один из сегментов - главный объединенный, а другой в него объединен
  if (props1?.merged && props2?.mergedInto === segId1) {
    return true;
  }
  if (props2?.merged && props1?.mergedInto === segId2) {
    return true;
  }

  // Если оба сегмента - это один и тот же объединенный сегмент
  if (segId1 === segId2 && props1?.merged) {
    return true;
  }

  return false;
}

// Объединить сегменты
export function mergeSegments(
  selectedSegments: Set<number>,
  segmentProperties: SegmentProperties,
  cols: number
): { newProperties: SegmentProperties; count: number } {
  const segmentsArray = Array.from(selectedSegments);

  // Получаем координаты выбранных сегментов
  const coordinates = segmentsArray.map(id => ({
    id,
    row: Math.floor((id - 1) / cols),
    col: (id - 1) % cols
  }));

  // Проверяем, что сегменты образуют прямоугольник
  const minRow = Math.min(...coordinates.map(c => c.row));
  const maxRow = Math.max(...coordinates.map(c => c.row));
  const minCol = Math.min(...coordinates.map(c => c.col));
  const maxCol = Math.max(...coordinates.map(c => c.col));

  const expectedCount = (maxRow - minRow + 1) * (maxCol - minCol + 1);
  if (selectedSegments.size !== expectedCount) {
    throw new Error('Выбранные сегменты должны образовывать прямоугольную область.');
  }

  // Проверяем непрерывность
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const id = row * cols + col + 1;
      if (!selectedSegments.has(id)) {
        throw new Error('Выбранные сегменты должны быть непрерывными и образовывать прямоугольник.');
      }
    }
  }

  // Объединяем сегменты
  const firstSegmentId = segmentsArray[0];
  const firstSegmentProps = segmentProperties[firstSegmentId] || {
    type: 'Пустой',
    width: '',
    height: '',
    formula: '',
    label: ''
  };

  // Создаем новые свойства сегментов
  const newProperties = { ...segmentProperties };

  // Обновляем первый сегмент
  newProperties[firstSegmentId] = {
    ...firstSegmentProps,
    label: firstSegmentProps.label || `М${segmentsArray.length}`,
    merged: true,
    rowSpan: maxRow - minRow + 1,
    colSpan: maxCol - minCol + 1
  };

  // Помечаем остальные сегменты как скрытые
  segmentsArray.slice(1).forEach(id => {
    newProperties[id] = {
      ...newProperties[id],
      type: newProperties[id]?.type || 'Пустой',
      width: newProperties[id]?.width || '',
      height: newProperties[id]?.height || '',
      formula: newProperties[id]?.formula || '',
      label: '',
      hidden: true,
      mergedInto: firstSegmentId
    };
  });

  return {
    newProperties,
    count: selectedSegments.size
  };
}

// Разъединить сегменты
export function unmergeSegments(
  selectedSegment: number | null,
  selectedSegments: Set<number>,
  segmentProperties: SegmentProperties
): { newProperties: SegmentProperties; count: number } {
  const mergedSegments: number[] = [];

  // Если есть выбранные сегменты для разъединения
  if (selectedSegments.size > 0) {
    selectedSegments.forEach(id => {
      if (segmentProperties[id]?.merged) {
        mergedSegments.push(id);
      }
    });
  }
  // Если выбран единичный сегмент
  else if (selectedSegment && segmentProperties[selectedSegment]?.merged) {
    mergedSegments.push(selectedSegment);
  }

  if (mergedSegments.length === 0) {
    throw new Error('Выберите объединенный сегмент для разъединения.');
  }

  const newProperties = { ...segmentProperties };
  let totalUnmerged = 0;

  mergedSegments.forEach(mergedId => {
    const mergedProps = newProperties[mergedId];
    if (!mergedProps?.merged) return;

    // Находим все скрытые сегменты, которые были объединены в этот
    Object.keys(newProperties).forEach(key => {
      const id = parseInt(key);
      const props = newProperties[id];
      if (props?.hidden && props?.mergedInto === mergedId) {
        // Восстанавливаем скрытый сегмент
        delete newProperties[id].hidden;
        delete newProperties[id].mergedInto;
        totalUnmerged++;
      }
    });

    // Убираем флаги объединения с главного сегмента
    delete newProperties[mergedId].merged;
    delete newProperties[mergedId].rowSpan;
    delete newProperties[mergedId].colSpan;
    totalUnmerged++;
  });

  return {
    newProperties,
    count: totalUnmerged
  };
}
