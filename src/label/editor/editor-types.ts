export type EditableLabelField =
  | 'variety'
  | 'processing'
  | 'altitude'
  | 'producer'
  | 'coffeeName'
  | 'tastingNotes'
  | 'brewMethod'
  | 'backgroundColor';

export const EDITABLE_FIELD_LABELS: Record<EditableLabelField, string> = {
  variety: 'Variety',
  processing: 'Processing',
  altitude: 'Altitude',
  producer: 'Producer / location',
  coffeeName: 'Coffee name',
  tastingNotes: 'Tasting notes',
  brewMethod: 'Best for',
  backgroundColor: 'Background color',
};
