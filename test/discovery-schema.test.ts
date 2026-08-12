import assert from 'node:assert/strict';
import test from 'node:test';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  coffeeDiscoveryModelOutputSchema,
  rawCoffeeDiscoveryResultSchema,
} from '../src/discovery/discovery-schema';

const result = {
  canonicalVariety: 'Geisha',
  summary: 'One verified candidate.',
  candidates: [{
    coffeeName: 'King Arthur Geisha',
    variety: 'Geisha',
    producer: 'Elkin Arcila',
    farm: 'Finca Puerto Arturo',
    country: 'Colombia',
    region: 'Támesis',
    processing: 'Washed',
    harvest: '2022',
    sourceUrl: 'not-a-url',
  }],
};

test('the discovery model schema avoids unsupported URI formats', () => {
  const format = JSON.stringify(zodTextFormat(coffeeDiscoveryModelOutputSchema, 'coffee_discovery'));
  assert.equal(format.includes('"format":"uri"'), false);
});

test('discovery source URLs receive strict server-side validation', () => {
  assert.equal(coffeeDiscoveryModelOutputSchema.safeParse(result).success, true);
  assert.equal(rawCoffeeDiscoveryResultSchema.safeParse(result).success, false);
});
