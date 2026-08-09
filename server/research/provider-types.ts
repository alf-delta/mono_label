import type { RawCoffeeResearchResult } from '../../src/research/research-schema.js';
import type { ResearchRequest, ResearchSource } from '../../src/research/research-types.js';
import type { RawLabelConcept } from '../../src/concept/concept-schema.js';
import type { LabelConceptRequest } from '../../src/concept/concept-types.js';

export interface ProviderRequestContext {
  safetyIdentifier?: string;
}

export interface ResearchProviderResult {
  raw: RawCoffeeResearchResult;
  sources: readonly ResearchSource[];
  model: string;
  responseId?: string;
}

export interface ResearchProvider {
  readonly name: 'openai' | 'fixture';
  readonly configured: boolean;
  research(request: ResearchRequest, context?: ProviderRequestContext): Promise<ResearchProviderResult>;
  createLabelConcept(request: LabelConceptRequest, context?: ProviderRequestContext): Promise<{ raw: RawLabelConcept; model: string }>;
}
