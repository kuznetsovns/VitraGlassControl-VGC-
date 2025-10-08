import { useState, useEffect } from 'react';
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
}

export default function DefectTracking() {
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [vitrages, setVitrages] = useState<VitrageItem[]>([]);
  const [filteredVitrages, setFilteredVitrages] = useState<VitrageItem[]>([]);
  const [selectedVitrageForDetails, setSelectedVitrageForDetails] = useState<VitrageItem | null>(null);

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
    setSelectedVitrageForDetails(vitrage);
  };

  const closeDetailsPanel = () => {
    setSelectedVitrageForDetails(null);
  };

  return (
    <div className={`defect-tracking ${selectedVitrageForDetails ? 'with-panel' : ''}`}>
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
                className={`vitrage-card ${selectedVitrageForDetails?.id === vitrage.id ? 'selected' : ''}`}
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

      {/* Боковая панель с деталями */}
      {selectedVitrageForDetails && (
        <div className="details-panel">
          <div className="details-header">
            <div>
              <h3>{selectedVitrageForDetails.name}</h3>
              <p className="details-subtitle">
                {getObjectName(selectedVitrageForDetails.objectId)} - {getVersionName(selectedVitrageForDetails.objectId, selectedVitrageForDetails.versionId)}
              </p>
            </div>
            <button className="close-panel-btn" onClick={closeDetailsPanel}>
              ✕
            </button>
          </div>

          <div className="details-content">
            <div className="details-summary">
              <div className="summary-item">
                <span className="summary-label">Сетка:</span>
                <span className="summary-value">{selectedVitrageForDetails.rows} × {selectedVitrageForDetails.cols}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Всего сегментов:</span>
                <span className="summary-value">{selectedVitrageForDetails.segments.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Общая площадь:</span>
                <span className="summary-value">{calculateTotalArea(selectedVitrageForDetails).toFixed(2)} м²</span>
              </div>
              {selectedVitrageForDetails.siteManager && (
                <div className="summary-item">
                  <span className="summary-label">Начальник участка:</span>
                  <span className="summary-value">{selectedVitrageForDetails.siteManager}</span>
                </div>
              )}
              {selectedVitrageForDetails.creationDate && (
                <div className="summary-item">
                  <span className="summary-label">Дата создания:</span>
                  <span className="summary-value">{selectedVitrageForDetails.creationDate}</span>
                </div>
              )}
            </div>

            {/* Отрисовка витража */}
            {selectedVitrageForDetails.svgDrawing && (
              <div className="vitrage-drawing">
                <h4>Отрисовка витража</h4>
                <div
                  className="drawing-container"
                  dangerouslySetInnerHTML={{ __html: selectedVitrageForDetails.svgDrawing }}
                />
              </div>
            )}

            <div className="defect-info-section">
              <h4>Информация о дефектовке</h4>
              <p className="defect-hint">
                Здесь будет функционал для отслеживания дефектов витражей
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
