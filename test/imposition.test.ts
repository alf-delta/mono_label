import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateImposition } from '../src/export/imposition';
import { DEFAULT_EXPORT_SETTINGS } from '../src/export/print-formats';
import { COFFEE_LABEL_V1 } from '../src/label/templates/coffee-label-v1';

test('known sheet formats preserve their calibrated maximum quantities', () => {
  const expected = new Map([
    ['a4', 2],
    ['a3', 8],
    ['us-letter', 4],
    ['us-tabloid', 8],
  ] as const);

  for (const [formatId, maximum] of expected) {
    const result = calculateImposition(COFFEE_LABEL_V1, { ...DEFAULT_EXPORT_SETTINGS, formatId });
    assert.equal(result.maximumQuantity, maximum, formatId);
    assert.equal(result.placements.length, maximum, formatId);
  }
});

test('A4 supports four labels at minimum marked clearance', () => {
  const result = calculateImposition(COFFEE_LABEL_V1, { ...DEFAULT_EXPORT_SETTINGS, marginMm: 3.1 });
  assert.equal(result.maximumQuantity, 4);
  assert.equal(result.quantity, 4);
});

test('custom quantities are capped and retain cutting geometry', () => {
  const result = calculateImposition(COFFEE_LABEL_V1, {
    ...DEFAULT_EXPORT_SETTINGS,
    formatId: 'a3',
    quantityMode: 'custom',
    quantity: 99,
  });
  assert.equal(result.quantity, result.maximumQuantity);
  assert.equal(result.verticalCuts.length, result.columns + 1);
  assert.equal(result.horizontalCuts.length, result.rows + 1);
  assert.ok(result.warnings.some((warning) => warning.includes('limited')));
});
