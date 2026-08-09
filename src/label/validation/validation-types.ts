import type { TemplateRegionKey } from '../templates/template-types.js';

export type TextLayoutRegion = Exclude<TemplateRegionKey, 'bestFor' | 'brewIcon'>;

export interface TextRegionLayout {
  fontSize: number;
  measuredWidth: number;
  measuredHeight: number;
  lines: readonly string[];
  fits: boolean;
  didShrink: boolean;
}

export type LabelTextLayout = Record<TextLayoutRegion, TextRegionLayout>;

export type ValidationErrorType =
  | 'REQUIRED'
  | 'TEXT_OVERFLOW'
  | 'TOO_MANY_ITEMS'
  | 'INVALID_BREW_METHOD'
  | 'INVALID_COLOR'
  | 'CONTRAST_FAILURE'
  | 'COLOR_OUT_OF_RANGE'
  | 'MISSING_FONT'
  | 'UNSUPPORTED_CHARACTERS'
  | 'MISSING_SVG_ICON';

export interface LabelValidationError {
  field: string;
  type: ValidationErrorType;
  message: string;
}

export interface LabelValidationResult {
  valid: boolean;
  errors: readonly LabelValidationError[];
  layout: LabelTextLayout;
}

export type ValidationStatus = 'measuring' | 'ready';
