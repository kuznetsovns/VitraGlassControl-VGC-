import { useState, useRef } from 'react';
import './VitrageVisualizer.css';

// Интерфейсы для структур данных
interface Segment {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  fillType: string;
  formula: string;
  selected: boolean;
}

interface VitrageConfig {
  marking: string;
  horizontalSegments: number;
  verticalSegments: number;
  segments: Segment[][];
  totalWidth: number;
  totalHeight: number;
}

// Функция полного пересчета позиций всех сегментов
function recalculateAllPositions(segments: Segment[][], rows: number, cols: number) {
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

export default function VitrageVisualizer() {
  const [vitrageName, setVitrageName] = useState('');
  const [horizontalSegments, setHorizontalSegments] = useState('');
  const [verticalSegments, setVerticalSegments] = useState('');

  // Состояние для созданного витража
  const [createdVitrage, setCreatedVitrage] = useState<{
    name: string;
    horizontal: number;
    vertical: number;
  } | null>(null);

  // Список сохранённых витражей
  const [savedVitrages, setSavedVitrages] = useState<Array<{
    id: string;
    name: string;
    horizontal: number;
    vertical: number;
    segments: typeof segmentProperties;
    createdAt: Date;
  }>>([]);

  const horizontalRef = useRef<HTMLInputElement>(null);
  const verticalRef = useRef<HTMLInputElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);

  // Состояние для выбранного сегмента
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Свойства сегментов
  const [segmentProperties, setSegmentProperties] = useState<{
    [key: number]: {
      type: string;
      width: string;
      height: string;
      formula: string;
      label: string;
    };
  }>({});

  // Позиция панели свойств
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Состояние для масштабирования и панорамирования
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Refs для навигации в панели свойств
  const formulaRef = useRef<HTMLInputElement>(null);
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const handleVitrageNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      horizontalRef.current?.focus();
    }
  };

  const handleHorizontalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verticalRef.current?.focus();
    }
  };

  const handleVerticalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createBtnRef.current?.focus();
    }
  };

  const handleCreateVitrage = () => {
    const horizontal = parseInt(horizontalSegments);
    const vertical = parseInt(verticalSegments);

    if (!vitrageName.trim()) {
      alert('Пожалуйста, укажите маркировку витража');
      return;
    }

    if (!horizontal || horizontal < 1 || horizontal > 10) {
      alert('Пожалуйста, укажите количество сегментов по горизонтали (1-10)');
      return;
    }

    if (!vertical || vertical < 1 || vertical > 10) {
      alert('Пожалуйста, укажите количество сегментов по вертикали (1-10)');
      return;
    }

    // Создаем витраж
    setCreatedVitrage({
      name: vitrageName,
      horizontal,
      vertical
    });
  };

  const handleNewVitrage = () => {
    // Очищаем все данные для создания нового витража
    setCreatedVitrage(null);
    setSelectedSegment(null);
    setSegmentProperties({});
    setVitrageName('');
    setHorizontalSegments('');
    setVerticalSegments('');
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSaveVitrage = () => {
    if (!createdVitrage) return;

    const cols = createdVitrage.horizontal;
    const rows = createdVitrage.vertical;

    // Преобразуем данные из визуализатора в формат спецификации
    const segments = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const segmentId = row * cols + col + 1;
        const properties = segmentProperties[segmentId];

        // Мапим типы из визуализатора в типы спецификации
        let segmentType: 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door' = 'glass';
        if (properties?.type === 'Стемалит') segmentType = 'glass';
        else if (properties?.type === 'Вент решётка') segmentType = 'ventilation';
        else if (properties?.type === 'Створка') segmentType = 'casement';
        else if (properties?.type === 'Дверной блок') segmentType = 'door';
        else if (properties?.type === 'Пустой') segmentType = 'empty';
        else if (properties?.type === 'Сэндвич-панель') segmentType = 'sandwich';

        segments.push({
          id: `${row}-${col}`,
          row: row,
          col: col,
          x: 0, // позиции будут пересчитаны при отрисовке
          y: 0,
          width: properties?.width ? parseFloat(properties.width) / 5 : 600 / cols, // конвертируем из мм в px
          height: properties?.height ? parseFloat(properties.height) / 5 : 400 / rows,
          type: segmentType,
          formula: properties?.formula || undefined,
          label: `${segmentType === 'glass' ? 'СП' : segmentType === 'ventilation' ? 'ВР' : segmentType === 'casement' ? 'СТ' : segmentType === 'door' ? 'ДБ' : 'ПУ'}-${segmentId}`,
          realWidth: properties?.width ? parseFloat(properties.width) : undefined,
          realHeight: properties?.height ? parseFloat(properties.height) : undefined,
          isStemalit: properties?.type === 'Стемалит',
          selected: false,
          merged: false
        });
      }
    }

    const vitrageData = {
      id: Date.now().toString(),
      name: createdVitrage.name,
      rows: rows,
      cols: cols,
      segments: segments,
      totalWidth: 600,
      totalHeight: 400,
      profileWidth: 12,
      createdAt: new Date()
    };

    // Сохраняем в localStorage для спецификации
    const existingVitrages = localStorage.getItem('saved-vitrages');
    const vitrages = existingVitrages ? JSON.parse(existingVitrages) : [];
    vitrages.push(vitrageData);
    localStorage.setItem('saved-vitrages', JSON.stringify(vitrages));

    alert(`Витраж "${createdVitrage.name}" успешно сохранён!\n\nПараметры:\n- Сетка: ${createdVitrage.horizontal} × ${createdVitrage.vertical}\n- Всего сегментов: ${createdVitrage.horizontal * createdVitrage.vertical}\n- Сегментов с данными: ${Object.keys(segmentProperties).length}\n\nВитраж доступен во вкладке "Спецификация витражей"`);
  };

  const handleSegmentClick = (segmentId: number) => {
    setSelectedSegment(segmentId === selectedSegment ? null : segmentId);
  };

  const handlePropertyChange = (segmentId: number, property: 'type' | 'width' | 'height' | 'formula' | 'label', value: string) => {
    if (!createdVitrage) return;

    const cols = createdVitrage.horizontal;
    const rows = createdVitrage.vertical;

    // Вычисляем позицию текущего сегмента
    const currentRow = Math.floor((segmentId - 1) / cols);
    const currentCol = (segmentId - 1) % cols;

    setSegmentProperties(prev => {
      const updated = { ...prev };

      // Для изменения ширины - применяем ко всем сегментам в столбце
      if (property === 'width') {
        for (let row = 0; row < rows; row++) {
          const targetSegmentId = row * cols + currentCol + 1;
          updated[targetSegmentId] = {
            ...updated[targetSegmentId],
            type: updated[targetSegmentId]?.type || 'Пустой',
            width: value,
            height: updated[targetSegmentId]?.height || '',
            formula: updated[targetSegmentId]?.formula || '',
            label: updated[targetSegmentId]?.label || ''
          };
        }
      }
      // Для изменения высоты - применяем ко всем сегментам в строке
      else if (property === 'height') {
        for (let col = 0; col < cols; col++) {
          const targetSegmentId = currentRow * cols + col + 1;
          updated[targetSegmentId] = {
            ...updated[targetSegmentId],
            type: updated[targetSegmentId]?.type || 'Пустой',
            width: updated[targetSegmentId]?.width || '',
            height: value,
            formula: updated[targetSegmentId]?.formula || '',
            label: updated[targetSegmentId]?.label || ''
          };
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
    });
  };

  const handleSaveSegment = () => {
    if (selectedSegment) {
      alert(`Сегмент #${selectedSegment} сохранён`);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanelPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFormulaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      widthRef.current?.focus();
    }
  };

  const handleWidthKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      heightRef.current?.focus();
    }
  };

  const handleHeightKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveButtonRef.current?.focus();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Конвертация мм в пиксели (масштаб 1:5)
  const mmToPixels = (mm: string): number => {
    const mmValue = parseFloat(mm);
    return isNaN(mmValue) ? 0 : mmValue / 5;
  };

  // Если витраж создан, показываем рабочее пространство визуализации
  if (createdVitrage) {
    return (
      <div className="vitrage-visualizer">
        <div className="workspace-header">
          <div className="header-left">
            <h2 className="vitrage-title">{createdVitrage.name}</h2>
          </div>

          <div className="header-controls">
            <button className="action-btn new-btn" onClick={handleNewVitrage} title="Создать новый витраж">
              <span className="btn-icon">+</span>
              <span className="btn-text">Новый витраж</span>
            </button>
            <button className="action-btn save-btn" onClick={handleSaveVitrage} title="Сохранить текущий витраж">
              <span className="btn-icon">💾</span>
              <span className="btn-text">Сохранить витраж</span>
            </button>

            <div className="zoom-controls">
              <button className="zoom-btn" onClick={handleZoomOut} title="Уменьшить (Ctrl + колесо мыши)">
                −
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button className="zoom-btn" onClick={handleZoomIn} title="Увеличить (Ctrl + колесо мыши)">
                +
              </button>
              <button className="zoom-btn" onClick={handleResetZoom} title="Сбросить масштаб">
                ⟲
              </button>
            </div>
          </div>
        </div>

        <div className="workspace-layout">
          <div
            className="workspace-container"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div
              className="grid-visualization-workspace"
              onWheel={handleWheel}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              style={{
                cursor: isPanning ? 'grabbing' : 'grab',
                overflow: 'auto'
              }}
            >
            {(() => {
              const cols = createdVitrage.horizontal;
              const rows = createdVitrage.vertical;
              const baseSegmentWidth = 600 / cols;
              const baseSegmentHeight = 400 / rows;

              // Рассчитываем ширину для каждой колонки
              const columnWidths: number[] = [];
              for (let col = 0; col < cols; col++) {
                let maxWidth = baseSegmentWidth;
                for (let row = 0; row < rows; row++) {
                  const segmentId = row * cols + col + 1;
                  const properties = segmentProperties[segmentId];
                  if (properties?.width) {
                    const customWidth = mmToPixels(properties.width);
                    maxWidth = Math.max(maxWidth, customWidth);
                  }
                }
                columnWidths.push(maxWidth);
              }

              // Рассчитываем высоту для каждой строки
              const rowHeights: number[] = [];
              for (let row = 0; row < rows; row++) {
                let maxHeight = baseSegmentHeight;
                for (let col = 0; col < cols; col++) {
                  const segmentId = row * cols + col + 1;
                  const properties = segmentProperties[segmentId];
                  if (properties?.height) {
                    const customHeight = mmToPixels(properties.height);
                    maxHeight = Math.max(maxHeight, customHeight);
                  }
                }
                rowHeights.push(maxHeight);
              }

              const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);
              const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);

              // Добавляем отступы
              const padding = 50;
              const offsetX = padding;
              const offsetY = padding;
              const viewBoxWidth = totalWidth + padding * 2;
              const viewBoxHeight = totalHeight + padding * 2;

              return (
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                  className="vitrage-grid-workspace"
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                  }}
                >
              {/* Динамическая внешняя рамка */}
              <rect
                x={offsetX}
                y={offsetY}
                width={totalWidth}
                height={totalHeight}
                fill="none"
                stroke="#2c3e50"
                strokeWidth="4"
              />

              {/* Рисуем сетку сегментов */}
              {(() => {
                const segments = [];
                const rigels = [];
                const rigelWidth = 8; // Ширина ригеля в пикселях

                // Рассчитываем кумулятивные позиции
                const cumulativeX: number[] = [offsetX];
                for (let col = 0; col < cols; col++) {
                  cumulativeX.push(cumulativeX[col] + columnWidths[col]);
                }

                const cumulativeY: number[] = [offsetY];
                for (let row = 0; row < rows; row++) {
                  cumulativeY.push(cumulativeY[row] + rowHeights[row]);
                }

                // Рисуем сегменты с новыми позициями
                for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                    const segmentId = row * cols + col + 1;
                    const properties = segmentProperties[segmentId];

                    const segmentWidth = columnWidths[col];
                    const segmentHeight = rowHeights[row];
                    const x = cumulativeX[col];
                    const y = cumulativeY[row];

                    const isSelected = selectedSegment === segmentId;

                    // Цвет в зависимости от типа (по умолчанию пустой)
                    let fillColor = "rgba(211, 211, 211, 0.2)"; // Пустой - серый (по умолчанию)
                    if (isSelected) {
                      fillColor = "rgba(74, 144, 226, 0.4)";
                    } else if (properties?.type === 'Стеклопакет') {
                      fillColor = "rgba(135, 206, 235, 0.2)"; // Стеклопакет - голубой
                    } else if (properties?.type === 'Стемалит') {
                      fillColor = "rgba(147, 112, 219, 0.2)"; // Фиолетовый
                    } else if (properties?.type === 'Вент решётка') {
                      fillColor = "rgba(144, 238, 144, 0.2)"; // Зелёный
                    } else if (properties?.type === 'Створка') {
                      fillColor = "rgba(255, 192, 203, 0.2)"; // Розовый
                    } else if (properties?.type === 'Дверной блок') {
                      fillColor = "rgba(139, 69, 19, 0.2)"; // Коричневый
                    } else if (properties?.type === 'Сэндвич-панель') {
                      fillColor = "rgba(255, 228, 181, 0.2)"; // Бежевый
                    }

                    segments.push(
                      <g key={`segment-${row}-${col}`}>
                        {/* Сегмент */}
                        <rect
                          x={x}
                          y={y}
                          width={segmentWidth}
                          height={segmentHeight}
                          fill={fillColor}
                          stroke={isSelected ? "#2c3e50" : "#87ceeb"}
                          strokeWidth={isSelected ? "3" : "2"}
                          onClick={() => handleSegmentClick(segmentId)}
                          style={{ cursor: 'pointer' }}
                        />
                        {/* Обозначение сегмента */}
                        {properties?.label && (
                          <text
                            x={x + segmentWidth / 2}
                            y={y + segmentHeight / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="16"
                            fill="#2c3e50"
                            fontWeight="600"
                            style={{ pointerEvents: 'none' }}
                          >
                            {properties.label}
                          </text>
                        )}
                      </g>
                    );
                  }
                }

                // Рисуем горизонтальные ригели (между рядами)
                for (let row = 1; row < rows; row++) {
                  const y = cumulativeY[row] - rigelWidth / 2;
                  rigels.push(
                    <rect
                      key={`h-rigel-${row}`}
                      x={offsetX}
                      y={y}
                      width={totalWidth}
                      height={rigelWidth}
                      fill="#2c3e50"
                      opacity="0.8"
                    />
                  );
                }

                // Рисуем вертикальные ригели (между колонками)
                for (let col = 1; col < cols; col++) {
                  const x = cumulativeX[col] - rigelWidth / 2;
                  rigels.push(
                    <rect
                      key={`v-rigel-${col}`}
                      x={x}
                      y={offsetY}
                      width={rigelWidth}
                      height={totalHeight}
                      fill="#2c3e50"
                      opacity="0.8"
                    />
                  );
                }

                return [...segments, ...rigels];
              })()}
            </svg>
            );
            })()}
            </div>

            <div className="workspace-info">
              {selectedSegment && (
                <div className="properties-panel-sidebar">
                  <div className="properties-panel-header">
                    <h3>Свойства сегмента #{selectedSegment}</h3>
                    <button
                      className="close-panel-btn"
                      onClick={() => setSelectedSegment(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="properties-form">
                    <div className="form-group">
                      <label htmlFor="segment-type">Тип заполнения:</label>
                      <select
                        id="segment-type"
                        value={segmentProperties[selectedSegment]?.type || 'Пустой'}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'type', e.target.value)}
                        className="property-select"
                      >
                        <option value="Пустой">Пустой</option>
                        <option value="Стеклопакет">Стеклопакет</option>
                        <option value="Стемалит">Стемалит</option>
                        <option value="Вент решётка">Вент решётка</option>
                        <option value="Створка">Створка</option>
                        <option value="Дверной блок">Дверной блок</option>
                        <option value="Сэндвич-панель">Сэндвич-панель</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="segment-label">Обозначение сегмента:</label>
                      <input
                        id="segment-label"
                        type="text"
                        value={segmentProperties[selectedSegment]?.label || ''}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'label', e.target.value)}
                        placeholder="Например: СП-1, В-01"
                        className="property-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="segment-formula">Формула стеклопакета:</label>
                      <input
                        ref={formulaRef}
                        id="segment-formula"
                        type="text"
                        value={segmentProperties[selectedSegment]?.formula || ''}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'formula', e.target.value)}
                        onKeyDown={handleFormulaKeyDown}
                        placeholder="Например: 4М1-16-4М1"
                        className="property-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="segment-width">Ширина (мм):</label>
                      <input
                        ref={widthRef}
                        id="segment-width"
                        type="number"
                        value={segmentProperties[selectedSegment]?.width || ''}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'width', e.target.value)}
                        onKeyDown={handleWidthKeyDown}
                        placeholder="Например: 1000"
                        className="property-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="segment-height">Высота (мм):</label>
                      <input
                        ref={heightRef}
                        id="segment-height"
                        type="number"
                        value={segmentProperties[selectedSegment]?.height || ''}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'height', e.target.value)}
                        onKeyDown={handleHeightKeyDown}
                        placeholder="Например: 1500"
                        className="property-input"
                      />
                    </div>
                    <button ref={saveButtonRef} className="save-segment-btn" onClick={handleSaveSegment}>
                      Сохранить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="vitrage-info-bar">
            <div className="info-bar-item">
              <span className="info-bar-label">Маркировка:</span>
              <span className="info-bar-value">{createdVitrage.name}</span>
            </div>
            <div className="info-bar-item">
              <span className="info-bar-label">Сетка:</span>
              <span className="info-bar-value">{createdVitrage.horizontal} × {createdVitrage.vertical}</span>
            </div>
            <div className="info-bar-item">
              <span className="info-bar-label">Всего сегментов:</span>
              <span className="info-bar-value">{createdVitrage.horizontal * createdVitrage.vertical}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Показываем форму конфигурации
  return (
    <div className="vitrage-visualizer">
      <h2>Визуализатор Витража</h2>

      <div className="config-panel">
        <h3>Конфигурация витража</h3>

        <div className="config-form">
          <div className="form-group">
            <label htmlFor="vitrage-name">Маркировка витража:</label>
            <input
              id="vitrage-name"
              type="text"
              value={vitrageName}
              onChange={(e) => setVitrageName(e.target.value)}
              onKeyDown={handleVitrageNameKeyDown}
              placeholder="Например: В-01, ВТ-003"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="horizontal-segments">Количество сегментов по горизонтали:</label>
            <input
              ref={horizontalRef}
              id="horizontal-segments"
              type="number"
              min="1"
              max="10"
              value={horizontalSegments}
              onChange={(e) => setHorizontalSegments(e.target.value)}
              onKeyDown={handleHorizontalKeyDown}
              placeholder="0"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vertical-segments">Количество сегментов по вертикали:</label>
            <input
              ref={verticalRef}
              id="vertical-segments"
              type="number"
              min="1"
              max="10"
              value={verticalSegments}
              onChange={(e) => setVerticalSegments(e.target.value)}
              onKeyDown={handleVerticalKeyDown}
              placeholder="0"
              autoComplete="off"
            />
          </div>

          <button ref={createBtnRef} className="create-btn" onClick={handleCreateVitrage}>
            Создать витраж
          </button>
        </div>
      </div>

      <div className="preview-panel">
        <h3>Предварительный просмотр</h3>
        <div className="preview-info">
          <p><strong>Маркировка:</strong> {vitrageName || '—'}</p>
          <p><strong>Сетка:</strong> {horizontalSegments || '0'} × {verticalSegments || '0'} сегментов</p>
          <p><strong>Всего сегментов:</strong> {(parseInt(horizontalSegments) || 0) * (parseInt(verticalSegments) || 0)}</p>
        </div>

        {parseInt(horizontalSegments) > 0 && parseInt(verticalSegments) > 0 && (
          <div className="grid-visualization">
            <svg
              width="600"
              height="400"
              viewBox="0 0 600 400"
              className="vitrage-grid"
            >
              {/* Внешняя рамка */}
              <rect
                x="50"
                y="50"
                width="500"
                height="300"
                fill="none"
                stroke="#2c3e50"
                strokeWidth="3"
              />

              {/* Рисуем сетку сегментов */}
              {(() => {
                const cols = parseInt(horizontalSegments);
                const rows = parseInt(verticalSegments);
                const segmentWidth = 500 / cols;
                const segmentHeight = 300 / rows;
                const segments = [];

                for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                    const x = 50 + col * segmentWidth;
                    const y = 50 + row * segmentHeight;

                    segments.push(
                      <g key={`segment-${row}-${col}`}>
                        {/* Сегмент */}
                        <rect
                          x={x}
                          y={y}
                          width={segmentWidth}
                          height={segmentHeight}
                          fill="rgba(135, 206, 235, 0.2)"
                          stroke="#87ceeb"
                          strokeWidth="1"
                        />
                        {/* Номер сегмента */}
                        <text
                          x={x + segmentWidth / 2}
                          y={y + segmentHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="12"
                          fill="#2c3e50"
                          fontWeight="600"
                        >
                          {row * cols + col + 1}
                        </text>
                      </g>
                    );
                  }
                }

                return segments;
              })()}

              {/* Маркировка витража */}
              {vitrageName && (
                <text
                  x="300"
                  y="30"
                  textAnchor="middle"
                  fontSize="16"
                  fill="#2c3e50"
                  fontWeight="700"
                >
                  {vitrageName}
                </text>
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
