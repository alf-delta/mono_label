import { BREW_METHODS, type CoffeeLabel } from '../../types/coffee-label';
import { validateBackgroundColor } from '../../color/color-engine';
import { tastingNotesText, transformCase } from '../data/rendered-text';
import type { CoffeeLabelTemplate } from '../templates/template-types';
import type { TextMeasurer } from '../typography/text-measurer';
import { fitText } from './fit-text';
import type { LabelValidationResources } from './validation-resources';
import type {
  LabelTextLayout,
  LabelValidationError,
  LabelValidationResult,
  TextLayoutRegion,
} from './validation-types';

function renderedLines(data: Readonly<CoffeeLabel>, template: CoffeeLabelTemplate): Record<TextLayoutRegion, readonly string[]> {
  const r = template.regions;
  return {
    variety: [transformCase(data.variety, r.variety)],
    processing: [transformCase(data.processing, r.processing)],
    altitude: [transformCase(data.altitude, r.altitude)],
    producer: [data.producer.line1, data.producer.line2]
      .filter(Boolean)
      .map((line) => transformCase(line, r.producer)),
    coffeeName: [transformCase(data.coffeeName, r.coffeeName)],
    tastingNotes: [transformCase(tastingNotesText(data.tastingNotes), r.tastingNotes)],
    netWeight: [transformCase(`net wt. ${data.netWeight}`, r.netWeight)],
  };
}

export function createDefaultLabelLayout(
  data: Readonly<CoffeeLabel>,
  template: CoffeeLabelTemplate,
): LabelTextLayout {
  const lines = renderedLines(data, template);
  return Object.fromEntries(
    (Object.keys(lines) as TextLayoutRegion[]).map((region) => [
      region,
      {
        fontSize: template.regions[region].fontSize,
        measuredWidth: 0,
        measuredHeight: 0,
        lines: lines[region],
        fits: true,
        didShrink: false,
      },
    ]),
  ) as unknown as LabelTextLayout;
}

function requiredErrors(data: Readonly<CoffeeLabel>): LabelValidationError[] {
  const values: Array<[string, string | readonly string[]]> = [
    ['coffeeName', data.coffeeName],
    ['variety', data.variety],
    ['processing', data.processing],
    ['altitude', data.altitude],
    ['producer.line1', data.producer.line1],
    ['tastingNotes', data.tastingNotes],
    ['backgroundColor', data.backgroundColor],
    ['netWeight', data.netWeight],
  ];

  return values.flatMap(([field, value]) => {
    const empty = typeof value === 'string' ? value.trim().length === 0 : value.length === 0;
    return empty ? [{ field, type: 'REQUIRED' as const, message: 'This value is required.' }] : [];
  });
}

export function validateLabel(
  data: Readonly<CoffeeLabel>,
  template: CoffeeLabelTemplate,
  measurer: TextMeasurer,
  resources: LabelValidationResources,
): LabelValidationResult {
  const lines = renderedLines(data, template);
  const metadataWidth = template.regions.variety.width - template.metadataLabelWidthMm;
  const layout: LabelTextLayout = {
    variety: fitText({ lines: lines.variety, box: template.regions.variety, availableWidth: metadataWidth, measurer }),
    processing: fitText({ lines: lines.processing, box: template.regions.processing, availableWidth: metadataWidth, measurer }),
    altitude: fitText({ lines: lines.altitude, box: template.regions.altitude, availableWidth: metadataWidth, measurer }),
    producer: fitText({ lines: lines.producer, box: template.regions.producer, availableWidth: metadataWidth, measurer }),
    coffeeName: fitText({ lines: lines.coffeeName, box: template.regions.coffeeName, availableWidth: template.regions.coffeeName.width, measurer }),
    tastingNotes: fitText({ lines: lines.tastingNotes, box: template.regions.tastingNotes, availableWidth: template.regions.tastingNotes.width, measurer }),
    netWeight: fitText({ lines: lines.netWeight, box: template.regions.netWeight, availableWidth: template.regions.netWeight.width, measurer }),
  };

  const errors: LabelValidationError[] = requiredErrors(data);

  for (const region of Object.keys(layout) as TextLayoutRegion[]) {
    if (!layout[region].fits) {
      errors.push({
        field: region,
        type: 'TEXT_OVERFLOW',
        message: 'This value is too long for the label.',
      });
    }
  }

  if (data.tastingNotes.length > template.tastingNotesMaxCount) {
    errors.push({
      field: 'tastingNotes',
      type: 'TOO_MANY_ITEMS',
      message: `Use no more than ${template.tastingNotesMaxCount} tasting notes.`,
    });
  }

  if (!(BREW_METHODS as readonly string[]).includes(data.brewMethod)) {
    errors.push({ field: 'brewMethod', type: 'INVALID_BREW_METHOD', message: 'Choose pourover or espresso.' });
  } else if (!resources.brewIconAvailable) {
    errors.push({ field: 'brewMethod', type: 'MISSING_SVG_ICON', message: 'The selected brew icon is missing.' });
  }

  const colorValidation = validateBackgroundColor(data.backgroundColor);
  for (const issue of colorValidation.issues) {
    errors.push({
      field: 'backgroundColor',
      type: issue.type === 'INVALID_HEX'
        ? 'INVALID_COLOR'
        : issue.type === 'CONTRAST_TOO_LOW'
          ? 'CONTRAST_FAILURE'
          : 'COLOR_OUT_OF_RANGE',
      message: issue.message,
    });
  }

  const checkedRoles = new Set<string>();
  for (const region of Object.keys(layout) as TextLayoutRegion[]) {
    const role = template.regions[region].fontRole;
    const resource = resources.fonts[role];
    if (!checkedRoles.has(role) && !resource.available) {
      checkedRoles.add(role);
      errors.push({ field: `fonts.${role}`, type: 'MISSING_FONT', message: `The ${role} font resource is missing.` });
    }
    if (resource.available && !resource.supportsText(layout[region].lines.join(''))) {
      errors.push({
        field: region,
        type: 'UNSUPPORTED_CHARACTERS',
        message: 'This value contains characters unsupported by the selected font.',
      });
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), layout });
}
