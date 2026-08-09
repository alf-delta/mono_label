import { normalizeResearchResult } from '../../src/research/normalize-research';
import type { ResearchRequest, ResearchResponse } from '../../src/research/research-types';
import type { ProviderRequestContext, ResearchProvider } from './provider-types';
import { normalizeLabelConcept } from '../../src/concept/normalize-label-concept';
import type { LabelConceptRequest, LabelConceptResponse } from '../../src/concept/concept-types';

export class ResearchService {
  constructor(private readonly provider: ResearchProvider) {}

  get configured(): boolean {
    return this.provider.configured;
  }

  get providerName(): ResearchProvider['name'] {
    return this.provider.name;
  }

  async research(request: ResearchRequest, context?: ProviderRequestContext): Promise<ResearchResponse> {
    const response = await this.provider.research(request, context);
    return Object.freeze({
      result: normalizeResearchResult(response.raw, response.sources),
      sources: response.sources,
      meta: Object.freeze({
        provider: this.provider.name,
        model: response.model,
        researchedAt: new Date().toISOString(),
      }),
    });
  }

  async createLabelConcept(request: LabelConceptRequest, context?: ProviderRequestContext): Promise<LabelConceptResponse> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.provider.createLabelConcept(request, context);
        return normalizeLabelConcept(response.raw, request.research, this.provider.name, response.model);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('The color concept could not be validated.');
  }
}
