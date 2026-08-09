import type { LabelFixture } from './reference-label';
import { createLabelFixture, REFERENCE_FIXTURE } from './reference-label';

export type DeveloperFixtureId = 'reference' | 'espresso' | 'shrink' | 'long-copy' | 'invalid-color';

const ESPRESSO_FIXTURE = createLabelFixture(
  'espresso',
  'Espresso icon test',
  'A compact developer fixture for the wide espresso SVG asset.',
  {
    coffeeName: 'Espresso Test Lot',
    variety: 'Caturra',
    processing: 'Natural',
    altitude: '1650',
    producer: { line1: 'Brazil', line2: 'Minas Gerais' },
    tastingNotes: ['cacao', 'caramel', 'hazelnut'],
    brewMethod: 'espresso',
    backgroundColor: '#345A50',
    netWeight: '250 g',
  },
);

const SHRINK_FIXTURE = createLabelFixture(
  'shrink',
  'Bounded shrink test',
  'A near-limit title that must fit without crossing its minimum font size.',
  {
    coffeeName: 'Elkin Arcila Geisha Reserve',
    variety: 'Geisha',
    processing: 'Honey',
    altitude: '1800',
    producer: { line1: 'Colombia', line2: 'Támesis' },
    tastingNotes: ['tangerine', 'peach', 'jasmine', 'honey'],
    brewMethod: 'pourover',
    backgroundColor: '#7A4C5A',
  },
);

const LONG_COPY_FIXTURE = createLabelFixture(
  'long-copy',
  'Long-copy stress test',
  'Intentionally long content for the typography validation milestone.',
  {
    coffeeName: 'Exceptional Pink Bourbon Selection',
    variety: 'Pink Bourbon Selection',
    processing: 'Extended Anaerobic Honey',
    altitude: '1850–2050',
    producer: { line1: 'Colombia', line2: 'Huila Department' },
    tastingNotes: ['blood orange', 'white peach', 'orange blossom', 'raw honey'],
    brewMethod: 'pourover',
    backgroundColor: '#5B466F',
  },
);

const INVALID_COLOR_FIXTURE = createLabelFixture(
  'invalid-color',
  'Invalid color test',
  'An intentionally pale background that must fail deterministic color validation.',
  {
    coffeeName: 'Color Validation Lot',
    variety: 'Geisha',
    processing: 'Washed',
    altitude: '1900',
    producer: { line1: 'Colombia', line2: 'Huila' },
    tastingNotes: ['bergamot', 'white peach', 'jasmine'],
    brewMethod: 'pourover',
    backgroundColor: '#F4F0DC',
  },
);

export const DEVELOPER_LABEL_FIXTURES = Object.freeze({
  reference: REFERENCE_FIXTURE,
  espresso: ESPRESSO_FIXTURE,
  shrink: SHRINK_FIXTURE,
  'long-copy': LONG_COPY_FIXTURE,
  'invalid-color': INVALID_COLOR_FIXTURE,
});

export const DEVELOPER_LABEL_FIXTURE_LIST = Object.freeze(Object.values(DEVELOPER_LABEL_FIXTURES));

export function isDeveloperFixtureId(value: string | null): value is DeveloperFixtureId {
  return value !== null && value in DEVELOPER_LABEL_FIXTURES;
}

interface DeveloperFixturePickerProps {
  fixtures: readonly LabelFixture[];
  selectedId: DeveloperFixtureId;
  onChange: (fixtureId: DeveloperFixtureId) => void;
}

export function DeveloperFixturePicker({ fixtures, selectedId, onChange }: DeveloperFixturePickerProps) {
  const selected = fixtures.find((item) => item.id === selectedId) ?? fixtures[0];

  return (
    <section className="fixture-picker" aria-label="Developer label fixture">
      <label htmlFor="fixture-select">Developer fixture</label>
      <select
        id="fixture-select"
        value={selectedId}
        onChange={(event) => onChange(event.target.value as DeveloperFixtureId)}
      >
        {fixtures.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <p>{selected.description}</p>
    </section>
  );
}
