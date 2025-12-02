// Основные типы для работы с сегментами витража

export interface Segment {
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

export interface VitrageConfig {
  marking: string;
  horizontalSegments: number;
  verticalSegments: number;
  segments: Segment[][];
  totalWidth: number;
  totalHeight: number;
}

export interface SegmentProperties {
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
}

export interface SegmentDimensions {
  width: number;
  height: number;
  positionX: number;
  positionY: number;
}

export interface SegmentCalculationResult {
  segments: Segment[][];
  totalWidth: number;
  totalHeight: number;
}
