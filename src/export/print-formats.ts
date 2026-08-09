import type { ExportSettings, PrintFormat } from './export-types';

export const PRINT_FORMATS: readonly PrintFormat[] = Object.freeze([
  { id: 'a4', name: 'A4', family: 'ISO', widthMm: 210, heightMm: 297 },
  { id: 'a3', name: 'A3', family: 'ISO', widthMm: 297, heightMm: 420 },
  { id: 'us-letter', name: 'Letter', family: 'US', widthMm: 215.9, heightMm: 279.4 },
  { id: 'us-tabloid', name: 'Tabloid', family: 'US', widthMm: 279.4, heightMm: 431.8 },
]);

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = Object.freeze({
  formatId: 'a4',
  orientation: 'auto',
  marginMm: 5,
  quantityMode: 'maximum',
  quantity: 1,
  marks: Object.freeze({ cropMarks: true, cutterGuides: true, registrationMarks: false }),
});

export function getPrintFormat(id: ExportSettings['formatId']): PrintFormat {
  return PRINT_FORMATS.find((format) => format.id === id) ?? PRINT_FORMATS[0];
}
