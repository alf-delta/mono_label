import { resolveBackgroundColor } from './color-engine';
import type { ColorCandidate, NamedColor } from './color-types';

interface CandidateDefinition extends NamedColor {
  id: string;
  role: ColorCandidate['role'];
  profile: string;
}

const DEFINITIONS: readonly CandidateDefinition[] = [
  { id: 'geisha-purple', name: 'GEISHA PURPLE', hex: '#7A4C5A', role: 'suggested', profile: 'Floral · stone fruit' },
  { id: 'pink-bourbon-rose', name: 'PINK BOURBON ROSE', hex: '#754556', role: 'alternative', profile: 'Red fruit · honey' },
  { id: 'sidra-green', name: 'SIDRA GREEN', hex: '#3F5B4B', role: 'alternative', profile: 'Herbal · citrus' },
  { id: 'honey-ochre', name: 'HONEY OCHRE', hex: '#6D5338', role: 'alternative', profile: 'Caramel · cacao' },
  { id: 'washed-blue', name: 'WASHED BLUE', hex: '#40556C', role: 'alternative', profile: 'Clean · bright' },
];

function createCandidate(definition: CandidateDefinition): ColorCandidate {
  const resolution = resolveBackgroundColor(definition.hex);
  if (!resolution.finalHex || !resolution.validation.metrics || resolution.status === 'rejected') {
    throw new Error(`Configured color ${definition.id} does not satisfy COLOR_RULES.`);
  }
  return Object.freeze({
    ...definition,
    hex: resolution.finalHex,
    resolution: resolution.status,
    metrics: resolution.validation.metrics,
  });
}

export const COLOR_CANDIDATES = Object.freeze(DEFINITIONS.map(createCandidate));
export const SUGGESTED_COLOR = COLOR_CANDIDATES.find((candidate) => candidate.role === 'suggested')!;
export const ALTERNATIVE_COLORS = Object.freeze(COLOR_CANDIDATES.filter((candidate) => candidate.role === 'alternative'));

export function findNamedColor(hex: string): NamedColor | null {
  const normalized = hex.trim().toLocaleUpperCase();
  const candidate = COLOR_CANDIDATES.find((item) => item.hex === normalized);
  return candidate ? { name: candidate.name, hex: candidate.hex } : null;
}

export function findColorCandidateById(id: string): ColorCandidate | null {
  return COLOR_CANDIDATES.find((candidate) => candidate.id === id) ?? null;
}
