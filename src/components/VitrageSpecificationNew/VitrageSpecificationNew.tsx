import { useState, useEffect } from 'react';
import './VitrageSpecificationNew.css';
import { vitrageStorage, segmentStorage, type Vitrage, type VitrageSegment } from '../../services/vitrageStorage';

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

interface VitrageItem extends Vitrage {
  versionId?: string;
}

interface VitrageSpecificationNewProps {
  selectedObject?: { id: string; name: string } | null;
}

export default function VitrageSpecificationNew({ selectedObject }: VitrageSpecificationNewProps) {
  const [objects, setObjects] = useState<ProjectObject[]>([]);
  const [vitrages, setVitrages] = useState<VitrageItem[]>([]);
  const [filteredVitrages, setFilteredVitrages] = useState<VitrageItem[]>([]);
  const [selectedVitrageForDetails, setSelectedVitrageForDetails] = useState<VitrageItem | null>(null);
  const [editingCell, setEditingCell] = useState<{ segmentIndex: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [storageSource, setStorageSource] = useState<'supabase' | 'localStorage'>('localStorage');

  // Фильтры
  const [filterVitrageType, setFilterVitrageType] = useState<string>('all');
  const [filterSegmentsCount, setFilterSegmentsCount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Загрузка объектов и витражей
  useEffect(() => {
    const loadedObjects = localStorage.getItem('project-objects');
    if (loadedObjects) {
      setObjects(JSON.parse(loadedObjects));
    }

    // Загружаем витражи через сервис (Supabase или localStorage)
    const loadVitrages = async () => {
      try {
        const { data, source } = await vitrageStorage.getAll();
        setVitrages(data as VitrageItem[]);
        setStorageSource(source);
        console.log(`📋 Витражи загружены из ${source}:`, data.length);
      } catch (error) {
        console.error('Ошибка при загрузке витражей:', error);
      }
    };

    loadVitrages();
  }, []);

  // Фильтрация витражей по выбранному объекту и фильтрам
  useEffect(() => {
    let filtered = vitrages;

    if (selectedObject) {
      filtered = filtered.filter(v => v.objectId === selectedObject.id);
    }

    // Фильтр по типу витража (В-1, В-2 и т.д.)
    if (filterVitrageType !== 'all') {
      filtered = filtered.filter(vitrage => vitrage.name === filterVitrageType);
    }

    // Фильтр по количеству сегментов
    if (filterSegmentsCount !== 'all') {
      const targetCount = parseInt(filterSegmentsCount);
      filtered = filtered.filter(vitrage => {
        const count = vitrage.rows * vitrage.cols;
        return count === targetCount;
      });
    }

    // Поиск по названию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vitrage =>
        vitrage.name.toLowerCase().includes(query)
      );
    }

    setFilteredVitrages(filtered);
  }, [selectedObject, vitrages, filterVitrageType, filterSegmentsCount, searchQuery]);

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

  const getUniqueVitrageTypes = (): string[] => {
    const types = new Set<string>();
    vitrages.forEach(vitrage => {
      if (vitrage.name) {
        types.add(vitrage.name);
      }
    });
    return Array.from(types).sort();
  };

  const getUniqueSegmentTypes = (): string[] => {
    const types = new Set<string>();
    vitrages.forEach(vitrage => {
      vitrage.segments?.forEach(segment => {
        if (segment.type) {
          types.add(segment.type);
        }
      });
    });
    return Array.from(types).sort();
  };

  const getUniqueSegmentsCounts = (): number[] => {
    const counts = new Set<number>();
    vitrages.forEach(vitrage => {
      const count = vitrage.rows * vitrage.cols;
      counts.add(count);
    });
    return Array.from(counts).sort((a, b) => a - b);
  };

  const resetFilters = () => {
    setFilterVitrageType('all');
    setFilterSegmentsCount('all');
    setSearchQuery('');
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

  const handleCellBlur = async () => {
    if (editingCell && selectedVitrageForDetails) {
      const updatedSegments = [...selectedVitrageForDetails.segments];
      const segment = updatedSegments[editingCell.segmentIndex];

      // Обновляем значение в зависимости от поля
      const updates: Partial<VitrageSegment> = {};
      switch (editingCell.field) {
        case 'label':
          segment.label = editValue;
          updates.label = editValue;
          break;
        case 'type':
          segment.type = editValue;
          updates.type = editValue;
          break;
        case 'height':
          segment.height = editValue ? parseFloat(editValue) : undefined;
          updates.height = editValue ? parseFloat(editValue) : undefined;
          break;
        case 'width':
          segment.width = editValue ? parseFloat(editValue) : undefined;
          updates.width = editValue ? parseFloat(editValue) : undefined;
          break;
        case 'formula':
          segment.formula = editValue;
          updates.formula = editValue;
          break;
      }

      // Обновляем витраж в списке
      const updatedVitrage = {
        ...selectedVitrageForDetails,
        segments: updatedSegments
      };

      // Сохраняем изменения через сервис (Supabase или localStorage)
      try {
        // Обновляем сегмент в Supabase
        await segmentStorage.updateByIndex(
          selectedVitrageForDetails.id,
          editingCell.segmentIndex,
          updates
        );

        // Также обновляем весь витраж (для обновления segments в JSONB)
        await vitrageStorage.update(selectedVitrageForDetails.id, {
          segments: updatedSegments
        });

        console.log('✅ Сегмент обновлён');
      } catch (error) {
        console.error('Ошибка при обновлении сегмента:', error);
      }

      const updatedVitrages = vitrages.map(v =>
        v.id === selectedVitrageForDetails.id ? updatedVitrage : v
      );

      setVitrages(updatedVitrages);
      setSelectedVitrageForDetails(updatedVitrage);
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

  const handleDeleteVitrage = async () => {
    if (!selectedVitrageForDetails) return;

    const confirmDelete = window.confirm(
      `Вы уверены, что хотите удалить витраж "${selectedVitrageForDetails.name}"?`
    );

    if (confirmDelete) {
      try {
        // Удаляем через сервис (Supabase или localStorage)
        await vitrageStorage.delete(selectedVitrageForDetails.id);

        const updatedVitrages = vitrages.filter(v => v.id !== selectedVitrageForDetails.id);
        setVitrages(updatedVitrages);
        setSelectedVitrageForDetails(null);

        console.log('✅ Витраж удалён');
      } catch (error) {
        console.error('Ошибка при удалении витража:', error);
        alert('Произошла ошибка при удалении витража');
      }
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  const exportVitrages = (vitragesToExport: VitrageItem[], filename: string) => {
    // Создаем CSV данные
    let csvContent = '\uFEFF'; // BOM для правильного отображения кириллицы в Excel

    // Заголовок
    csvContent += 'Витраж;Объект;Версия;Начальник участка;Дата создания;Сетка;Сегментов;Площадь (м²);Обозначение;Тип заполнения;Длина (мм);Ширина (мм);Площадь сегмента (м²);Формула стекла\n';

    // Данные
    vitragesToExport.forEach(vitrage => {
      const objectName = getObjectName(vitrage);
      const versionName = getVersionName(vitrage);
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
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = () => {
    if (filteredVitrages.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    exportVitrages(filteredVitrages, `specification_all_vitrages_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportSelected = () => {
    if (!selectedVitrageForDetails) {
      alert('Выберите витраж для экспорта');
      return;
    }
    exportVitrages([selectedVitrageForDetails], `specification_${selectedVitrageForDetails.name}_${new Date().toISOString().split('T')[0]}.csv`);
    setShowExportMenu(false);
  };

  const handleExportData = () => {
    setShowExportMenu(!showExportMenu);
  };

  return (
    <div className={`vitrage-specification-new ${selectedVitrageForDetails ? 'with-panel' : ''}`}>
      <div className="main-content-wrapper">
        <div className="specification-header">
          <div className="header-left">
            <h2>Типовые витражи</h2>
          </div>
          <div className="header-filters">
            <div className="storage-indicator" title={storageSource === 'supabase' ? 'Данные из облака (Supabase)' : 'Локальные данные (localStorage)'}>
              {storageSource === 'supabase' ? '☁️' : '📦'}
            </div>
            {selectedObject && (
              <div className="object-info-badge">
                <span className="object-info-label">Объект:</span>
                <span className="object-info-name">{selectedObject.name}</span>
              </div>
            )}

            {/* Поиск */}
            <div className="header-filter-item">
              <input
                type="text"
                placeholder="🔍 Поиск витражей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="header-search-input"
              />
            </div>

            {/* Фильтр по типу витража */}
            <div className="header-filter-item">
              <select
                value={filterVitrageType}
                onChange={(e) => setFilterVitrageType(e.target.value)}
                className="header-filter-select"
              >
                <option value="all">Все витражи</option>
                {getUniqueVitrageTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Фильтр по количеству сегментов */}
            <div className="header-filter-item">
              <select
                value={filterSegmentsCount}
                onChange={(e) => setFilterSegmentsCount(e.target.value)}
                className="header-filter-select"
              >
                <option value="all">Все размеры</option>
                {getUniqueSegmentsCounts().map(count => (
                  <option key={count} value={count}>{count} сегментов</option>
                ))}
              </select>
            </div>

            {/* Кнопка сброса фильтров */}
            <button className="reset-filters-btn-header" onClick={resetFilters} title="Сбросить все фильтры">
              ✕
            </button>

            <div className="export-dropdown">
              <button
                className="export-data-btn"
                onClick={handleExportData}
                disabled={filteredVitrages.length === 0}
                title="Экспортировать данные в CSV"
              >
                📊 Экспорт данных ▾
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button
                    className="export-menu-item"
                    onClick={handleExportAll}
                  >
                    📋 Экспортировать все витражи ({filteredVitrages.length})
                  </button>
                  <button
                    className="export-menu-item"
                    onClick={handleExportSelected}
                    disabled={!selectedVitrageForDetails}
                  >
                    📄 Экспортировать выбранный витраж
                    {selectedVitrageForDetails && ` (${selectedVitrageForDetails.name})`}
                  </button>
                </div>
              )}
            </div>
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

      {/* Боковая панель с деталями */}
      {selectedVitrageForDetails && (
        <div className="details-panel">
          <div className="details-header">
            <div>
              <h3>{selectedVitrageForDetails.name}</h3>
              <p className="details-subtitle">
                {getObjectName(selectedVitrageForDetails)}{getVersionName(selectedVitrageForDetails) ? ` - ${getVersionName(selectedVitrageForDetails)}` : ''}
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
