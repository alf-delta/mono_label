import { normalizeResearchResult } from '../../src/research/normalize-research.js';
import type { ResearchRequest, ResearchResponse } from '../../src/research/research-types.js';
import type { ProviderRequestContext, ResearchProvider } from './provider-types.js';
import { normalizeLabelConcept } from '../../src/concept/normalize-label-concept.js';
import type { LabelConceptRequest, LabelConceptResponse } from '../../src/concept/concept-types.js';
import type { CoffeeDiscoveryRequest, CoffeeDiscoveryResponse } from '../../src/discovery/discovery-types.js';

function normalizedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export class ResearchService {
  constructor(private readonly provider: ResearchProvider) {}

  get configured(): boolean {
    return this.provider.configured;
  }

  get providerName(): ResearchProvider['name'] {
    return this.provider.name;
  }

  async discover(request: CoffeeDiscoveryRequest, context?: ProviderRequestContext): Promise<CoffeeDiscoveryResponse> {
    const response = await this.provider.discover(request, context);
    const sources = new Map(response.sources.flatMap((source) => {
      const url = normalizedUrl(source.url);
      return url ? [[url, source] as const] : [];
    }));
    const seen = new Set<string>();
    const candidates = response.raw.candidates.flatMap((candidate) => {
      const sourceUrl = normalizedUrl(candidate.sourceUrl);
      const source = sourceUrl ? sources.get(sourceUrl) : null;
      if (!sourceUrl || !source) return [];
      const key = `${candidate.coffeeName.toLocaleLowerCase()}|${candidate.producer.toLocaleLowerCase()}|${sourceUrl}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const sourceTitle = source.title.trim().slice(0, 240) || new URL(sourceUrl).hostname;
      return [{ ...candidate, sourceUrl, sourceTitle }];
    }).sort((first, second) => (
      first.country.localeCompare(second.country)
      || first.producer.localeCompare(second.producer)
      || first.coffeeName.localeCompare(second.coffeeName)
    ));

    return Object.freeze({
      canonicalVariety: response.raw.canonicalVariety.trim(),
      candidates: Object.freeze(candidates),
      summary: response.raw.summary.trim(),
      meta: Object.freeze({
        provider: this.provider.name,
        model: response.model,
        discoveredAt: new Date().toISOString(),
      }),
    });
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
