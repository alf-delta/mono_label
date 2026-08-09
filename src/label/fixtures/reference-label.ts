import type { CoffeeLabel, CoffeeLabelInput } from '../../types/coffee-label';
import { normalizeCoffeeLabel } from '../data/normalize-coffee-label';

export interface LabelFixture<TId extends string = string> {
  id: TId;
  name: string;
  description: string;
  input: CoffeeLabelInput;
  label: CoffeeLabel;
}

export function createLabelFixture<TId extends string>(
  id: TId,
  name: string,
  description: string,
  input: CoffeeLabelInput,
): LabelFixture<TId> {
  return Object.freeze({ id, name, description, input, label: normalizeCoffeeLabel(input) });
}

export const REFERENCE_FIXTURE = createLabelFixture(
  'reference',
  'Reference · Pourover',
  'The calibrated Geisha label supplied as the visual reference.',
  {
    coffeeName: ' Geisha Elkin Arcila ',
    variety: 'Geisha',
    processing: 'Honey',
    altitude: '1800',
    producer: { line1: 'Colombia', line2: 'Támesis' },
    tastingNotes: ['Tangerine', 'Peach', 'Jasmine', 'Honey'],
    brewMethod: 'pourover',
    backgroundColor: '#7a4c5a',
  },
);

export const REFERENCE_LABEL = REFERENCE_FIXTURE.label;

