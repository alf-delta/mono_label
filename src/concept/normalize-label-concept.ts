import { resolveBackgroundColor } from '../color/color-engine';
import { colorDistance } from '../color/color-math';
import type { ColorCandidate } from '../color/color-types';
import type { CoffeeResearchResult } from '../research/research-types';
import type { RawConceptColor, RawLabelConcept } from './concept-schema';
import type { ConceptAnchor, ConceptAnchorField, LabelConceptColor, LabelConceptResponse } from './concept-types';

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

function validateAnchors(anchors: readonly ConceptAnchor[], research: CoffeeResearchResult, story: string): void {
  const allowed = allowedValues(research);
  const variety = research.variety.value;
  if (!variety) throw new Error('A verified variety is required before creating a color concept.');

  const valid = anchors.every((anchor) => (
    allowed.get(anchor.field)?.some((value) => comparable(value) === comparable(anchor.value))
  ));
  const hasVariety = anchors.some((anchor) => anchor.field === 'variety' && comparable(anchor.value) === comparable(variety));
  const specificAnchors = anchors.filter((anchor) => anchor.field !== 'variety');
  const normalizedStory = comparable(story);
  const storyNamesVariety = normalizedStory.includes(comparable(variety));
  const storyNamesSpecificDetail = specificAnchors.some((anchor) => normalizedStory.includes(comparable(anchor.value)));
  if (!valid || !hasVariety || specificAnchors.length === 0 || !storyNamesVariety || !storyNamesSpecificDetail) {
    throw new Error('Every color concept must cite the verified variety and one additional coffee fact.');
  }
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
  validateAnchors(raw.anchors, research, raw.story);
  const resolution = resolveBackgroundColor(raw.requestedHex);
  if (!resolution.finalHex || !resolution.validation.metrics || resolution.status === 'rejected') {
    throw new Error(`Color ${raw.requestedHex} cannot be corrected to the Monoblend print-safe range.`);
  }
  const story = raw.story.trim();
  return Object.freeze({
    id: slug(raw.name, index),
    role,
    name: raw.name.trim().toLocaleUpperCase(),
    requestedHex: raw.requestedHex.toLocaleUpperCase(),
    hex: resolution.finalHex,
    story,
    profile: story,
    anchors: Object.freeze(raw.anchors.map((anchor) => Object.freeze({ ...anchor }))),
    resolution: resolution.status,
    metrics: resolution.validation.metrics,
  });
}

export function normalizeLabelConcept(
  raw: RawLabelConcept,
  research: CoffeeResearchResult,
  provider: LabelConceptResponse['meta']['provider'],
  model: string,
): LabelConceptResponse {
  const colors = [
    normalizeColor(raw.recommended, 'suggested', 0, research),
    ...raw.alternatives.map((color, index) => normalizeColor(color, 'alternative', index + 1, research)),
  ] as const;

  for (let first = 0; first < colors.length; first += 1) {
    for (let second = first + 1; second < colors.length; second += 1) {
      if (colorDistance(colors[first].hex, colors[second].hex) < MINIMUM_COLOR_DISTANCE) {
        throw new Error('The generated color directions are not visually distinct enough.');
      }
    }
  }

  const alternatives = Object.freeze([colors[1], colors[2], colors[3]] as const);

  return Object.freeze({
    recommended: colors[0],
    alternatives,
    meta: Object.freeze({ provider, model, generatedAt: new Date().toISOString() }),
  });
}
