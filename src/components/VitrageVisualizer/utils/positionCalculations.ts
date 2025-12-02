import type { Segment, SegmentCalculationResult } from '../types/segment.types'

// Полный пересчет позиций всех сегментов
export function recalculateAllPositions(
  segments: Segment[][],
  rows: number,
  cols: number
): SegmentCalculationResult {
  let currentY = 0;
  let maxWidth = 0;

  // Проходим по каждому ряду
  for (let row = 0; row < rows; row++) {
    let currentX = 0;
    let rowHeight = 0;

    // Находим максимальную высоту в этом ряду
    for (let col = 0; col < cols; col++) {
      rowHeight = Math.max(rowHeight, segments[row][col].height);
    }

    // Проходим по каждому сегменту в ряду
    for (let col = 0; col < cols; col++) {
      // Обновляем позиции сегмента
      segments[row][col].positionX = currentX;
      segments[row][col].positionY = currentY;

      // Сдвигаем X для следующего сегмента
      currentX += segments[row][col].width;
    }

    // Обновляем максимальную ширину витража
    maxWidth = Math.max(maxWidth, currentX);

    // Сдвигаем Y для следующего ряда
    currentY += rowHeight;
  }

  return {
    segments,
    totalWidth: maxWidth,
    totalHeight: currentY
  };
}

// Конвертация миллиметров в пиксели (масштаб 1:5)
export const mmToPixels = (mm: string): number => {
  const mmValue = parseFloat(mm);
  return isNaN(mmValue) ? 0 : mmValue / 5;
};

// Конвертация пикселей в миллиметры (масштаб 1:5)
export const pixelsToMm = (pixels: number): string => {
  return (pixels * 5).toString();
};

// Рассчитать кумулятивные позиции для столбцов
export function calculateColumnPositions(columnWidths: number[], offsetX: number = 0): number[] {
  const positions = [offsetX];
  for (let i = 0; i < columnWidths.length; i++) {
    positions.push(positions[i] + columnWidths[i]);
  }
  return positions;
}

// Рассчитать кумулятивные позиции для строк
export function calculateRowPositions(rowHeights: number[], offsetY: number = 0): number[] {
  const positions = [offsetY];
  for (let i = 0; i < rowHeights.length; i++) {
    positions.push(positions[i] + rowHeights[i]);
  }
  return positions;
}

// Получить общую ширину и высоту
export function calculateTotalDimensions(columnWidths: number[], rowHeights: number[]): { width: number; height: number } {
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
  return { width: totalWidth, height: totalHeight };
}
