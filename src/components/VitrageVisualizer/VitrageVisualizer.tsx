import { useState, useRef, useEffect } from 'react';
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

interface ObjectVersion {
  id: string;
  name: string;
  createdAt: Date;
}

interface ProjectObject {
  id: string;
  name: string;
  versions: ObjectVersion[];
  createdAt: Date;
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
  // Загрузка объектов из localStorage
  const loadObjects = (): ProjectObject[] => {
    const saved = localStorage.getItem('project-objects');
    return saved ? JSON.parse(saved) : [];
  };

  const [objects, setObjects] = useState<ProjectObject[]>(loadObjects());
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [newObjectName, setNewObjectName] = useState('');
  const [newVersionName, setNewVersionName] = useState('');
  const [vitrageName, setVitrageName] = useState('');
  const [siteManager, setSiteManager] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [horizontalSegments, setHorizontalSegments] = useState('');
  const [verticalSegments, setVerticalSegments] = useState('');

  // Состояние для созданного витража
  const [createdVitrage, setCreatedVitrage] = useState<{
    name: string;
    siteManager?: string;
    creationDate?: string;
    horizontal: number;
    vertical: number;
  } | null>(null);

  // Список сохранённых витражей
  const [savedVitrages, setSavedVitrages] = useState<Array<{
    id: string;
    name: string;
    siteManager?: string;
    creationDate?: string;
    horizontal: number;
    vertical: number;
    segments: typeof segmentProperties;
    createdAt: Date;
  }>>([]);

