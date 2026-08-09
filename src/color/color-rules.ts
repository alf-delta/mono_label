export const COLOR_RULES = Object.freeze({
  foreground: '#F9F7DE' as const,
  minimumContrast: 4.5,
  minimumLuminance: 0.035,
  maximumLuminance: 0.18,
  minimumSaturation: 0.14,
  maximumSaturation: 0.5,
  minimumLightness: 0.22,
  maximumLightness: 0.46,
  adjustmentStep: 0.005,
  maximumAdjustmentSteps: 160,
});

export type ColorRules = typeof COLOR_RULES;
