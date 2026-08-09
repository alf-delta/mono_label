import type { FontRole } from '../typography/font-roles';
import type { TextMeasurer } from '../typography/text-measurer';
import type { TemplateBox } from '../templates/template-types';
import type { TextRegionLayout } from './validation-types';

interface FitTextOptions {
  lines: readonly string[];
  box: TemplateBox;
  availableWidth: number;
  measurer: TextMeasurer;
  fontRole?: FontRole;
}

const PRECISION = 100;
const EPSILON = 0.001;

function measureLines(
  lines: readonly string[],
  box: TemplateBox,
  availableFontSize: number,
  measurer: TextMeasurer,
  fontRole: FontRole,
) {
  const measurements = lines.map((line) =>
    measurer.measure(line, fontRole, availableFontSize, box.letterSpacing),
  );
  const measuredWidth = Math.max(0, ...measurements.map((measurement) => measurement.width));
  const glyphHeight = Math.max(0, ...measurements.map((measurement) => measurement.height));
  const measuredHeight = glyphHeight + Math.max(0, lines.length - 1) * availableFontSize * box.lineHeight;
  return { measuredWidth, measuredHeight };
}

export function fitText({ lines, box, availableWidth, measurer, fontRole = box.fontRole }: FitTextOptions): TextRegionLayout {
  const defaultStep = Math.round(box.fontSize * PRECISION);
  const minimumStep = Math.round(box.minFontSize * PRECISION);
  const canShrink = box.overflow !== 'fixed';
  const lastStep = canShrink ? minimumStep : defaultStep;

  for (let step = defaultStep; step >= lastStep; step -= 1) {
    const fontSize = step / PRECISION;
    const metrics = measureLines(lines, box, fontSize, measurer, fontRole);
    const fits =
      lines.length <= box.maxLines &&
      metrics.measuredWidth <= availableWidth + EPSILON &&
      metrics.measuredHeight <= box.height + EPSILON;

    if (fits) {
      return {
        fontSize,
        measuredWidth: metrics.measuredWidth,
        measuredHeight: metrics.measuredHeight,
        lines,
        fits: true,
        didShrink: fontSize < box.fontSize - EPSILON,
      };
    }
  }

  const fontSize = lastStep / PRECISION;
  const metrics = measureLines(lines, box, fontSize, measurer, fontRole);
  return {
    fontSize,
    measuredWidth: metrics.measuredWidth,
    measuredHeight: metrics.measuredHeight,
    lines,
    fits: false,
    didShrink: fontSize < box.fontSize - EPSILON,
  };
}

