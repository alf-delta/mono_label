import { COFFEE_LABEL_V1 } from '../label/templates/coffee-label-v1';
import { calculateImposition } from './imposition';
import { DEFAULT_EXPORT_SETTINGS } from './print-formats';

export function assertImpositionContract(): void {
  const defaults = calculateImposition(COFFEE_LABEL_V1, DEFAULT_EXPORT_SETTINGS);
  if (defaults.format.id !== 'a4' || defaults.maximumQuantity !== 2) {
    throw new Error('A4 with 5 mm marked margins must fit exactly two labels.');
  }

  const borderless = calculateImposition(COFFEE_LABEL_V1, {
    ...DEFAULT_EXPORT_SETTINGS,
    marginMm: 0,
    marks: { cropMarks: false, cutterGuides: false, registrationMarks: false },
  });
  if (borderless.maximumQuantity !== 4) throw new Error('A4 borderless maximum must be four labels.');

  const compactMarks = calculateImposition(COFFEE_LABEL_V1, { ...DEFAULT_EXPORT_SETTINGS, marginMm: 3.1 });
  if (compactMarks.maximumQuantity !== 4) throw new Error('A4 with minimum marked margins must fit four labels.');

  const a3 = calculateImposition(COFFEE_LABEL_V1, { ...DEFAULT_EXPORT_SETTINGS, formatId: 'a3' });
  if (a3.maximumQuantity !== 8) throw new Error('A3 marked maximum must be eight labels.');

  const tabloid = calculateImposition(COFFEE_LABEL_V1, { ...DEFAULT_EXPORT_SETTINGS, formatId: 'us-tabloid' });
  if (tabloid.maximumQuantity !== 8) throw new Error('US Tabloid marked maximum must be eight labels.');

  const letter = calculateImposition(COFFEE_LABEL_V1, { ...DEFAULT_EXPORT_SETTINGS, formatId: 'us-letter' });
  if (letter.maximumQuantity !== 4) throw new Error('US Letter marked maximum must be four labels.');
}
