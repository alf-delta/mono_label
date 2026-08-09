import type { CoffeeResearchResult, Confidence, ResearchSource, SourcedResearchField } from './research-types.js';
import type { RawCoffeeResearchResult } from './research-schema.js';

function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeSources(values: readonly string[], consultedUrls: ReadonlySet<string>): readonly string[] {
  const normalized = values
    .map(normalizeUrl)
    .filter((url): url is string => url !== null && consultedUrls.has(url));
  return Object.freeze([...new Set(normalized)]);
}

function normalizeConfidence<T>(value: T | null, confidence: Confidence, sources: readonly string[]): Confidence {
  if (value === null || sources.length === 0) return 'unknown';
  if (sources.length === 1 && confidence === 'high') return 'medium';
  return confidence;
}

function normalizeField<T>(
  field: SourcedResearchField<T>,
  consultedUrls: ReadonlySet<string>,
): SourcedResearchField<T> {
  const sources = normalizeSources(field.sources, consultedUrls);
  return Object.freeze({
    value: field.value,
    confidence: normalizeConfidence(field.value, field.confidence, sources),
    sources,
  });
}

export function normalizeResearchResult(
  raw: RawCoffeeResearchResult,
  consultedSources: readonly ResearchSource[],
): CoffeeResearchResult {
  const consultedUrls = new Set(
    consultedSources.map((source) => normalizeUrl(source.url)).filter((url): url is string => url !== null),
  );

  return Object.freeze({
    coffeeName: normalizeField(raw.coffeeName, consultedUrls),
    variety: normalizeField(raw.variety, consultedUrls),
    processing: normalizeField(raw.processing, consultedUrls),
    altitude: normalizeField(raw.altitude, consultedUrls),
    producer: normalizeField(raw.producer, consultedUrls),
    tastingNotes: normalizeField(raw.tastingNotes, consultedUrls),
    brewMethod: normalizeField(raw.brewMethod, consultedUrls),
    summary: raw.summary.trim(),
  });
}

export function unresolvedResearchFields(result: CoffeeResearchResult): readonly string[] {
  const required = [
    ['coffeeName', result.coffeeName],
    ['variety', result.variety],
    ['processing', result.processing],
    ['altitude', result.altitude],
    ['producer', result.producer],
    ['tastingNotes', result.tastingNotes],
    ['brewMethod', result.brewMethod],
  ] as const;

  return Object.freeze(required
    .filter(([, field]) => field.value === null || field.confidence === 'unknown')
    .map(([name]) => name));
}
