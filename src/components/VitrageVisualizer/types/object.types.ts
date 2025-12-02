// Типы для работы с объектами проекта

export interface ObjectVersion {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ProjectObject {
  id: string;
  name: string;
  versions: ObjectVersion[];
  createdAt: Date;
}

export interface CreatedVitrage {
  name: string;
  siteManager?: string;
  creationDate?: string;
  horizontal: number;
  vertical: number;
}

export interface SavedVitrage {
  id: string;
  name: string;
  siteManager?: string;
  creationDate?: string;
  horizontal: number;
  vertical: number;
  segments: Record<number, {
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
  }>;
  createdAt: Date;
}

export interface VitrageVisualizerProps {
  selectedObject?: { id: string; name: string } | null;
}

export interface VitrageData {
  name: string;
  siteManager?: string;
  creationDate?: string;
  objectId: string;
  objectName: string;
  rows: number;
  cols: number;
  segments: Array<{
    id: string;
    type: string;
    width?: number;
    height?: number;
    formula?: string;
    label?: string;
  }>;
  segmentProperties: Record<number, any>;
  totalWidth: number;
  totalHeight: number;
  svgDrawing: string;
}
