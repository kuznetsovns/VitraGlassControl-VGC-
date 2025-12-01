import { useState, useEffect, useRef } from 'react';
import './DefectTracking.css';

interface ProjectObject {
  id: string;
  name: string;
  versions: ObjectVersion[];
  createdAt: Date;
}

interface ObjectVersion {
  id: string;
  name: string;
  createdAt: Date;
}

interface VitrageItem {
  id: string;
  name: string;
  siteManager?: string;
  creationDate?: string;
  objectId: string;
  objectName?: string;
  versionId?: string;
  rows: number;
  cols: number;
  totalWidth: number;
  totalHeight: number;
  segments: VitrageSegment[];
  svgDrawing?: string;
  createdAt: Date;
}

interface VitrageSegment {
  id: string;
  type: string;
  width?: number;
  height?: number;
  formula?: string;
  label?: string;
  hidden?: boolean;
  merged?: boolean;
  rowSpan?: number;
  colSpan?: number;
  mergedInto?: number;
}

interface SegmentDefectData {
  segmentId: string;
  inspectionDate: string;
  inspector: string;
  siteManager: string;
  defects: string[];
}


export default function DefectTracking() {
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [vitrages, setVitrages] = useState<VitrageItem[]>([]);
  const [filteredVitrages, setFilteredVitrages] = useState<VitrageItem[]>([]);
  const [selectedVitrageForView, setSelectedVitrageForView] = useState<VitrageItem | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [showDefectPanel, setShowDefectPanel] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Состояния для дефектов
  const [availableDefects, setAvailableDefects] = useState<string[]>([
    'Царапины',
    'Сколы',
    'Трещины',
    'Загрязнения',
    'Деформация',
    'Разгерметизация',
    'Запотевание',
    'Некачественный монтаж'
  ]);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [showDefectDropdown, setShowDefectDropdown] = useState(false);
  const [newDefectName, setNewDefectName] = useState('');
  const [showAddDefectForm, setShowAddDefectForm] = useState(false);

  // Состояния для информации об осмотре
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspector, setInspector] = useState('');
  const [siteManager, setSiteManager] = useState('');

  // Хранилище данных дефектов по сегментам (ключ: vitrageId-segmentId)
  const [segmentDefectsData, setSegmentDefectsData] = useState<Map<string, SegmentDefectData>>(new Map());

  // Загрузка объектов и витражей
  useEffect(() => {
    const loadedObjects = localStorage.getItem('project-objects');
    if (loadedObjects) {
      setObjects(JSON.parse(loadedObjects));
    }

    const savedVitrages = localStorage.getItem('saved-vitrages');
    if (savedVitrages) {
      try {
        const parsed = JSON.parse(savedVitrages);
        setVitrages(parsed.map((v: VitrageItem) => ({
          ...v,
          createdAt: new Date(v.createdAt)
        })));
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error);
      }
    }

    // Загрузка сохраненных данных о дефектах сегментов
    const savedDefectsData = localStorage.getItem('segment-defects-data');
    if (savedDefectsData) {
      try {
        const parsed = JSON.parse(savedDefectsData);
        const newMap = new Map<string, SegmentDefectData>();
        Object.entries(parsed).forEach(([key, value]) => {
          newMap.set(key, value as SegmentDefectData);
        });
        setSegmentDefectsData(newMap);
      } catch (error) {
        console.error('Ошибка при загрузке данных дефектов:', error);
      }
    }
  }, []);

  // Фильтрация витражей по объекту и версии
  useEffect(() => {
    let filtered = vitrages;

    if (selectedObject) {
      filtered = filtered.filter(v => v.objectId === selectedObject);
    }

    if (selectedVersion) {
      filtered = filtered.filter(v => v.versionId === selectedVersion);
    }

    setFilteredVitrages(filtered);
  }, [selectedObject, selectedVersion, vitrages]);

  // Обработка кликов по сегментам SVG
  useEffect(() => {
    if (!svgContainerRef.current || !selectedVitrageForView) return;

    const handleSvgClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('vitrage-segment')) {
        const segmentId = target.getAttribute('data-segment-id');
        if (segmentId) {
          handleSegmentClick(segmentId);
        }
      }
    };

    const container = svgContainerRef.current;
    container.addEventListener('click', handleSvgClick);

    return () => {
      container.removeEventListener('click', handleSvgClick);
    };
  }, [selectedVitrageForView]);

  // Загрузка данных сегмента при его выборе
  useEffect(() => {
    if (selectedSegmentId && selectedVitrageForView) {
      const key = `${selectedVitrageForView.id}-${selectedSegmentId}`;
      const savedData = segmentDefectsData.get(key);

      if (savedData) {
        setInspectionDate(savedData.inspectionDate);
        setInspector(savedData.inspector);
        setSiteManager(savedData.siteManager);
        setSelectedDefects(savedData.defects);
      } else {
        // Сброс к значениям по умолчанию
        setInspectionDate(new Date().toISOString().split('T')[0]);
        setInspector('');
        setSiteManager('');
        setSelectedDefects([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegmentId, selectedVitrageForView?.id]);

  // Автоматическая подгонка масштаба витража под размер рабочего пространства
  useEffect(() => {
    if (!svgContainerRef.current || !selectedVitrageForView) return;

    // Небольшая задержка, чтобы SVG успел отрендериться
    const timer = setTimeout(() => {
      if (!svgContainerRef.current) return;

      const svgElement = svgContainerRef.current.querySelector('svg');
      if (!svgElement) return;

      // Получаем размеры SVG
      const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
      const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');

      if (!svgWidth || !svgHeight) return;

      // Получаем размеры рабочего пространства
      const workspace = svgContainerRef.current.parentElement;
      if (!workspace) return;

      const workspaceWidth = workspace.clientWidth;
      const workspaceHeight = workspace.clientHeight;

      // Вычисляем масштаб с отступами (90% от доступного пространства)
      const scaleX = (workspaceWidth * 0.9) / svgWidth;
      const scaleY = (workspaceHeight * 0.9) / svgHeight;
      const autoScale = Math.min(scaleX, scaleY, 1); // Не увеличиваем, только уменьшаем

      setZoom(autoScale);
      setPan({ x: 0, y: 0 });
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedVitrageForView?.id]);

  // Визуальное выделение выбранного сегмента и отображение дефектов
  useEffect(() => {
    if (!svgContainerRef.current || !selectedVitrageForView) return;

    // Убираем выделение со всех сегментов
    const allSegments = svgContainerRef.current.querySelectorAll('.vitrage-segment');
    allSegments.forEach(segment => {
      (segment as SVGRectElement).setAttribute('stroke', '#87ceeb');
      (segment as SVGRectElement).setAttribute('stroke-width', '2');
    });

    // Выделяем выбранный сегмент
    if (selectedSegmentId) {
      const selectedSegment = svgContainerRef.current.querySelector(`[data-segment-id="${selectedSegmentId}"]`);
      if (selectedSegment) {
        (selectedSegment as SVGRectElement).setAttribute('stroke', '#ff6b6b');
        (selectedSegment as SVGRectElement).setAttribute('stroke-width', '4');
      }
    }

    // Отображаем индикаторы дефектов на сегментах
    const svgElement = svgContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    // Удаляем старые индикаторы дефектов
    svgElement.querySelectorAll('.defect-indicator').forEach(el => el.remove());

    // Добавляем индикаторы для сегментов с дефектами
    allSegments.forEach(segment => {
      const segmentId = segment.getAttribute('data-segment-id');
      if (!segmentId) return;

      const key = `${selectedVitrageForView.id}-${segmentId}`;
      const defectData = segmentDefectsData.get(key);

      if (defectData && defectData.defects.length > 0) {
        const rect = segment as SVGRectElement;
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');

        // Создаем группу для индикатора
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('defect-indicator');

        // Фон для текста дефектов
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', (x + 5).toString());
        bgRect.setAttribute('y', (y + 5).toString());
        bgRect.setAttribute('rx', '4');
        bgRect.setAttribute('ry', '4');
        bgRect.setAttribute('fill', 'rgba(255, 68, 68, 0.95)');
        bgRect.setAttribute('stroke', '#ffffff');
        bgRect.setAttribute('stroke-width', '1.5');

        // Создаем текстовые элементы для каждого дефекта
        const lineHeight = 16;
        const padding = 6;
        let maxTextWidth = 0;

        const textElements: SVGTextElement[] = [];
        defectData.defects.forEach((defect, index) => {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', (x + 5 + padding).toString());
          text.setAttribute('y', (y + 5 + padding + (index * lineHeight) + 12).toString());
          text.setAttribute('fill', '#ffffff');
          text.setAttribute('font-size', '11');
          text.setAttribute('font-weight', '600');
          text.setAttribute('pointer-events', 'none');
          text.textContent = `• ${defect}`;

          textElements.push(text);

          // Временно добавляем текст для измерения ширины
          svgElement.appendChild(text);
          const bbox = text.getBBox();
          maxTextWidth = Math.max(maxTextWidth, bbox.width);
          svgElement.removeChild(text);
        });

        // Устанавливаем размеры фона
        const bgWidth = maxTextWidth + padding * 2;
        const bgHeight = defectData.defects.length * lineHeight + padding * 2;
        bgRect.setAttribute('width', bgWidth.toString());
        bgRect.setAttribute('height', bgHeight.toString());

        // Добавляем элементы в группу
        group.appendChild(bgRect);
        textElements.forEach(text => group.appendChild(text));

        svgElement.appendChild(group);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegmentId, selectedVitrageForView?.id, segmentDefectsData.size]);

  const getObjectName = (vitrage: VitrageItem) => {
    // Сначала проверяем objectName (новый формат)
    if (vitrage.objectName) {
      return vitrage.objectName;
    }
    // Затем ищем в списке объектов (старый формат)
    const obj = objects.find(o => o.id === vitrage.objectId);
    return obj?.name || 'Неизвестный объект';
  };

  const getVersionName = (vitrage: VitrageItem) => {
    // Если нет versionId, возвращаем пустую строку
    if (!vitrage.versionId) {
      return '';
    }
    const obj = objects.find(o => o.id === vitrage.objectId);
    if (!obj?.versions) {
      return '';
    }
    const version = obj.versions.find(v => v.id === vitrage.versionId);
    return version?.name || '';
  };

  const calculateTotalArea = (vitrage: VitrageItem): number => {
    return vitrage.segments.reduce((total, segment) => {
      if (segment.width && segment.height) {
        return total + (segment.width * segment.height) / 1000000; // в м²
      }
      return total;
    }, 0);
  };

  const handleVitrageClick = (vitrage: VitrageItem) => {
    setSelectedVitrageForView(vitrage);
    setSelectedSegmentId(null);
    setShowDefectPanel(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleBackToList = () => {
    setSelectedVitrageForView(null);
    setSelectedSegmentId(null);
    setShowDefectPanel(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSegmentClick = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    setShowDefectPanel(true);
  };

  const handleCloseDefectPanel = () => {
    setSelectedSegmentId(null);
    setShowDefectPanel(false);
    setSelectedDefects([]);
    setShowDefectDropdown(false);
    setShowAddDefectForm(false);
  };

  const handleToggleDefect = (defect: string) => {
    setSelectedDefects(prev =>
      prev.includes(defect)
        ? prev.filter(d => d !== defect)
        : [...prev, defect]
    );
  };

  const handleAddNewDefect = () => {
    if (newDefectName.trim() && !availableDefects.includes(newDefectName.trim())) {
      setAvailableDefects(prev => [...prev, newDefectName.trim()]);
      setSelectedDefects(prev => [...prev, newDefectName.trim()]);
      setNewDefectName('');
      setShowAddDefectForm(false);
    }
  };

  const handleSaveSegmentDefects = () => {
    if (!selectedSegmentId || !selectedVitrageForView) return;

    const key = `${selectedVitrageForView.id}-${selectedSegmentId}`;
    const newData: SegmentDefectData = {
      segmentId: selectedSegmentId,
      inspectionDate,
      inspector,
      siteManager,
      defects: selectedDefects
    };

    setSegmentDefectsData(prev => {
      const newMap = new Map(prev);
      newMap.set(key, newData);
      return newMap;
    });

    // Сохраняем в localStorage
    const dataToSave: { [key: string]: SegmentDefectData } = {};
    segmentDefectsData.forEach((value, key) => {
      dataToSave[key] = value;
    });
    dataToSave[key] = newData;
    localStorage.setItem('segment-defects-data', JSON.stringify(dataToSave));

    alert('Данные сегмента сохранены!');
  };

  const handleKeyPressInspection = (e: React.KeyboardEvent<HTMLInputElement>, nextInputId?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextInputId) {
        const nextInput = document.getElementById(nextInputId) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
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

  // Если выбран витраж для просмотра - показываем полноэкранную отрисовку
  if (selectedVitrageForView) {
    return (
      <>
      <div className="defect-tracking-fullscreen">
        <div className="workspace-header">
          <div className="header-left">
            <h2 className="vitrage-title">{selectedVitrageForView.name}</h2>
            {selectedVitrageForView.siteManager && (
              <p className="vitrage-subtitle">Начальник участка: {selectedVitrageForView.siteManager}</p>
            )}
            {selectedVitrageForView.creationDate && (
              <p className="vitrage-subtitle">Дата создания: {selectedVitrageForView.creationDate}</p>
            )}
          </div>

          <div className="header-controls">
            <button className="action-btn back-btn" onClick={handleBackToList} title="Вернуться к списку">
              <span className="btn-icon">←</span>
              <span className="btn-text">Назад к списку</span>
            </button>

            <div className="zoom-controls">
              <button className="zoom-btn" onClick={handleZoomOut} title="Уменьшить (Ctrl + колесо мыши)">−</button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button className="zoom-btn" onClick={handleZoomIn} title="Увеличить (Ctrl + колесо мыши)">+</button>
              <button className="zoom-btn" onClick={handleResetZoom} title="Сбросить масштаб">⟲</button>
            </div>
          </div>
        </div>

        <div className="workspace-layout">
          <div
            className="grid-visualization-workspace"
            onWheel={handleWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            style={{
              cursor: isPanning ? 'grabbing' : 'grab',
              overflow: 'hidden',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#f8f9fa'
            }}
          >
            {selectedVitrageForView.svgDrawing ? (
              // Используем сохраненный SVG из Визуализатора
              <div
                ref={svgContainerRef}
                dangerouslySetInnerHTML={{ __html: selectedVitrageForView.svgDrawing }}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
              />
            ) : (
              // Если SVG не сохранен, показываем сообщение
              <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                <p style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Отрисовка недоступна</p>
                <p style={{ fontSize: '14px' }}>Витраж был создан в старой версии и не содержит данных отрисовки.</p>
                <p style={{ fontSize: '14px' }}>Пересоздайте витраж в Визуализаторе для просмотра отрисовки.</p>
              </div>
            )}
          </div>
        </div>

        {/* Панель дефектов */}
        {showDefectPanel && selectedSegmentId && (
            <div className="defect-panel">
              <div className="defect-panel-header">
                <h3>Дефекты сегмента #{selectedSegmentId}</h3>
                <button className="close-panel-btn" onClick={handleCloseDefectPanel}>×</button>
              </div>

              <div className="defect-panel-content">
                <div className="segment-info">
                  <h4>Информация о сегменте</h4>
                  <div className="info-row">
                    <span className="info-label">ID:</span>
                    <span className="info-value">{selectedSegmentId}</span>
                  </div>
                  {(() => {
                    const segment = selectedVitrageForView?.segments.find((s, index) => (index + 1).toString() === selectedSegmentId);
                    if (!segment) return null;
                    return (
                      <>
                        <div className="info-row">
                          <span className="info-label">Тип:</span>
                          <span className="info-value">{segment.type || 'Не указан'}</span>
                        </div>
                        {segment.width && (
                          <div className="info-row">
                            <span className="info-label">Ширина:</span>
                            <span className="info-value">{segment.width} мм</span>
                          </div>
                        )}
                        {segment.height && (
                          <div className="info-row">
                            <span className="info-label">Высота:</span>
                            <span className="info-value">{segment.height} мм</span>
                          </div>
                        )}
                        {segment.formula && (
                          <div className="info-row">
                            <span className="info-label">Формула:</span>
                            <span className="info-value">{segment.formula}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="inspection-info">
                  <h4>Информация об осмотре</h4>
                  <div className="info-row">
                    <span className="info-label">Дата осмотра:</span>
                    <input
                      id="inspection-date"
                      type="date"
                      className="info-input"
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      onKeyPress={(e) => handleKeyPressInspection(e, 'inspection-inspector')}
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Проверяющий:</span>
                    <input
                      id="inspection-inspector"
                      type="text"
                      className="info-input"
                      placeholder="Введите ФИО"
                      value={inspector}
                      onChange={(e) => setInspector(e.target.value)}
                      onKeyPress={(e) => handleKeyPressInspection(e, 'inspection-manager')}
                    />
                  </div>
                  <div className="info-row">
                    <span className="info-label">Начальник участка:</span>
                    <input
                      id="inspection-manager"
                      type="text"
                      className="info-input"
                      placeholder="Введите ФИО"
                      value={siteManager}
                      onChange={(e) => setSiteManager(e.target.value)}
                      onKeyPress={(e) => handleKeyPressInspection(e)}
                    />
                  </div>
                </div>

                <div className="defects-list">
                  <h4>Список дефектов</h4>

                  {selectedDefects.length > 0 && (
                    <div className="selected-defects">
                      {selectedDefects.map(defect => (
                        <div key={defect} className="defect-tag">
                          <span>{defect}</span>
                          <button
                            className="remove-defect-btn"
                            onClick={() => handleToggleDefect(defect)}
                            title="Удалить"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="defect-dropdown-container">
                    <button
                      className="add-defect-btn"
                      onClick={() => setShowDefectDropdown(!showDefectDropdown)}
                    >
                      {selectedDefects.length === 0 ? '+ Добавить дефект' : '+ Добавить еще'}
                    </button>

                    {showDefectDropdown && (
                      <div className="defect-dropdown">
                        <div className="defect-dropdown-header">
                          <span>Выберите дефекты:</span>
                          <button
                            className="close-dropdown-btn"
                            onClick={() => setShowDefectDropdown(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="defect-options">
                          {availableDefects.map(defect => (
                            <label key={defect} className="defect-option">
                              <input
                                type="checkbox"
                                checked={selectedDefects.includes(defect)}
                                onChange={() => handleToggleDefect(defect)}
                              />
                              <span>{defect}</span>
                            </label>
                          ))}
                        </div>
                        <div className="defect-dropdown-footer">
                          {!showAddDefectForm ? (
                            <button
                              className="new-defect-btn"
                              onClick={() => setShowAddDefectForm(true)}
                            >
                              + Создать новый тип дефекта
                            </button>
                          ) : (
                            <div className="new-defect-form">
                              <input
                                type="text"
                                className="new-defect-input"
                                placeholder="Название дефекта"
                                value={newDefectName}
                                onChange={(e) => setNewDefectName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddNewDefect();
                                  }
                                }}
                                autoFocus
                              />
                              <div className="new-defect-actions">
                                <button
                                  className="save-defect-btn"
                                  onClick={handleAddNewDefect}
                                >
                                  Добавить
                                </button>
                                <button
                                  className="cancel-defect-btn"
                                  onClick={() => {
                                    setShowAddDefectForm(false);
                                    setNewDefectName('');
                                  }}
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопка сохранения */}
                <div className="panel-actions">
                  <button className="save-segment-btn" onClick={handleSaveSegmentDefects}>
                    💾 Сохранить данные сегмента
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
      </>
    );
  }

  // Показываем список витражей
  return (
    <div className="defect-tracking">
      <div className="main-content-wrapper">
        <div className="defect-header">
          <h2>Дефектовка</h2>
          <div className="header-filters">
            <div className="filter-group">
              <label htmlFor="object-filter">Объект:</label>
              <select
                id="object-filter"
                value={selectedObject}
                onChange={(e) => {
                  setSelectedObject(e.target.value);
                  setSelectedVersion('');
                }}
                className="filter-select"
              >
                <option value="">Все объекты</option>
                {objects.map(obj => (
                  <option key={obj.id} value={obj.id}>{obj.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="version-filter">Версия:</label>
              <select
                id="version-filter"
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="filter-select"
                disabled={!selectedObject}
              >
                <option value="">Все версии</option>
                {selectedObject && objects.find(obj => obj.id === selectedObject)?.versions.map(ver => (
                  <option key={ver.id} value={ver.id}>{ver.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="defect-content">
        {filteredVitrages.length === 0 ? (
          <div className="empty-state">
            <p>📋 Нет витражей для отображения</p>
            <p className="empty-hint">Создайте витражи в визуализаторе</p>
          </div>
        ) : (
          <div className="vitrages-grid">
            {filteredVitrages.map(vitrage => (
              <div
                key={vitrage.id}
                className="vitrage-card"
                onClick={() => handleVitrageClick(vitrage)}
              >
                <div className="vitrage-card-header">
                  <h3>{vitrage.name}</h3>
                  <span className="vitrage-badge">
                    {vitrage.rows} × {vitrage.cols}
                  </span>
                </div>
                <div className="vitrage-card-info">
                  <div className="info-row">
                    <span className="info-label">Объект:</span>
                    <span className="info-value">{getObjectName(vitrage)}</span>
                  </div>
                  {getVersionName(vitrage) && (
                    <div className="info-row">
                      <span className="info-label">Версия:</span>
                      <span className="info-value">{getVersionName(vitrage)}</span>
                    </div>
                  )}
                  {vitrage.siteManager && (
                    <div className="info-row">
                      <span className="info-label">Начальник участка:</span>
                      <span className="info-value">{vitrage.siteManager}</span>
                    </div>
                  )}
                  {vitrage.creationDate && (
                    <div className="info-row">
                      <span className="info-label">Дата создания:</span>
                      <span className="info-value">{vitrage.creationDate}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">Сегментов:</span>
                    <span className="info-value">{vitrage.segments.length}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Площадь:</span>
                    <span className="info-value">{calculateTotalArea(vitrage).toFixed(2)} м²</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
