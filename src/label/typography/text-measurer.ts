import { FONT_ROLES, type FontRole } from './font-roles';

export interface TextMeasurement {
  width: number;
  height: number;
}

export interface TextMeasurer {
  measure(text: string, fontRole: FontRole, fontSize: number, letterSpacing: number): TextMeasurement;
}

export function createCanvasTextMeasurer(): TextMeasurer {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas text measurement is unavailable.');

  return {
    measure(text, fontRole, fontSize, letterSpacing) {
      const font = FONT_ROLES[fontRole];
      context.font = `${font.style} ${font.weight} ${fontSize}px ${font.family}`;
      const metrics = context.measureText(text);
      const glyphGaps = Math.max(0, Array.from(text).length - 1);
      const measuredHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

      return {
        width: metrics.width + glyphGaps * letterSpacing,
        height: measuredHeight || fontSize,
      };
    },
  };
}

