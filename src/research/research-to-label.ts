import type { CoffeeLabelInput } from '../types/coffee-label.js';
import type { ResearchResponse } from './research-types.js';

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function limitWords(value: string, maximumLength: number): string {
  const normalized = collapseWhitespace(value);
  if (normalized.length <= maximumLength) return normalized;
  const words = normalized.split(' ');
  let result = '';
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > maximumLength) break;
    result = candidate;
  }
  return result || normalized.slice(0, maximumLength).trim();
}

function firstLabelClause(value: string): string {
  return collapseWhitespace(value).split(/\s*(?:;|\||\s[—–]\s|\()\s*/u)[0]?.trim() ?? '';
}

function compactAltitude(value: string): string {
  const numbers = collapseWhitespace(value)
    .match(/\d[\d,.]*/g)
    ?.map((number) => number.replace(/[,.]/g, ''))
    .filter(Boolean) ?? [];
  if (numbers.length >= 2) return `${numbers[0]}–${numbers[1]}`;
  if (numbers.length === 1) return numbers[0];
  return limitWords(value, 12);
}

function compactProducerLine(value: string): string {
  return limitWords(firstLabelClause(value), 20);
}

const NOTE_DESCRIPTORS = new Set(['bright', 'brown', 'candied', 'dark', 'dried', 'fresh', 'golden', 'green', 'juicy', 'milk', 'red', 'ripe', 'sweet', 'white', 'yellow']);

function compactNote(value: string): string {
  const words = collapseWhitespace(value).split(' ');
  const withoutDescriptor = words.length > 2 && NOTE_DESCRIPTORS.has(words[0].toLocaleLowerCase())
    ? words.slice(1)
    : words;
  return limitWords(withoutDescriptor.join(' '), 18);
}

function compactTastingNotes(values: readonly string[]): readonly string[] {
  const notes: string[] = [];
  for (const value of values) {
    const note = compactNote(value);
    if (!note || notes.some((existing) => existing.toLocaleLowerCase() === note.toLocaleLowerCase())) continue;
    const candidate = [...notes, note].join(' · ');
    if (candidate.length > 50 || notes.length >= 4) break;
    notes.push(note);
  }
  return Object.freeze(notes);
}

/** Converts complete research facts into concise values that fit the calibrated print label. */
export function researchResultToLabelInput(
  response: ResearchResponse,
  backgroundColor: string,
): CoffeeLabelInput {
  const result = response.result;
  return {
    coffeeName: limitWords(result.coffeeName.value ?? '', 32),
    variety: limitWords(result.variety.value ?? '', 20),
    processing: limitWords(firstLabelClause(result.processing.value ?? ''), 20),
    altitude: compactAltitude(result.altitude.value ?? ''),
    producer: {
      line1: compactProducerLine(result.producer.value?.line1 ?? ''),
      line2: compactProducerLine(result.producer.value?.line2 ?? ''),
    },
    tastingNotes: compactTastingNotes(result.tastingNotes.value ?? []),
    brewMethod: result.brewMethod.value ?? 'pourover',
    backgroundColor,
  };
}
