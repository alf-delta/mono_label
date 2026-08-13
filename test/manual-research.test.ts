import assert from 'node:assert/strict';
import test from 'node:test';
import { createManualResearch } from '../src/research/manual-research';

test('manual entry creates a complete review response without invoking research', () => {
  const { request, response } = createManualResearch({
    coffeeName: '  King Arthur Geisha  ',
    variety: 'Geisha',
    processing: 'Honey',
    altitude: '1800 masl',
    originLine1: 'Colombia',
    originLine2: 'Támesis',
    tastingNotes: 'tangerine, peach · jasmine; honey',
    brewMethod: 'pourover',
  });

  assert.equal(request.entryMode, 'manual');
  assert.equal(request.coffeeName, 'King Arthur Geisha');
  assert.equal(response.meta.provider, 'manual');
  assert.deepEqual(response.result.tastingNotes.value, ['tangerine', 'peach', 'jasmine', 'honey']);
  assert.deepEqual(response.result.producer.value, { line1: 'Colombia', line2: 'Támesis' });
  assert.deepEqual(response.sources, []);
});
