import type { FontRole } from '../typography/font-roles.js';

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'baseline' | 'bottom';
export type CaseTransform = 'none' | 'uppercase' | 'lowercase';
export type OverflowPolicy = 'fixed' | 'shrink-then-error' | 'wrap-then-shrink-then-error';

export interface TemplateBox {
  x: number;
  y: number;
  width: number;
  height: number;
  fontRole: FontRole;
  fontSize: number;
  minFontSize: number;
  maxLines: number;
  lineHeight: number;
  horizontalAlign: HorizontalAlign;
  verticalAlign: VerticalAlign;
  overflow: OverflowPolicy;
  caseTransform: CaseTransform;
  letterSpacing: number;
}

export type TemplateRegionKey =
  | 'variety'
  | 'processing'
  | 'altitude'
  | 'producer'
  | 'bestFor'
  | 'brewIcon'
  | 'coffeeName'
  | 'tastingNotes'
  | 'netWeight';

export interface CoffeeLabelTemplate {
  id: 'coffee-label-v1';
  version: 1;
  units: 'mm';
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeInsetMm: number;
  metadataLabelWidthMm: number;
  dividerStrokeMm: number;
  tastingNotesMaxCount: number;
  regions: Record<TemplateRegionKey, TemplateBox>;
}