  const vitrageNameRef = useRef<HTMLInputElement>(null);
  const siteManagerRef = useRef<HTMLInputElement>(null);
  const creationDateRef = useRef<HTMLInputElement>(null);
  const horizontalRef = useRef<HTMLInputElement>(null);
  const verticalRef = useRef<HTMLInputElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);

  // Состояние для выбранного сегмента
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Состояние для режима выбора сегментов для объединения
  const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set());

  // Свойства сегментов
  const [segmentProperties, setSegmentProperties] = useState<{
    [key: number]: {
      type: string;
      width: string;
      height: string;
      formula: string;
      label: string;
      merged?: boolean;
      rowSpan?: number;
      colSpan?: number;
      hidden?: boolean;
      mergedInto?: number;
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
  const typeRef = useRef<HTMLSelectElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const formulaRef = useRef<HTMLInputElement>(null);
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Сохранение объектов в localStorage
  useEffect(() => {
    localStorage.setItem('project-objects', JSON.stringify(objects));
  }, [objects]);

  // Автофокус на первом поле при открытии панели свойств
  useEffect(() => {
    if (selectedSegment !== null) {
      typeRef.current?.focus();
    }
  }, [selectedSegment]);

  // Функции управления объектами
  const handleAddObject = () => {
    if (!newObjectName.trim()) {
      alert('Введите название объекта');
      return;
    }

    const newObject: ProjectObject = {
      id: Date.now().toString(),
      name: newObjectName,
      versions: [{
        id: Date.now().toString(),
        name: 'Версия 1.0',
        createdAt: new Date()
      }],
      createdAt: new Date()
    };

    setObjects([...objects, newObject]);
    setNewObjectName('');
    setShowObjectModal(false);
    setSelectedObject(newObject.id);
    setSelectedVersion(newObject.versions[0].id);
  };

  const handleEditObject = () => {
    if (!newObjectName.trim() || !editingObjectId) {
      alert('Введите название объекта');
      return;
    }

    setObjects(objects.map(obj =>
      obj.id === editingObjectId
        ? { ...obj, name: newObjectName }
        : obj
    ));

    setNewObjectName('');
    setEditingObjectId(null);
    setShowEditModal(false);
  };

  const handleAddVersion = () => {
    if (!newVersionName.trim() || !selectedObject) {
      alert('Введите название версии');
      return;
    }

    const newVersion: ObjectVersion = {
      id: Date.now().toString(),
      name: newVersionName,
      createdAt: new Date()
    };

    setObjects(objects.map(obj =>
      obj.id === selectedObject
        ? { ...obj, versions: [...obj.versions, newVersion] }
        : obj
    ));

    setNewVersionName('');
    setShowVersionModal(false);
    setSelectedVersion(newVersion.id);
  };

  const openEditModal = (objectId: string) => {
    const obj = objects.find(o => o.id === objectId);
    if (obj) {
      setEditingObjectId(objectId);
      setNewObjectName(obj.name);
      setShowEditModal(true);
    }
  };

  const handleVitrageNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      siteManagerRef.current?.focus();
    }
  };

  const handleSiteManagerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      creationDateRef.current?.focus();
    }
  };

  const handleCreationDateKeyDown = (e: React.KeyboardEvent) => {
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
      siteManager: siteManager.trim() || undefined,
      creationDate: creationDate.trim() || undefined,
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

  const generateVitrageSVG = (): string => {
    if (!createdVitrage) return '';

    const cols = createdVitrage.horizontal;
    const rows = createdVitrage.vertical;
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

        let fillColor = "rgba(211, 211, 211, 0.2)";
        if (properties?.type === 'Стеклопакет') fillColor = "rgba(135, 206, 235, 0.2)";
        else if (properties?.type === 'Стемалит') fillColor = "rgba(147, 112, 219, 0.2)";
        else if (properties?.type === 'Вент решётка') fillColor = "rgba(144, 238, 144, 0.2)";
        else if (properties?.type === 'Створка') fillColor = "rgba(255, 192, 203, 0.2)";
        else if (properties?.type === 'Дверной блок') fillColor = "rgba(139, 69, 19, 0.2)";
        else if (properties?.type === 'Сэндвич-панель') fillColor = "rgba(255, 228, 181, 0.2)";

        svgContent += `<rect x="${x}" y="${y}" width="${actualWidth}" height="${actualHeight}" fill="${fillColor}" stroke="#87ceeb" stroke-width="2" data-segment-id="${segmentId}" class="vitrage-segment" style="cursor: pointer;"/>`;

        if (properties?.label) {
          svgContent += `<text x="${x + actualWidth / 2}" y="${y + actualHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="#2c3e50" font-weight="600" pointer-events="none">${properties.label}</text>`;
        }
      }
    }

    svgContent += '</svg>';
    return svgContent;
  };

  const handleSaveVitrage = () => {
    if (!createdVitrage) {
      console.error('Витраж не создан');
      return;
    }

    // Проверяем, что выбраны объект и версия
    if (!selectedObject || !selectedVersion) {
      alert('Пожалуйста, выберите объект и версию перед сохранением витража');
      return;
    }

    try {
      const cols = createdVitrage.horizontal;
      const rows = createdVitrage.vertical;

      // Преобразуем данные из визуализатора в формат спецификации
      const segments = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const segmentId = row * cols + col + 1;
          const properties = segmentProperties[segmentId];

          segments.push({
            id: `${row}-${col}`,
            type: properties?.type || 'Пустой',
            width: properties?.width ? parseFloat(properties.width) : undefined,
            height: properties?.height ? parseFloat(properties.height) : undefined,
            formula: properties?.formula || undefined,
            label: properties?.label || `${segmentId}`
          });
        }
      }

      // Генерируем SVG отрисовку
      console.log('Генерация SVG...');
      const svgDrawing = generateVitrageSVG();
      console.log('SVG сгенерирован, длина:', svgDrawing.length);

      const vitrageData = {
        id: Date.now().toString(),
        name: createdVitrage.name,
        siteManager: createdVitrage.siteManager,
        creationDate: createdVitrage.creationDate,
        objectId: selectedObject,
        versionId: selectedVersion,
        rows: rows,
        cols: cols,
        segments: segments,
        totalWidth: 600,
        totalHeight: 400,
        svgDrawing: svgDrawing, // Сохраняем SVG
        createdAt: new Date()
      };

      console.log('Данные витража:', vitrageData);

      // Сохраняем в localStorage для спецификации
      const existingVitrages = localStorage.getItem('saved-vitrages');
      const vitrages = existingVitrages ? JSON.parse(existingVitrages) : [];
      vitrages.push(vitrageData);
      localStorage.setItem('saved-vitrages', JSON.stringify(vitrages));

      console.log('Витраж сохранён в localStorage');

      const objectName = objects.find(o => o.id === selectedObject)?.name || '';
      const versionName = objects.find(o => o.id === selectedObject)?.versions.find(v => v.id === selectedVersion)?.name || '';

      alert(`Витраж "${createdVitrage.name}" успешно сохранён!\n\nПараметры:\n- Объект: ${objectName}\n- Версия: ${versionName}\n- Сетка: ${createdVitrage.horizontal} × ${createdVitrage.vertical}\n- Всего сегментов: ${createdVitrage.horizontal * createdVitrage.vertical}\n- Сегментов с данными: ${Object.keys(segmentProperties).length}\n\nВитраж доступен во вкладке "Спецификация Витражей"`);
    } catch (error) {
      console.error('Ошибка при сохранении витража:', error);
      alert('Произошла ошибка при сохранении витража. Проверьте консоль для деталей.');
    }
  };

  const handleSegmentClick = (segmentId: number, ctrlKey: boolean) => {
    if (ctrlKey) {
      // Режим множественного выбора для объединения
      setSelectedSegments(prev => {
        const newSet = new Set(prev);
        if (newSet.has(segmentId)) {
          newSet.delete(segmentId);
        } else {
          newSet.add(segmentId);
        }
        return newSet;
      });
      setSelectedSegment(null); // Отменяем выбор единичного сегмента
    } else {
      // Обычный режим редактирования
      setSelectedSegment(segmentId === selectedSegment ? null : segmentId);
      setSelectedSegments(new Set()); // Сбрасываем множественный выбор
    }
  };

  const handlePropertyChange = (segmentId: number, property: 'type' | 'width' | 'height' | 'formula' | 'label', value: string) => {
    if (!createdVitrage) return;

    const cols = createdVitrage.horizontal;
    const rows = createdVitrage.vertical;

    setSegmentProperties(prev => {
      const updated = { ...prev };
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
              const mergedStartCol = (targetSegmentId - 1) % cols;
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

  const handleTypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      labelRef.current?.focus();
    }
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      formulaRef.current?.focus();
    }
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

  const handleMergeSegments = () => {
    if (selectedSegments.size < 2) {
      alert('Выберите минимум 2 сегмента для объединения.\n\nУдерживайте Ctrl и кликайте на сегменты для выбора.');
      return;
    }

    if (!createdVitrage) return;

    const cols = createdVitrage.horizontal;
    const rows = createdVitrage.vertical;

    // Получаем координаты выбранных сегментов
    const segmentsArray = Array.from(selectedSegments);
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
      alert('Выбранные сегменты должны образовывать прямоугольную область.');
      return;
    }

    // Проверяем непрерывность
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const id = row * cols + col + 1;
        if (!selectedSegments.has(id)) {
          alert('Выбранные сегменты должны быть непрерывными и образовывать прямоугольник.');
          return;
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

    // Помечаем первый сегмент как объединенный и обновляем его размеры
    let totalWidth = 0;
    let totalHeight = 0;

    for (let col = minCol; col <= maxCol; col++) {
      const segId = minRow * cols + col + 1;
      const width = parseFloat(newProperties[segId]?.width || '0');
      totalWidth += width;
    }

    for (let row = minRow; row <= maxRow; row++) {
      const segId = row * cols + minCol + 1;
      const height = parseFloat(newProperties[segId]?.height || '0');
      totalHeight += height;
    }

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

    setSegmentProperties(newProperties);
    setSelectedSegments(new Set());
    alert(`Объединено сегментов: ${selectedSegments.size}`);
  };

  const handleUnmergeSegments = () => {
    if (!createdVitrage) return;

    // Находим все объединенные сегменты для разъединения
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
      alert('Выберите объединенный сегмент для разъединения.');
      return;
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

    setSegmentProperties(newProperties);
    setSelectedSegments(new Set());
    setSelectedSegment(null);
    alert(`Разъединено сегментов: ${totalUnmerged}`);
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
            {createdVitrage.siteManager && (
              <p className="vitrage-subtitle">Начальник участка: {createdVitrage.siteManager}</p>
            )}
            {createdVitrage.creationDate && (
              <p className="vitrage-subtitle">Дата создания: {new Date(createdVitrage.creationDate).toLocaleDateString('ru-RU')}</p>
            )}
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
            <button className="action-btn merge-btn" onClick={handleMergeSegments} title="Объединить выбранные сегменты">
              <span className="btn-icon">⊞</span>
              <span className="btn-text">Объединить сегменты</span>
            </button>
            <button className="action-btn unmerge-btn" onClick={handleUnmergeSegments} title="Разъединить выбранный сегмент">
              <span className="btn-icon">⊟</span>
              <span className="btn-text">Разъединить сегменты</span>
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
                      const customWidth = mmToPixels(properties.width);
                      columnWidths[col] = Math.max(columnWidths[col], customWidth);
                    }

                    if (properties?.height) {
                      const customHeight = mmToPixels(properties.height);
                      rowHeights[row] = Math.max(rowHeights[row], customHeight);
                    }
                  } else {
                    // Для объединенных сегментов распределяем их размеры на столбцы/строки
                    const colSpan = properties.colSpan || 1;
                    const rowSpan = properties.rowSpan || 1;

                    if (properties.width) {
                      const mergedWidth = mmToPixels(properties.width);
                      const widthPerColumn = mergedWidth / colSpan;
                      for (let c = col; c < col + colSpan && c < cols; c++) {
                        columnWidths[c] = Math.max(columnWidths[c], widthPerColumn);
                      }
                    }

                    if (properties.height) {
                      const mergedHeight = mmToPixels(properties.height);
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

                    // Пропускаем скрытые сегменты (объединенные в другой сегмент)
                    if (properties?.hidden) continue;

                    const segmentWidth = columnWidths[col];
                    const segmentHeight = rowHeights[row];
                    const x = cumulativeX[col];
                    const y = cumulativeY[row];

                    const isSelected = selectedSegment === segmentId;
                    const isMultiSelected = selectedSegments.has(segmentId);

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

                    // Цвет в зависимости от типа (по умолчанию пустой)
                    let fillColor = "rgba(211, 211, 211, 0.2)"; // Пустой - серый (по умолчанию)
                    if (isSelected) {
                      fillColor = "rgba(74, 144, 226, 0.4)";
                    } else if (isMultiSelected) {
                      fillColor = "rgba(255, 165, 0, 0.4)"; // Оранжевый для множественного выбора
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
                          width={actualWidth}
                          height={actualHeight}
                          fill={fillColor}
                          stroke={isSelected || isMultiSelected ? "#2c3e50" : "#87ceeb"}
                          strokeWidth={isSelected || isMultiSelected ? "3" : "2"}
                          onClick={(e) => handleSegmentClick(segmentId, e.ctrlKey)}
                          style={{ cursor: 'pointer' }}
                        />
                        {/* Обозначение сегмента */}
                        {properties?.label && (
                          <text
                            x={x + actualWidth / 2}
                            y={y + actualHeight / 2}
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

                // Функция для проверки, находятся ли два сегмента в одном объединенном сегменте
                const areInSameMergedSegment = (segId1: number, segId2: number): boolean => {
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
                };

                // Рисуем горизонтальные ригели (между рядами)
                for (let row = 1; row < rows; row++) {
                  const y = cumulativeY[row] - rigelWidth / 2;

                  // Для каждого ригеля проверяем, нужно ли его рисовать сегментами
                  for (let col = 0; col < cols; col++) {
                    const segmentAbove = (row - 1) * cols + col + 1;
                    const segmentBelow = row * cols + col + 1;

                    // Если сегменты объединены, не рисуем ригель между ними
                    if (areInSameMergedSegment(segmentAbove, segmentBelow)) {
                      continue;
                    }

                    const x = cumulativeX[col];
                    const width = columnWidths[col];

                    rigels.push(
                      <rect
                        key={`h-rigel-${row}-${col}`}
                        x={x}
                        y={y}
                        width={width}
                        height={rigelWidth}
                        fill="#2c3e50"
                        opacity="0.8"
                      />
                    );
                  }
                }

                // Рисуем вертикальные ригели (между колонками)
                for (let col = 1; col < cols; col++) {
                  const x = cumulativeX[col] - rigelWidth / 2;

                  // Для каждого ригеля проверяем, нужно ли его рисовать сегментами
                  for (let row = 0; row < rows; row++) {
                    const segmentLeft = row * cols + (col - 1) + 1;
                    const segmentRight = row * cols + col + 1;

                    // Если сегменты объединены, не рисуем ригель между ними
                    if (areInSameMergedSegment(segmentLeft, segmentRight)) {
                      continue;
                    }

                    const y = cumulativeY[row];
                    const height = rowHeights[row];

                    rigels.push(
                      <rect
                        key={`v-rigel-${row}-${col}`}
                        x={x}
                        y={y}
                        width={rigelWidth}
                        height={height}
                        fill="#2c3e50"
                        opacity="0.8"
                      />
                    );
                  }
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
                        ref={typeRef}
                        id="segment-type"
                        value={segmentProperties[selectedSegment]?.type || 'Пустой'}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'type', e.target.value)}
                        onKeyDown={handleTypeKeyDown}
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
                        ref={labelRef}
                        id="segment-label"
                        type="text"
                        value={segmentProperties[selectedSegment]?.label || ''}
                        onChange={(e) => handlePropertyChange(selectedSegment, 'label', e.target.value)}
                        onKeyDown={handleLabelKeyDown}
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
      <div className="visualizer-header">
        <h2>Визуализатор Витража</h2>
        <div className="header-selectors">
          <div className="selector-group">
            <label htmlFor="object-select">Объект:</label>
            <div className="select-with-buttons">
              <select
                id="object-select"
                value={selectedObject}
                onChange={(e) => {
                  setSelectedObject(e.target.value);
                  setSelectedVersion('');
                }}
                className="header-select"
              >
                <option value="">Выберите объект</option>
                {objects.map(obj => (
                  <option key={obj.id} value={obj.id}>{obj.name}</option>
                ))}
              </select>
              <button
                className="action-icon-btn"
                onClick={() => setShowObjectModal(true)}
                title="Добавить объект"
              >
                +
              </button>
              {selectedObject && (
                <button
                  className="action-icon-btn edit-btn"
                  onClick={() => openEditModal(selectedObject)}
                  title="Редактировать объект"
                >
                  ✎
                </button>
              )}
            </div>
          </div>
          <div className="selector-group">
            <label htmlFor="version-select">Версия:</label>
            <div className="select-with-buttons">
              <select
                id="version-select"
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="header-select"
                disabled={!selectedObject}
              >
                <option value="">Выберите версию</option>
                {selectedObject && objects.find(obj => obj.id === selectedObject)?.versions.map(ver => (
                  <option key={ver.id} value={ver.id}>{ver.name}</option>
                ))}
              </select>
              <button
                className="action-icon-btn"
                onClick={() => setShowVersionModal(true)}
                disabled={!selectedObject}
                title="Добавить версию"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно добавления объекта */}
      {showObjectModal && (
        <div className="modal-overlay" onClick={() => setShowObjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить объект</h3>
            <input
              type="text"
              value={newObjectName}
              onChange={(e) => setNewObjectName(e.target.value)}
              placeholder="Название объекта"
              className="modal-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn cancel-btn" onClick={() => {
                setShowObjectModal(false);
                setNewObjectName('');
              }}>
                Отмена
              </button>
              <button className="modal-btn confirm-btn" onClick={handleAddObject}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования объекта */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Редактировать объект</h3>
            <input
              type="text"
              value={newObjectName}
              onChange={(e) => setNewObjectName(e.target.value)}
              placeholder="Название объекта"
              className="modal-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn cancel-btn" onClick={() => {
                setShowEditModal(false);
                setNewObjectName('');
                setEditingObjectId(null);
              }}>
                Отмена
              </button>
              <button className="modal-btn confirm-btn" onClick={handleEditObject}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления версии */}
      {showVersionModal && (
        <div className="modal-overlay" onClick={() => setShowVersionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Добавить версию</h3>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="Название версии"
              className="modal-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn cancel-btn" onClick={() => {
                setShowVersionModal(false);
                setNewVersionName('');
              }}>
                Отмена
              </button>
              <button className="modal-btn confirm-btn" onClick={handleAddVersion}>
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="config-panel">
        <h3>Конфигурация витража</h3>

        <div className="config-form">
          <div className="form-group">
            <label htmlFor="vitrage-name">Маркировка витража:</label>
            <input
              ref={vitrageNameRef}
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
            <label htmlFor="site-manager">Начальник участка:</label>
            <input
              ref={siteManagerRef}
              id="site-manager"
              type="text"
              value={siteManager}
              onChange={(e) => setSiteManager(e.target.value)}
              onKeyDown={handleSiteManagerKeyDown}
              placeholder="Введите ФИО начальника участка"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="creation-date">Дата создания:</label>
            <input
              ref={creationDateRef}
              id="creation-date"
              type="date"
              value={creationDate}
              onChange={(e) => setCreationDate(e.target.value)}
              onKeyDown={handleCreationDateKeyDown}
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
          <p><strong>Начальник участка:</strong> {siteManager || '—'}</p>
          <p><strong>Дата создания:</strong> {creationDate ? new Date(creationDate).toLocaleDateString('ru-RU') : '—'}</p>
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
