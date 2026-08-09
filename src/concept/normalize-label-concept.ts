import { resolveBackgroundColor } from '../color/color-engine.js';
import { colorDistance, hexToRgb, hslToHex, rgbToHsl } from '../color/color-math.js';
import type { ColorCandidate } from '../color/color-types.js';
import type { CoffeeResearchResult } from '../research/research-types.js';
import type { RawConceptColor, RawLabelConcept } from './concept-schema.js';
import type { ConceptAnchor, ConceptAnchorField, LabelConceptColor, LabelConceptResponse } from './concept-types.js';

const MINIMUM_COLOR_DISTANCE = 30;

function comparable(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function allowedValues(research: CoffeeResearchResult): ReadonlyMap<ConceptAnchorField, readonly string[]> {
  return new Map([
    ['coffeeName', research.coffeeName.value ? [research.coffeeName.value] : []],
    ['variety', research.variety.value ? [research.variety.value] : []],
    ['processing', research.processing.value ? [research.processing.value] : []],
    ['tastingNote', research.tastingNotes.value ?? []],
    ['origin', research.producer.value ? [research.producer.value.line1, research.producer.value.line2] : []],
  ]);
}

function fallbackSpecificAnchor(research: CoffeeResearchResult): ConceptAnchor {
  const candidates: ConceptAnchor[] = [
    ...(research.tastingNotes.value ?? []).map((value) => ({ field: 'tastingNote' as const, value })),
    ...(research.processing.value ? [{ field: 'processing' as const, value: research.processing.value }] : []),
    ...(research.producer.value ? [
      { field: 'origin' as const, value: research.producer.value.line2 },
      { field: 'origin' as const, value: research.producer.value.line1 },
    ] : []),
    ...(research.coffeeName.value ? [{ field: 'coffeeName' as const, value: research.coffeeName.value }] : []),
  ].filter((anchor) => anchor.value.trim());
  const shortest = candidates.sort((first, second) => first.value.length - second.value.length)[0];
  if (!shortest) throw new Error('A second verified coffee fact is required before creating a color concept.');
  return shortest;
}

function normalizeEvidence(
  anchors: readonly ConceptAnchor[],
  research: CoffeeResearchResult,
  story: string,
): { anchors: readonly ConceptAnchor[]; story: string } {
  const allowed = allowedValues(research);
  const variety = research.variety.value;
  if (!variety) throw new Error('A verified variety is required before creating a color concept.');

  const canonical = anchors.flatMap((anchor): ConceptAnchor[] => {
    const exact = allowed.get(anchor.field)?.find((value) => comparable(value) === comparable(anchor.value));
    return exact ? [{ field: anchor.field, value: exact }] : [];
  });
  const unique = [...new Map(canonical.map((anchor) => [`${anchor.field}:${comparable(anchor.value)}`, anchor])).values()];
  const varietyAnchor: ConceptAnchor = { field: 'variety', value: variety };
  const specificAnchors = unique.filter((anchor) => anchor.field !== 'variety');
  const specific = specificAnchors[0] ?? fallbackSpecificAnchor(research);
  const normalizedAnchors = Object.freeze([
    varietyAnchor,
    specific,
    ...specificAnchors.slice(1, 3),
  ]);

  const normalizedStory = comparable(story);
  if (normalizedStory.includes(comparable(variety)) && normalizedStory.includes(comparable(specific.value))) {
    return { anchors: normalizedAnchors, story: story.trim() };
  }

  return {
    anchors: normalizedAnchors,
    story: `${variety} meets ${specific.value} in this restrained, coffee-specific label color.`.slice(0, 220),
  };
}

function slug(value: string, index: number): string {
  const normalized = value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLocaleLowerCase();
  return `${normalized || 'coffee-color'}-${index + 1}`;
}

function normalizeColor(
  raw: RawConceptColor,
  role: ColorCandidate['role'],
  index: number,
  research: CoffeeResearchResult,
): LabelConceptColor {
  const evidence = normalizeEvidence(raw.anchors, research, raw.story);
  const resolution = resolveBackgroundColor(raw.requestedHex);
  if (!resolution.finalHex || !resolution.validation.metrics || resolution.status === 'rejected') {
    throw new Error(`Color ${raw.requestedHex} cannot be corrected to the Monoblend print-safe range.`);
  }
  return Object.freeze({
    id: slug(raw.name, index),
    role,
    name: raw.name.trim().toLocaleUpperCase(),
    requestedHex: raw.requestedHex.toLocaleUpperCase(),
    hex: resolution.finalHex,
    story: evidence.story,
    profile: evidence.story,
    anchors: Object.freeze(evidence.anchors.map((anchor) => Object.freeze({ ...anchor }))),
    resolution: resolution.status,
    metrics: resolution.validation.metrics,
  });
}

function distinctFrom(color: string, accepted: readonly LabelConceptColor[]): boolean {
  return accepted.every((candidate) => colorDistance(color, candidate.hex) >= MINIMUM_COLOR_DISTANCE);
}

function withAdjustedColor(color: LabelConceptColor, requestedHex: string): LabelConceptColor | null {
  const resolution = resolveBackgroundColor(requestedHex);
  if (!resolution.finalHex || !resolution.validation.metrics || resolution.status === 'rejected') return null;
  return Object.freeze({
    ...color,
    hex: resolution.finalHex,
    resolution: resolution.finalHex === color.hex ? color.resolution : 'adjusted',
    metrics: resolution.validation.metrics,
  });
}

function closestDistinctColor(
  color: LabelConceptColor,
  accepted: readonly LabelConceptColor[],
): LabelConceptColor | null {
  if (distinctFrom(color.hex, accepted)) return color;
  const rgb = hexToRgb(color.hex);
  if (!rgb) return null;
  const original = rgbToHsl(rgb);
  const hueOffsets = Array.from({ length: 24 }, (_, index) => {
    if (index === 0) return 0;
    const distance = Math.ceil(index / 2) * 15;
    return index % 2 === 1 ? distance : -distance;
  });
  const saturations = [Math.max(original.saturation, 0.34), 0.42, 0.28];
  const lightnesses = [original.lightness, 0.32, 0.38, 0.26];

  for (const hueOffset of hueOffsets) {
    for (const saturation of saturations) {
      for (const lightness of lightnesses) {
        const candidate = withAdjustedColor(color, hslToHex({
          hue: original.hue + hueOffset,
          saturation,
          lightness,
        }));
        if (candidate && distinctFrom(candidate.hex, accepted)) return candidate;
      }
    }
  }
  return null;
}

function evenlySpacedPalette(colors: readonly LabelConceptColor[]): readonly LabelConceptColor[] {
  const rgb = hexToRgb(colors[0].hex);
  const baseHue = rgb ? rgbToHsl(rgb).hue : 0;
  return Object.freeze(colors.map((color, index) => {
    const candidate = withAdjustedColor(color, hslToHex({
      hue: baseHue + index * 90,
      saturation: 0.34,
      lightness: 0.32,
    }));
    if (!candidate) throw new Error('The print-safe fallback palette could not be created.');
    return candidate;
  }));
}

function ensureDistinctPalette(colors: readonly LabelConceptColor[]): readonly LabelConceptColor[] {
  const accepted: LabelConceptColor[] = [];
  for (const color of colors) {
    const distinct = closestDistinctColor(color, accepted);
    if (!distinct) return evenlySpacedPalette(colors);
    accepted.push(distinct);
  }
  return Object.freeze(accepted);
}

export function normalizeLabelConcept(
  raw: RawLabelConcept,
  research: CoffeeResearchResult,
  provider: LabelConceptResponse['meta']['provider'],
  model: string,
): LabelConceptResponse {
  const colors = ensureDistinctPalette([
    normalizeColor(raw.recommended, 'suggested', 0, research),
    ...raw.alternatives.map((color, index) => normalizeColor(color, 'alternative', index + 1, research)),
  ]);

  const alternatives = Object.freeze([colors[1], colors[2], colors[3]] as const);

  return Object.freeze({
    recommended: colors[0],
    alternatives,
    meta: Object.freeze({ provider, model, generatedAt: new Date().toISOString() }),
  });
}
