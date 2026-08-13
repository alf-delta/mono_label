import type { BrewMethod } from '../types/coffee-label.js';
import type { ResearchRequest, ResearchResponse, SourcedResearchField } from './research-types.js';

export interface ManualCoffeeInput {
  coffeeName: string;
  variety: string;
  processing: string;
  altitude: string;
  originLine1: string;
  originLine2: string;
  tastingNotes: string;
  brewMethod: BrewMethod;
}

export const EMPTY_MANUAL_COFFEE: ManualCoffeeInput = {
  coffeeName: '',
  variety: '',
  processing: '',
  altitude: '',
  originLine1: '',
  originLine2: '',
  tastingNotes: '',
  brewMethod: 'pourover',
};

function manualField<T>(value: T): SourcedResearchField<T> {
  return { value, confidence: 'high', sources: [] };
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function createManualResearch(input: ManualCoffeeInput): { request: ResearchRequest; response: ResearchResponse } {
  const normalized = {
    coffeeName: clean(input.coffeeName),
    variety: clean(input.variety),
    processing: clean(input.processing),
    altitude: clean(input.altitude),
    originLine1: clean(input.originLine1),
    originLine2: clean(input.originLine2),
    tastingNotes: input.tastingNotes.split(/[,;\n·]+/u).map(clean).filter(Boolean).slice(0, 6),
    brewMethod: input.brewMethod,
  };
  const request: ResearchRequest = {
    coffeeName: normalized.coffeeName,
    producer: [normalized.originLine1, normalized.originLine2].filter(Boolean).join(' / '),
    entryMode: 'manual',
    variety: normalized.variety,
    additionalInformation: 'Label facts entered manually by the user.',
  };
  const response: ResearchResponse = {
    result: {
      coffeeName: manualField(normalized.coffeeName),
      variety: manualField(normalized.variety),
      processing: manualField(normalized.processing),
      altitude: manualField(normalized.altitude),
      producer: manualField({ line1: normalized.originLine1, line2: normalized.originLine2 }),
      tastingNotes: manualField(normalized.tastingNotes),
      brewMethod: manualField(normalized.brewMethod),
      summary: 'These label facts were entered manually. Review them before creating the color identity.',
    },
    sources: [],
    meta: {
      provider: 'manual',
      model: 'user entry',
      researchedAt: new Date().toISOString(),
    },
  };
  return { request, response };
}

export function manualInputFromResearch(response: ResearchResponse): ManualCoffeeInput {
  const result = response.result;
  return {
    coffeeName: result.coffeeName.value ?? '',
    variety: result.variety.value ?? '',
    processing: result.processing.value ?? '',
    altitude: result.altitude.value ?? '',
    originLine1: result.producer.value?.line1 ?? '',
    originLine2: result.producer.value?.line2 ?? '',
    tastingNotes: result.tastingNotes.value?.join(', ') ?? '',
    brewMethod: result.brewMethod.value ?? 'pourover',
  };
}
