import type { CoffeeLabel } from '../../types/coffee-label';
import type { TemplateBox } from '../templates/template-types';

export function transformCase(value: string, box: TemplateBox): string {
  if (box.caseTransform === 'uppercase') return value.toLocaleUpperCase();
  if (box.caseTransform === 'lowercase') return value.toLocaleLowerCase();
  return value;
}

export function tastingNotesText(notes: CoffeeLabel['tastingNotes']): string {
  return notes.map((note) => note.toLocaleLowerCase()).join(' · ');
}

