import type { SegmentProperties } from '../types/segment.types'

// Получить цвет заливки в зависимости от типа сегмента
export function getSegmentFillColor(
  type: string | undefined,
  isSelected: boolean = false,
  isMultiSelected: boolean = false
): string {
  if (isSelected) {
    return 'rgba(74, 144, 226, 0.4)'; // Синий для выбранного
  }
  if (isMultiSelected) {
    return 'rgba(255, 165, 0, 0.4)'; // Оранжевый для множественного выбора
  }

  // Цвета по типам
  const colorMap: Record<string, string> = {
    'Стеклопакет': 'rgba(135, 206, 235, 0.2)',     // Голубой
    'Стемалит': 'rgba(147, 112, 219, 0.2)',        // Фиолетовый
    'Вент решётка': 'rgba(144, 238, 144, 0.2)',    // Зелёный
    'Створка': 'rgba(255, 192, 203, 0.2)',         // Розовый
    'Дверной блок': 'rgba(139, 69, 19, 0.2)',      // Коричневый
    'Сэндвич-панель': 'rgba(255, 228, 181, 0.2)'   // Бежевый
  };

  return colorMap[type || 'Пустой'] || 'rgba(211, 211, 211, 0.2)'; // Серый по умолчанию
}

// Генерировать SVG-строку витража
export function generateVitrageSVG(
  createdVitrageHorizontal: number,
  createdVitrageVertical: number,
  segmentProperties: SegmentProperties
): string {
  const cols = createdVitrageHorizontal;
  const rows = createdVitrageVertical;
  const baseSegmentWidth = 600 / cols;
  const baseSegmentHeight = 400 / rows;

  // Инициализируем массивы для ширины и высоты
  const columnWidths: number[] = new Array(cols).fill(baseSegmentWidth);
  const rowHeights: number[] = new Array(rows).fill(baseSegmentHeight);

  // Обрабатываем все сегменты для установки базовых размеров столбцов и строк
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const segmentId = row * cols + col + 1;
      const properties = segmentProperties[segmentId];

      // Пропускаем скрытые сегменты
      if (properties?.hidden) continue;

      // Для обычных сегментов просто берем их размеры
      if (!properties?.merged) {
        if (properties?.width) {
          const customWidth = parseFloat(properties.width) / 5;
          columnWidths[col] = Math.max(columnWidths[col], customWidth);
        }

        if (properties?.height) {
          const customHeight = parseFloat(properties.height) / 5;
          rowHeights[row] = Math.max(rowHeights[row], customHeight);
        }
      } else {
        // Для объединенных сегментов распределяем их размеры на столбцы/строки
        const colSpan = properties.colSpan || 1;
        const rowSpan = properties.rowSpan || 1;

        if (properties.width) {
          const mergedWidth = parseFloat(properties.width) / 5;
          const widthPerColumn = mergedWidth / colSpan;
          for (let c = col; c < col + colSpan && c < cols; c++) {
            columnWidths[c] = Math.max(columnWidths[c], widthPerColumn);
          }
        }

        if (properties.height) {
          const mergedHeight = parseFloat(properties.height) / 5;
          const heightPerRow = mergedHeight / rowSpan;
          for (let r = row; r < row + rowSpan && r < rows; r++) {
            rowHeights[r] = Math.max(rowHeights[r], heightPerRow);
          }
        }
      }
    }
  }

  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  const padding = 50;
  const viewBoxWidth = totalWidth + padding * 2;
  const viewBoxHeight = totalHeight + padding * 2;

  // Генерируем SVG
  let svgContent = `<svg width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">`;

  // Внешняя рамка
  svgContent += `<rect x="${padding}" y="${padding}" width="${totalWidth}" height="${totalHeight}" fill="none" stroke="#2c3e50" stroke-width="4"/>`;

  // Сегменты
  const cumulativeX: number[] = [padding];
  for (let col = 0; col < cols; col++) {
    cumulativeX.push(cumulativeX[col] + columnWidths[col]);
  }

  const cumulativeY: number[] = [padding];
  for (let row = 0; row < rows; row++) {
    cumulativeY.push(cumulativeY[row] + rowHeights[row]);
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const segmentId = row * cols + col + 1;
      const properties = segmentProperties[segmentId];

      // Пропускаем скрытые сегменты (объединенные в другой сегмент)
      if (properties?.hidden) continue;

      const segmentWidth = columnWidths[col];
      const segmentHeight = rowHeights[row];
      const x = cumulativeX[col];
      const y = cumulativeY[row];

      // Если сегмент объединенный, рассчитываем его размеры
      let actualWidth = segmentWidth;
      let actualHeight = segmentHeight;
      if (properties?.merged && properties?.rowSpan && properties?.colSpan) {
        actualWidth = 0;
        for (let c = col; c < col + properties.colSpan && c < cols; c++) {
          actualWidth += columnWidths[c];
        }
        actualHeight = 0;
        for (let r = row; r < row + properties.rowSpan && r < rows; r++) {
          actualHeight += rowHeights[r];
        }
      }

      const fillColor = getSegmentFillColor(properties?.type);

      svgContent += `<rect x="${x}" y="${y}" width="${actualWidth}" height="${actualHeight}" fill="${fillColor}" stroke="#87ceeb" stroke-width="2" data-segment-id="${segmentId}" class="vitrage-segment" style="cursor: pointer;"/>`;

      if (properties?.label) {
        svgContent += `<text x="${x + actualWidth / 2}" y="${y + actualHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#2c3e50" font-weight="600" pointer-events="none">${properties.label}</text>`;
      }
    }
  }

  svgContent += '</svg>';
  return svgContent;
}

// Получить цвет stroke в зависимости от состояния выбора
export function getSegmentStrokeColor(isSelected: boolean, isMultiSelected: boolean): string {
  if (isSelected || isMultiSelected) {
    return '#2c3e50';
  }
  return '#87ceeb';
}

// Получить толщину stroke в зависимости от состояния выбора
export function getSegmentStrokeWidth(isSelected: boolean, isMultiSelected: boolean): string {
  if (isSelected || isMultiSelected) {
    return '3';
  }
  return '2';
}
