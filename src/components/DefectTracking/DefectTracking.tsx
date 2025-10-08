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
  versionId: string;
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

  // Визуальное выделение выбранного сегмента
  useEffect(() => {
    if (!svgContainerRef.current) return;

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
  }, [selectedSegmentId]);

  const getObjectName = (objectId: string) => {
    const obj = objects.find(o => o.id === objectId);
    return obj?.name || 'Неизвестный объект';
  };

  const getVersionName = (objectId: string, versionId: string) => {
    const obj = objects.find(o => o.id === objectId);
    const version = obj?.versions.find(v => v.id === versionId);
    return version?.name || 'Неизвестная версия';
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

                <div className="defects-list">
                  <h4>Список дефектов</h4>
                  <div className="empty-defects">
                    <p>📋 Дефектов не обнаружено</p>
                    <button className="add-defect-btn">+ Добавить дефект</button>
                  </div>
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
                    <span className="info-value">{getObjectName(vitrage.objectId)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Версия:</span>
                    <span className="info-value">{getVersionName(vitrage.objectId, vitrage.versionId)}</span>
                  </div>
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
