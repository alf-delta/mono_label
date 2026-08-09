import type { CoffeeLabelTemplate } from '../label/templates/template-types';
import type {
  ExportSettings,
  ImpositionResult,
  LabelPlacement,
  PrintFormat,
  SheetOrientation,
} from './export-types';
import { getPrintFormat } from './print-formats';

export const CUTTER_GUIDE_LENGTH_MM = 3;
export const CROP_MARK_OFFSET_MM = 0.6;
export const CROP_MARK_LENGTH_MM = 2.5;
export const PRINT_MARK_RESERVE_MM = CROP_MARK_OFFSET_MM + CROP_MARK_LENGTH_MM;

interface Candidate {
  format: PrintFormat;
  orientation: SheetOrientation;
  pageWidthMm: number;
  pageHeightMm: number;
  labelRotation: 0 | 90;
  trimWidth: number;
  trimHeight: number;
  maximumColumns: number;
  maximumRows: number;
  maximumQuantity: number;
  effectiveMarginMm: number;
}

function orientations(settings: ExportSettings): readonly SheetOrientation[] {
  return settings.orientation === 'auto' ? ['portrait', 'landscape'] : [settings.orientation];
}

function createCandidate(
  format: PrintFormat,
  orientation: SheetOrientation,
  rotation: 0 | 90,
  settings: ExportSettings,
  template: CoffeeLabelTemplate,
): Candidate {
  const pageWidthMm = orientation === 'portrait' ? format.widthMm : format.heightMm;
  const pageHeightMm = orientation === 'portrait' ? format.heightMm : format.widthMm;
  const trimWidth = rotation === 0 ? template.widthMm : template.heightMm;
  const trimHeight = rotation === 0 ? template.heightMm : template.widthMm;
  const hasMarks = Object.values(settings.marks).some(Boolean);
  const effectiveMarginMm = Math.max(settings.marginMm, hasMarks ? PRINT_MARK_RESERVE_MM : 0);
  const usableWidth = pageWidthMm - 2 * effectiveMarginMm - 2 * template.bleedMm;
  const usableHeight = pageHeightMm - 2 * effectiveMarginMm - 2 * template.bleedMm;
  const maximumColumns = Math.max(0, Math.floor((usableWidth + 1e-6) / trimWidth));
  const maximumRows = Math.max(0, Math.floor((usableHeight + 1e-6) / trimHeight));
  return {
    format,
    orientation,
    pageWidthMm,
    pageHeightMm,
    labelRotation: rotation,
    trimWidth,
    trimHeight,
    maximumColumns,
    maximumRows,
    maximumQuantity: maximumColumns * maximumRows,
    effectiveMarginMm,
  };
}

function candidateScore(candidate: Candidate): readonly number[] {
  const occupied = candidate.maximumQuantity * candidate.trimWidth * candidate.trimHeight;
  return [
    candidate.maximumQuantity,
    occupied / (candidate.pageWidthMm * candidate.pageHeightMm),
    candidate.orientation === 'portrait' ? 1 : 0,
    candidate.labelRotation === 0 ? 1 : 0,
  ];
}

function betterCandidate(left: Candidate, right: Candidate): Candidate {
  const leftScore = candidateScore(left);
  const rightScore = candidateScore(right);
  for (let index = 0; index < leftScore.length; index += 1) {
    if (leftScore[index] !== rightScore[index]) return leftScore[index] > rightScore[index] ? left : right;
  }
  return left;
}

export function calculateImposition(
  template: CoffeeLabelTemplate,
  settings: ExportSettings,
): ImpositionResult {
  const format = getPrintFormat(settings.formatId);
  const candidates = orientations(settings).flatMap((orientation) => [
    createCandidate(format, orientation, 0, settings, template),
    createCandidate(format, orientation, 90, settings, template),
  ]);
  const best = candidates.reduce(betterCandidate);
  if (best.maximumQuantity < 1) throw new Error('The label does not fit on the selected sheet with these margins.');

  const requested = settings.quantityMode === 'maximum' ? best.maximumQuantity : Math.round(settings.quantity);
  const quantity = Math.max(1, Math.min(best.maximumQuantity, requested));
  const columns = Math.min(best.maximumColumns, quantity);
  const rows = Math.ceil(quantity / columns);
  const blockWidth = columns * best.trimWidth + 2 * template.bleedMm;
  const blockHeight = rows * best.trimHeight + 2 * template.bleedMm;
  const blockX = (best.pageWidthMm - blockWidth) / 2;
  const blockY = (best.pageHeightMm - blockHeight) / 2;

  const placements: LabelPlacement[] = Array.from({ length: quantity }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      index,
      row,
      column,
      trimX: blockX + template.bleedMm + column * best.trimWidth,
      trimY: blockY + template.bleedMm + row * best.trimHeight,
      trimWidth: best.trimWidth,
      trimHeight: best.trimHeight,
      rotation: best.labelRotation,
    };
  });

  const verticalCuts = Array.from({ length: columns + 1 }, (_, index) => blockX + template.bleedMm + index * best.trimWidth);
  const horizontalCuts = Array.from({ length: rows + 1 }, (_, index) => blockY + template.bleedMm + index * best.trimHeight);
  const warnings: string[] = [];
  if (settings.marginMm < best.effectiveMarginMm) {
    warnings.push(`Print marks require at least ${best.effectiveMarginMm} mm; the effective margin was increased.`);
  }
  if (settings.quantityMode === 'custom' && requested > best.maximumQuantity) {
    warnings.push(`Quantity was limited to ${best.maximumQuantity} for this sheet.`);
  }
  if (quantity < columns * rows) warnings.push('The last grid cell is intentionally blank.');

  return Object.freeze({
    format,
    orientation: best.orientation,
    pageWidthMm: best.pageWidthMm,
    pageHeightMm: best.pageHeightMm,
    labelRotation: best.labelRotation,
    maximumQuantity: best.maximumQuantity,
    quantity,
    columns,
    rows,
    blockX,
    blockY,
    blockWidth,
    blockHeight,
    effectiveMarginMm: best.effectiveMarginMm,
    placements: Object.freeze(placements),
    verticalCuts: Object.freeze(verticalCuts),
    horizontalCuts: Object.freeze(horizontalCuts),
    warnings: Object.freeze(warnings),
  });
}
