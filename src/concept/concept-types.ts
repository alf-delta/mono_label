import type { ColorCandidate } from '../color/color-types.js';
import type { CoffeeResearchResult } from '../research/research-types.js';

export const CONCEPT_ANCHOR_FIELDS = [
  'coffeeName',
  'variety',
  'processing',
  'tastingNote',
  'origin',
] as const;

export type ConceptAnchorField = (typeof CONCEPT_ANCHOR_FIELDS)[number];

export interface ConceptAnchor {
  field: ConceptAnchorField;
  value: string;
}

export interface LabelConceptRequest {
  research: CoffeeResearchResult;
}

export interface LabelConceptColor extends ColorCandidate {
  requestedHex: string;
  story: string;
  anchors: readonly ConceptAnchor[];
}

export interface LabelConceptResponse {
  recommended: LabelConceptColor;
  alternatives: readonly [LabelConceptColor, LabelConceptColor, LabelConceptColor];
  meta: {
    provider: 'openai' | 'fixture';
    model: string;
    generatedAt: string;
  };
}

export interface LabelConceptApiError {
  error: {
    code: 'INVALID_CONCEPT_REQUEST' | 'CONCEPT_NOT_CONFIGURED' | 'CONCEPT_FAILED' | 'METHOD_NOT_ALLOWED' | 'RATE_LIMITED';
    message: string;
    requestId?: string;
  };
}

export function conceptColors(concept: LabelConceptResponse): readonly LabelConceptColor[] {
  return Object.freeze([concept.recommended, ...concept.alternatives]);
}
