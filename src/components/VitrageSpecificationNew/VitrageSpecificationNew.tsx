import { useState, useEffect } from 'react';
import './VitrageSpecificationNew.css';

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

export default function VitrageSpecificationNew() {
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [selectedObject, setSelectedObject] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [vitrages, setVitrages] = useState<VitrageItem[]>([]);
  const [filteredVitrages, setFilteredVitrages] = useState<VitrageItem[]>([]);
  const [selectedVitrageForDetails, setSelectedVitrageForDetails] = useState<VitrageItem | null>(null);
  const [editingCell, setEditingCell] = useState<{ segmentIndex: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'Стеклопакет': return 'СП';
      case 'Стемалит': return 'СТ';
      case 'Вент решётка': return 'ВР';
      case 'Створка': return 'СТВ';
      case 'Дверной блок': return 'ДБ';
      case 'Сэндвич-панель': return 'СП';
      default: return 'ПУ';
    }
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

  const calculateSegmentArea = (segment: VitrageSegment): number => {
    if (segment.width && segment.height) {
      return (segment.width * segment.height) / 1000000; // в м²
    }
    return 0;
  };

  const handleCellClick = (segmentIndex: number, field: string, currentValue: string | number | undefined) => {
    setEditingCell({ segmentIndex, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, immediatelySave = false) => {
    const newValue = e.target.value;
    setEditValue(newValue);

    if (immediatelySave) {
      // Для select сохраняем сразу после изменения
      setTimeout(() => handleCellBlur(), 0);
    }
  };

  const handleCellBlur = () => {
    if (editingCell && selectedVitrageForDetails) {
      const updatedSegments = [...selectedVitrageForDetails.segments];
      const segment = updatedSegments[editingCell.segmentIndex];

      // Обновляем значение в зависимости от поля
      switch (editingCell.field) {
        case 'label':
          segment.label = editValue;
          break;
        case 'type':
          segment.type = editValue;
          break;
        case 'height':
          segment.height = editValue ? parseFloat(editValue) : undefined;
          break;
        case 'width':
          segment.width = editValue ? parseFloat(editValue) : undefined;
          break;
        case 'formula':
          segment.formula = editValue;
          break;
      }

      // Обновляем витраж в списке
      const updatedVitrage = {
        ...selectedVitrageForDetails,
        segments: updatedSegments
      };

      // Сохраняем в localStorage
      const updatedVitrages = vitrages.map(v =>
        v.id === selectedVitrageForDetails.id ? updatedVitrage : v
      );

      setVitrages(updatedVitrages);
      setSelectedVitrageForDetails(updatedVitrage);
      localStorage.setItem('saved-vitrages', JSON.stringify(updatedVitrages));
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleDeleteVitrage = () => {
    if (!selectedVitrageForDetails) return;

    const confirmDelete = window.confirm(
      `Вы уверены, что хотите удалить витраж "${selectedVitrageForDetails.name}"?`
    );

    if (confirmDelete) {
      const updatedVitrages = vitrages.filter(v => v.id !== selectedVitrageForDetails.id);
      setVitrages(updatedVitrages);
      localStorage.setItem('saved-vitrages', JSON.stringify(updatedVitrages));
      setSelectedVitrageForDetails(null);
    }
  };

  const handleExportData = () => {
    if (filteredVitrages.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Создаем CSV данные
    let csvContent = '\uFEFF'; // BOM для правильного отображения кириллицы в Excel

    // Заголовок
    csvContent += 'Витраж;Объект;Версия;Начальник участка;Дата создания;Сетка;Сегментов;Площадь (м²);Обозначение;Тип заполнения;Длина (мм);Ширина (мм);Площадь сегмента (м²);Формула стекла\n';

    // Данные
    filteredVitrages.forEach(vitrage => {
      const objectName = getObjectName(vitrage.objectId);
      const versionName = getVersionName(vitrage.objectId, vitrage.versionId);
      const siteManager = vitrage.siteManager || '—';
      const creationDate = vitrage.creationDate || '—';
      const grid = `${vitrage.rows} × ${vitrage.cols}`;
      const totalArea = calculateTotalArea(vitrage).toFixed(2);

      vitrage.segments.forEach((segment, idx) => {
        const label = segment.label || `${getTypeLabel(segment.type)}-${idx + 1}`;
        const type = segment.type || '—';
        const height = segment.height || '—';
        const width = segment.width || '—';
        const area = calculateSegmentArea(segment) > 0 ? calculateSegmentArea(segment).toFixed(4) : '—';
        const formula = segment.formula || '—';

        csvContent += `${vitrage.name};${objectName};${versionName};${siteManager};${creationDate};${grid};${vitrage.segments.length};${totalArea};${label};${type};${height};${width};${area};${formula}\n`;
      });
    });

    // Создаем Blob и скачиваем файл
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `specification_vitrages_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`vitrage-specification-new ${selectedVitrageForDetails ? 'with-panel' : ''}`}>
      <div className="main-content-wrapper">
        <div className="specification-header">
          <h2>Спецификация Витражей</h2>
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
            <button
              className="export-data-btn"
              onClick={handleExportData}
              disabled={filteredVitrages.length === 0}
              title="Экспортировать данные в CSV"
            >
              📊 Экспорт данных
            </button>
          </div>
        </div>

        <div className="specification-content">
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0 }}>Таблица сегментов</h4>
              <button
                className="delete-vitrage-btn"
                onClick={handleDeleteVitrage}
                title="Удалить витраж"
              >
                🗑️ Удалить витраж
              </button>
            </div>
            <div className="segments-table-wrapper">
              <table className="segments-table">
                <thead>
                  <tr>
                    <th>Обозначение</th>
                    <th>Тип заполнения</th>
                    <th>Длина (мм)</th>
                    <th>Ширина (мм)</th>
                    <th>Площадь (м²)</th>
                    <th>Формула стекла</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVitrageForDetails.segments.map((segment, idx) => (
                    <tr key={idx}>
                      <td
                        className="segment-label-cell editable-cell"
                        onClick={() => handleCellClick(idx, 'label', segment.label)}
                      >
                        {editingCell?.segmentIndex === idx && editingCell?.field === 'label' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="cell-input"
                          />
                        ) : (
                          segment.label || `${getTypeLabel(segment.type)}-${idx + 1}`
                        )}
                      </td>
                      <td
                        className="editable-cell"
                        onClick={() => handleCellClick(idx, 'type', segment.type)}
                      >
                        {editingCell?.segmentIndex === idx && editingCell?.field === 'type' ? (
                          <select
                            value={editValue}
                            onChange={(e) => handleCellChange(e, true)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="cell-select"
                          >
                            <option value="Пустой">Пустой</option>
                            <option value="Стеклопакет">Стеклопакет</option>
                            <option value="Стемалит">Стемалит</option>
                            <option value="Вент решётка">Вент решётка</option>
                            <option value="Створка">Створка</option>
                            <option value="Дверной блок">Дверной блок</option>
                            <option value="Сэндвич-панель">Сэндвич-панель</option>
                          </select>
                        ) : (
                          segment.type || '—'
                        )}
                      </td>
                      <td
                        className="number-cell editable-cell"
                        onClick={() => handleCellClick(idx, 'height', segment.height)}
                      >
                        {editingCell?.segmentIndex === idx && editingCell?.field === 'height' ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="cell-input"
                          />
                        ) : (
                          segment.height || '—'
                        )}
                      </td>
                      <td
                        className="number-cell editable-cell"
                        onClick={() => handleCellClick(idx, 'width', segment.width)}
                      >
                        {editingCell?.segmentIndex === idx && editingCell?.field === 'width' ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="cell-input"
                          />
                        ) : (
                          segment.width || '—'
                        )}
                      </td>
                      <td className="number-cell">
                        {calculateSegmentArea(segment) > 0
                          ? calculateSegmentArea(segment).toFixed(4)
                          : '—'}
                      </td>
                      <td
                        className="formula-cell editable-cell"
                        onClick={() => handleCellClick(idx, 'formula', segment.formula)}
                      >
                        {editingCell?.segmentIndex === idx && editingCell?.field === 'formula' ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={handleCellChange}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="cell-input"
                          />
                        ) : (
                          segment.formula || '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
