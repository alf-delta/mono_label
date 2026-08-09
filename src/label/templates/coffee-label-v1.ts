import type { CoffeeLabelTemplate, TemplateBox } from './template-types';

const box = (value: TemplateBox): TemplateBox => value;

/**
 * Reference calibration values in physical millimetres.
 * Recovered from the supplied Adobe reference screenshot and its point rulers.
 */
export const COFFEE_LABEL_V1: CoffeeLabelTemplate = {
  id: 'coffee-label-v1',
  version: 1,
  units: 'mm',
  widthMm: 107,
  heightMm: 99,
  bleedMm: 2,
  safeInsetMm: 10,
  metadataLabelWidthMm: 28.7,
  dividerStrokeMm: 0.18,
  tastingNotesMaxCount: 6,
  regions: {
    variety: box({
      x: 10.3, y: 9, width: 54.3, height: 5.82,
      fontRole: 'primaryBold', fontSize: 3, minFontSize: 2.75,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'left', verticalAlign: 'middle',
      overflow: 'shrink-then-error', caseTransform: 'uppercase', letterSpacing: 0,
    }),
    processing: box({
      x: 10.3, y: 14.82, width: 54.3, height: 6.03,
      fontRole: 'primaryBold', fontSize: 3, minFontSize: 2.75,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'left', verticalAlign: 'middle',
      overflow: 'shrink-then-error', caseTransform: 'uppercase', letterSpacing: 0,
    }),
    altitude: box({
      x: 10.3, y: 20.85, width: 54.3, height: 6.03,
      fontRole: 'primaryBold', fontSize: 3, minFontSize: 2.9,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'left', verticalAlign: 'middle',
      overflow: 'shrink-then-error', caseTransform: 'uppercase', letterSpacing: 0,
    }),
    producer: box({
      x: 10.3, y: 26.88, width: 54.3, height: 9.24,
      fontRole: 'primaryBold', fontSize: 3, minFontSize: 2.75,
      maxLines: 2, lineHeight: 0.95, horizontalAlign: 'left', verticalAlign: 'middle',
      overflow: 'wrap-then-shrink-then-error', caseTransform: 'uppercase', letterSpacing: 0,
    }),
    bestFor: box({
      x: 74.5, y: 9, width: 24, height: 5.82,
      fontRole: 'primaryBold', fontSize: 3, minFontSize: 3,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'center', verticalAlign: 'middle',
      overflow: 'fixed', caseTransform: 'uppercase', letterSpacing: 0,
    }),
    brewIcon: box({
      x: 76.5, y: 16.2, width: 20, height: 15,
      fontRole: 'bodyRegular', fontSize: 0, minFontSize: 0,
      maxLines: 0, lineHeight: 1, horizontalAlign: 'center', verticalAlign: 'middle',
      overflow: 'fixed', caseTransform: 'none', letterSpacing: 0,
    }),
    coffeeName: box({
      x: 10, y: 61, width: 87, height: 9.6,
      fontRole: 'primaryBold', fontSize: 5.33, minFontSize: 4.7,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'center', verticalAlign: 'middle',
      overflow: 'shrink-then-error', caseTransform: 'uppercase', letterSpacing: 0,
    }),
    tastingNotes: box({
      x: 7.6, y: 70.3, width: 91, height: 9.7,
      fontRole: 'displayItalic', fontSize: 4.9, minFontSize: 4.5,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'center', verticalAlign: 'middle',
      overflow: 'shrink-then-error', caseTransform: 'lowercase', letterSpacing: 0,
    }),
    netWeight: box({
      x: 31, y: 87, width: 45, height: 6.2,
      fontRole: 'bodyRegular', fontSize: 3, minFontSize: 3,
      maxLines: 1, lineHeight: 1, horizontalAlign: 'center', verticalAlign: 'middle',
      overflow: 'fixed', caseTransform: 'lowercase', letterSpacing: 0.02,
    }),
  },
};
