import type { CoffeeLabel, CoffeeLabelInput } from '../../types/coffee-label';
import { COLOR_RULES } from '../../color/color-rules';

export const FIXED_FOREGROUND_COLOR = COLOR_RULES.foreground;
export const DEFAULT_NET_WEIGHT = '250 g' as const;

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function upper(value: string): string {
  return collapseWhitespace(value).toLocaleUpperCase();
}

function lower(value: string): string {
  return collapseWhitespace(value).toLocaleLowerCase();
}

function normalizeHex(value: string): string {
  return collapseWhitespace(value).toLocaleUpperCase();
}

/**
 * The only conversion from editable/researched input to renderer-facing data.
 * It is deliberately pure so the same input always creates the same label.
 */
export function normalizeCoffeeLabel(input: CoffeeLabelInput): CoffeeLabel {
  const tastingNotes = Object.freeze(input.tastingNotes.map(lower).filter(Boolean));
  const producer = Object.freeze({
    line1: upper(input.producer.line1),
    line2: upper(input.producer.line2),
  });

  return Object.freeze({
    coffeeName: upper(input.coffeeName),
    variety: upper(input.variety),
    processing: upper(input.processing),
    altitude: collapseWhitespace(input.altitude),
    producer,
    tastingNotes,
    brewMethod: input.brewMethod,
    backgroundColor: normalizeHex(input.backgroundColor),
    foregroundColor: FIXED_FOREGROUND_COLOR,
    netWeight: collapseWhitespace(input.netWeight ?? DEFAULT_NET_WEIGHT),
  });
}
