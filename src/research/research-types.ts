import type { BrewMethod, CoffeeLabelInput } from '../types/coffee-label.js';

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'unknown'] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export interface ResearchRequest {
  coffeeName: string;
  producer: string;
  additionalInformation?: string;
}

export interface ResearchSource {
  url: string;
  title: string;
}

export interface SourcedResearchField<T> {
  value: T | null;
  confidence: Confidence;
  sources: readonly string[];
}

export interface CoffeeResearchResult {
  coffeeName: SourcedResearchField<string>;
  variety: SourcedResearchField<string>;
  processing: SourcedResearchField<string>;
  altitude: SourcedResearchField<string>;
  producer: SourcedResearchField<{ line1: string; line2: string }>;
  tastingNotes: SourcedResearchField<readonly string[]>;
  brewMethod: SourcedResearchField<BrewMethod>;
  summary: string;
}

export interface ResearchResponse {
  result: CoffeeResearchResult;
  sources: readonly ResearchSource[];
  meta: {
    provider: 'openai' | 'fixture';
    model: string;
    researchedAt: string;
  };
}

export interface ResearchApiError {
  error: {
    code: 'INVALID_REQUEST' | 'RESEARCH_NOT_CONFIGURED' | 'RESEARCH_FAILED' | 'METHOD_NOT_ALLOWED' | 'RATE_LIMITED';
    message: string;
    requestId?: string;
  };
}

export function researchResultToLabelInput(
  response: ResearchResponse,
  backgroundColor: string,
): CoffeeLabelInput {
  const result = response.result;
  return {
    coffeeName: result.coffeeName.value ?? '',
    variety: result.variety.value ?? '',
    processing: result.processing.value ?? '',
    altitude: result.altitude.value ?? '',
    producer: result.producer.value ?? { line1: '', line2: '' },
    tastingNotes: result.tastingNotes.value ?? [],
    brewMethod: result.brewMethod.value ?? 'pourover',
    backgroundColor,
  };
}
