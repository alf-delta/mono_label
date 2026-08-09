import assert from 'node:assert/strict';
import test from 'node:test';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  coffeeResearchModelOutputSchema,
  coffeeResearchResultSchema,
} from '../src/research/research-schema';

const result = {
  coffeeName: { value: 'Geisha Elkin Arcila', confidence: 'high', sources: ['not-a-url'] },
  variety: { value: 'Geisha', confidence: 'high', sources: [] },
  processing: { value: 'Honey', confidence: 'medium', sources: [] },
  altitude: { value: '1800', confidence: 'medium', sources: [] },
  producer: { value: { line1: 'COLOMBIA', line2: 'TÁMESIS' }, confidence: 'high', sources: [] },
  tastingNotes: { value: ['tangerine', 'peach'], confidence: 'medium', sources: [] },
  brewMethod: { value: 'pourover', confidence: 'medium', sources: [] },
  summary: 'A floral Colombian Geisha.',
};

test('the OpenAI response schema contains no unsupported URI format', () => {
  const format = JSON.stringify(zodTextFormat(coffeeResearchModelOutputSchema, 'coffee_research'));
  assert.equal(format.includes('"format":"uri"'), false);
});

test('server validation still rejects invalid source URLs', () => {
  assert.equal(coffeeResearchModelOutputSchema.safeParse(result).success, true);
  assert.equal(coffeeResearchResultSchema.safeParse(result).success, false);
});
