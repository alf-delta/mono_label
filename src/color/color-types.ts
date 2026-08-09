export type ColorValidationIssueType =
  | 'INVALID_HEX'
  | 'CONTRAST_TOO_LOW'
  | 'LUMINANCE_TOO_LOW'
  | 'LUMINANCE_TOO_HIGH'
  | 'SATURATION_TOO_LOW'
  | 'SATURATION_TOO_HIGH'
  | 'LIGHTNESS_TOO_LOW'
  | 'LIGHTNESS_TOO_HIGH';

export interface ColorMetrics {
  relativeLuminance: number;
  contrastRatio: number;
  saturation: number;
  lightness: number;
}

export interface ColorValidationIssue {
  type: ColorValidationIssueType;
  message: string;
}

export interface ColorValidationResult {
  valid: boolean;
  normalizedHex: string | null;
  metrics: ColorMetrics | null;
  issues: readonly ColorValidationIssue[];
}

export type ColorResolutionStatus = 'approved' | 'adjusted' | 'rejected';

export interface ColorResolution {
  requestedHex: string;
  finalHex: string | null;
  status: ColorResolutionStatus;
  validation: ColorValidationResult;
}

export interface NamedColor {
  name: string;
  hex: string;
}

export interface ColorCandidate extends NamedColor {
  id: string;
  role: 'suggested' | 'alternative';
  profile: string;
  resolution: Exclude<ColorResolutionStatus, 'rejected'>;
  metrics: ColorMetrics;
}
