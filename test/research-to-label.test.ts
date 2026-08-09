import assert from 'node:assert/strict';
import test from 'node:test';
import { researchResultToLabelInput } from '../src/research/research-to-label';
import type { ResearchResponse } from '../src/research/research-types';

const field = <T>(value: T) => ({ value, confidence: 'medium' as const, sources: [] });

test('verbose research is converted into calibrated label copy', () => {
  const response: ResearchResponse = {
    result: {
      coffeeName: field('Wush Wush Las Nubes'),
      variety: field('Wush Wush'),
      processing: field('Anaerobic Natural; 150-hour anaerobic fermentation'),
      altitude: field('1,950–2,000 m.a.s.l.'),
      producer: field({
        line1: 'Marco Echeverry',
        line2: 'Finca Las Nubes — Salento, Quindío, Colombia',
      }),
      tastingNotes: field(['cacao nibs', 'chamomile', 'yellow tropical fruit', 'brown spice', 'currant']),
      brewMethod: field('pourover'),
      summary: 'Fixture',
    },
    sources: [],
    meta: { provider: 'fixture', model: 'fixture', researchedAt: new Date(0).toISOString() },
  };

  assert.deepEqual(researchResultToLabelInput(response, '#48634C'), {
    coffeeName: 'Wush Wush Las Nubes',
    variety: 'Wush Wush',
    processing: 'Anaerobic Natural',
    altitude: '1950–2000',
    producer: { line1: 'Marco Echeverry', line2: 'Finca Las Nubes' },
    tastingNotes: ['cacao nibs', 'chamomile', 'tropical fruit'],
    brewMethod: 'pourover',
    backgroundColor: '#48634C',
  });
});
