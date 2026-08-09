import assert from 'node:assert/strict';
import test from 'node:test';
import type { RawLabelConcept } from '../src/concept/concept-schema';
import { normalizeLabelConcept } from '../src/concept/normalize-label-concept';
import { colorDistance } from '../src/color/color-math';
import { FixtureResearchProvider } from '../server/research/fixture-provider';
import { ResearchService } from '../server/research/research-service';

async function fixtureData() {
  const provider = new FixtureResearchProvider();
  const service = new ResearchService(provider);
  const research = (await service.research({ coffeeName: 'Geisha Elkin Arcila', producer: 'Elkin Arcila' })).result;
  const concept = await provider.createLabelConcept({ research });
  return { research, raw: concept.raw };
}

test('fixture concepts normalize to four distinct, verified directions', async () => {
  const { research, raw } = await fixtureData();
  const result = normalizeLabelConcept(raw, research, 'fixture', 'fixture-model');
  const colors = [result.recommended, ...result.alternatives];

  assert.equal(colors.length, 4);
  assert.equal(new Set(colors.map((color) => color.hex)).size, 4);
  for (const color of colors) {
    assert.ok(color.anchors.some((anchor) => anchor.field === 'variety' && anchor.value === 'Geisha'));
    assert.equal(color.metrics.contrastRatio >= 4.5, true);
  }
});

test('unsupported research anchors are repaired from verified facts', async () => {
  const { research, raw } = await fixtureData();
  const invalid = structuredClone(raw) as RawLabelConcept;
  invalid.recommended.anchors[1].value = 'unsupported-note';

  const result = normalizeLabelConcept(invalid, research, 'fixture', 'fixture-model');
  assert.ok(result.recommended.anchors.some((anchor) => anchor.field !== 'variety' && anchor.value !== 'unsupported-note'));
});

test('concept stories missing their evidence are repaired', async () => {
  const { research, raw } = await fixtureData();
  const invalid = structuredClone(raw) as RawLabelConcept;
  invalid.recommended.story = 'A beautiful and expressive direction created exclusively for this exceptional coffee lot.';

  const result = normalizeLabelConcept(invalid, research, 'fixture', 'fixture-model');
  assert.match(result.recommended.story, /Geisha/);
  assert.ok(result.recommended.anchors.some((anchor) => result.recommended.story.includes(anchor.value)));
});

test('visually duplicate palette directions are separated automatically', async () => {
  const { research, raw } = await fixtureData();
  const invalid = structuredClone(raw) as RawLabelConcept;
  for (const alternative of invalid.alternatives) alternative.requestedHex = invalid.recommended.requestedHex;

  const result = normalizeLabelConcept(invalid, research, 'fixture', 'fixture-model');
  const colors = [result.recommended, ...result.alternatives];
  for (let first = 0; first < colors.length; first += 1) {
    for (let second = first + 1; second < colors.length; second += 1) {
      assert.ok(colorDistance(colors[first].hex, colors[second].hex) >= 30);
    }
  }
});
