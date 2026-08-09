import type { RawCoffeeResearchResult } from '../../src/research/research-schema';
import type { ResearchRequest, ResearchSource } from '../../src/research/research-types';
import type { RawLabelConcept } from '../../src/concept/concept-schema';
import type { LabelConceptRequest } from '../../src/concept/concept-types';

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
