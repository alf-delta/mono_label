import { COLOR_RULES, type ColorRules } from './color-rules.js';
import { contrastRatio, hexToRgb, hslToHex, relativeLuminance, rgbToHsl } from './color-math.js';
import type { ColorMetrics, ColorResolution, ColorValidationIssue, ColorValidationResult } from './color-types.js';

const round = (value: number, digits: number) => Number(value.toFixed(digits));
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function validateBackgroundColor(
  value: string,
  rules: ColorRules = COLOR_RULES,
): ColorValidationResult {
  const background = hexToRgb(value);
  const foreground = hexToRgb(rules.foreground);
  if (!background || !foreground) {
    const issues: readonly ColorValidationIssue[] = Object.freeze([
      { type: 'INVALID_HEX', message: 'Use a six-digit hexadecimal background color.' },
    ]);
    return Object.freeze({
      valid: false,
      normalizedHex: null,
      metrics: null,
      issues,
    });
  }

  const normalizedHex = value.trim().toLocaleUpperCase();
  const hsl = rgbToHsl(background);
  const metrics: ColorMetrics = Object.freeze({
    relativeLuminance: round(relativeLuminance(background), 4),
    contrastRatio: round(contrastRatio(background, foreground), 2),
    saturation: round(hsl.saturation, 4),
    lightness: round(hsl.lightness, 4),
  });
  const issues: ColorValidationIssue[] = [];

  if (metrics.contrastRatio < rules.minimumContrast) {
    issues.push({ type: 'CONTRAST_TOO_LOW', message: `Contrast must be at least ${rules.minimumContrast}:1 against ivory.` });
  }
  if (metrics.relativeLuminance < rules.minimumLuminance) {
    issues.push({ type: 'LUMINANCE_TOO_LOW', message: 'Background luminance is below the brand-safe range.' });
  }
  if (metrics.relativeLuminance > rules.maximumLuminance) {
    issues.push({ type: 'LUMINANCE_TOO_HIGH', message: 'Background luminance is above the brand-safe range.' });
  }
  if (metrics.saturation < rules.minimumSaturation) {
    issues.push({ type: 'SATURATION_TOO_LOW', message: 'Background saturation is below the brand-safe range.' });
  }
  if (metrics.saturation > rules.maximumSaturation) {
    issues.push({ type: 'SATURATION_TOO_HIGH', message: 'Background saturation is above the brand-safe range.' });
  }
  if (metrics.lightness < rules.minimumLightness) {
    issues.push({ type: 'LIGHTNESS_TOO_LOW', message: 'Background lightness is below the brand-safe range.' });
  }
  if (metrics.lightness > rules.maximumLightness) {
    issues.push({ type: 'LIGHTNESS_TOO_HIGH', message: 'Background lightness is above the brand-safe range.' });
  }

  return Object.freeze({ valid: issues.length === 0, normalizedHex, metrics, issues: Object.freeze(issues) });
}

export function resolveBackgroundColor(
  requestedHex: string,
  rules: ColorRules = COLOR_RULES,
): ColorResolution {
  const initial = validateBackgroundColor(requestedHex, rules);
  if (initial.valid) {
    return Object.freeze({ requestedHex, finalHex: initial.normalizedHex, status: 'approved', validation: initial });
  }

  const rgb = hexToRgb(requestedHex);
  if (!rgb) return Object.freeze({ requestedHex, finalHex: null, status: 'rejected', validation: initial });

  const originalHsl = rgbToHsl(rgb);
  let saturation = clamp(originalHsl.saturation, rules.minimumSaturation, rules.maximumSaturation);
  let lightness = clamp(originalHsl.lightness, rules.minimumLightness, rules.maximumLightness);
  let latest = initial;

  for (let step = 0; step <= rules.maximumAdjustmentSteps; step += 1) {
    const candidate = hslToHex({ hue: originalHsl.hue, saturation, lightness });
    latest = validateBackgroundColor(candidate, rules);
    if (latest.valid) {
      return Object.freeze({ requestedHex, finalHex: latest.normalizedHex, status: 'adjusted', validation: latest });
    }

    const issueTypes = new Set(latest.issues.map((issue) => issue.type));
    let adjusted = false;
    if (issueTypes.has('SATURATION_TOO_LOW')) {
      saturation = clamp(saturation + rules.adjustmentStep, rules.minimumSaturation, rules.maximumSaturation);
      adjusted = true;
    }
    if (issueTypes.has('SATURATION_TOO_HIGH')) {
      saturation = clamp(saturation - rules.adjustmentStep, rules.minimumSaturation, rules.maximumSaturation);
      adjusted = true;
    }

    if (issueTypes.has('LUMINANCE_TOO_HIGH') || issueTypes.has('LIGHTNESS_TOO_HIGH') || issueTypes.has('CONTRAST_TOO_LOW')) {
      lightness -= rules.adjustmentStep;
      adjusted = true;
    } else if (issueTypes.has('LUMINANCE_TOO_LOW') || issueTypes.has('LIGHTNESS_TOO_LOW')) {
      lightness += rules.adjustmentStep;
      adjusted = true;
    }

    if (!adjusted) break;
    if (lightness < rules.minimumLightness || lightness > rules.maximumLightness) break;
  }

  return Object.freeze({ requestedHex, finalHex: null, status: 'rejected', validation: latest });
}
