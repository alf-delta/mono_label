import assert from 'node:assert/strict';
import test from 'node:test';
import type { RawLabelConcept } from '../src/concept/concept-schema';
import { normalizeLabelConcept } from '../src/concept/normalize-label-concept';
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

test('unsupported research anchors are rejected', async () => {
  const { research, raw } = await fixtureData();
  const invalid = structuredClone(raw) as RawLabelConcept;
  invalid.recommended.anchors[1].value = 'unsupported-note';

  assert.throws(
    () => normalizeLabelConcept(invalid, research, 'fixture', 'fixture-model'),
    /must cite the verified variety/,
  );
});

test('concept stories must explicitly name their evidence', async () => {
  const { research, raw } = await fixtureData();
  const invalid = structuredClone(raw) as RawLabelConcept;
  invalid.recommended.story = 'A beautiful and expressive direction created exclusively for this exceptional coffee lot.';

  assert.throws(
    () => normalizeLabelConcept(invalid, research, 'fixture', 'fixture-model'),
    /must cite the verified variety/,
  );
});

test('visually duplicate palette directions are rejected', async () => {
  const { research, raw } = await fixtureData();
  const invalid = structuredClone(raw) as RawLabelConcept;
  for (const alternative of invalid.alternatives) alternative.requestedHex = invalid.recommended.requestedHex;

  assert.throws(
    () => normalizeLabelConcept(invalid, research, 'fixture', 'fixture-model'),
    /not visually distinct/,
  );
});
