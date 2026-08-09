import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBackgroundColor, validateBackgroundColor } from '../src/color/color-engine';

test('the calibrated reference color stays unchanged', () => {
  const result = resolveBackgroundColor('#7A4C5A');
  assert.equal(result.status, 'approved');
  assert.equal(result.finalHex, '#7A4C5A');
  assert.equal(result.validation.valid, true);
});

test('a correctable color is moved into the print-safe range', () => {
  const result = resolveBackgroundColor('#CC88A0');
  assert.equal(result.status, 'adjusted');
  assert.ok(result.finalHex);
  assert.equal(validateBackgroundColor(result.finalHex).valid, true);
});

test('a muted AI color survives RGB rounding at the saturation boundary', () => {
  const result = resolveBackgroundColor('#3F5145');
  assert.equal(result.status, 'adjusted');
  assert.ok(result.finalHex);
  assert.equal(validateBackgroundColor(result.finalHex).valid, true);
});

test('invalid hex values are rejected without a fallback color', () => {
  const result = resolveBackgroundColor('mulberry');
  assert.equal(result.status, 'rejected');
  assert.equal(result.finalHex, null);
});
