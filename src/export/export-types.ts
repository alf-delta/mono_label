import type { CoffeeLabel } from '../types/coffee-label.js';
import type { CoffeeLabelTemplate } from '../label/templates/template-types.js';
import type { LabelTextLayout } from '../label/validation/validation-types.js';

export const PRINT_FORMAT_IDS = ['a4', 'a3', 'us-letter', 'us-tabloid'] as const;
export type PrintFormatId = (typeof PRINT_FORMAT_IDS)[number];
export type SheetOrientation = 'portrait' | 'landscape';
export type SheetOrientationPreference = 'auto' | SheetOrientation;
export type QuantityMode = 'maximum' | 'custom';

export interface PrintMarks {
  cropMarks: boolean;
  cutterGuides: boolean;
  registrationMarks: boolean;
}

export interface ExportSettings {
  formatId: PrintFormatId;
  orientation: SheetOrientationPreference;
  marginMm: number;
  quantityMode: QuantityMode;
  quantity: number;
  marks: PrintMarks;
}

export interface PrintFormat {
  id: PrintFormatId;
  name: string;
  family: 'ISO' | 'US';
  widthMm: number;
  heightMm: number;
}

export interface LabelPlacement {
  index: number;
  trimX: number;
  trimY: number;
  trimWidth: number;
  trimHeight: number;
  rotation: 0 | 90;
  row: number;
  column: number;
}

export interface ImpositionResult {
  format: PrintFormat;
  orientation: SheetOrientation;
  pageWidthMm: number;
  pageHeightMm: number;
  labelRotation: 0 | 90;
  maximumQuantity: number;
  quantity: number;
  columns: number;
  rows: number;
  blockX: number;
  blockY: number;
  blockWidth: number;
  blockHeight: number;
  effectiveMarginMm: number;
  placements: readonly LabelPlacement[];
  verticalCuts: readonly number[];
  horizontalCuts: readonly number[];
  warnings: readonly string[];
}

export interface ExportSnapshot {
  id: string;
  generatedAt: string;
  templateId: CoffeeLabelTemplate['id'];
  templateVersion: CoffeeLabelTemplate['version'];
  labelData: CoffeeLabel;
  template: CoffeeLabelTemplate;
  layout: LabelTextLayout;
  svgMarkup: string;
}

export interface ExportRequest {
  snapshot: ExportSnapshot;
  settings: ExportSettings;
  outlinedSvg: string;
}

export interface ExportResult {
  filename: string;
  downloadUrl: string;
  settings: ExportSettings;
  imposition: ImpositionResult;
}
