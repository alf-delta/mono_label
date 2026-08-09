import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { coffeeResearchResultSchema } from '../../src/research/research-schema';
import { createResearchUserPrompt, RESEARCH_SYSTEM_PROMPT } from '../../src/research/research-prompt';
import type { ResearchRequest, ResearchSource } from '../../src/research/research-types';
import type { ProviderRequestContext, ResearchProvider, ResearchProviderResult } from './provider-types';
import { rawLabelConceptSchema } from '../../src/concept/concept-schema';
import { createLabelConceptUserPrompt, LABEL_CONCEPT_SYSTEM_PROMPT } from '../../src/concept/concept-prompt';
import type { LabelConceptRequest } from '../../src/concept/concept-types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function readSource(value: unknown): ResearchSource | null {
  if (!isRecord(value) || typeof value.url !== 'string') return null;
  try {
    const url = new URL(value.url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return { url: url.href, title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : url.hostname };
  } catch {
    return null;
  }
}

function extractSources(output: readonly unknown[]): readonly ResearchSource[] {
  const sources: ResearchSource[] = [];

  for (const item of output) {
    if (!isRecord(item)) continue;
    if (item.type === 'web_search_call' && isRecord(item.action) && Array.isArray(item.action.sources)) {
      for (const source of item.action.sources) {
        const parsed = readSource(source);
        if (parsed) sources.push(parsed);
      }
    }
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const content of item.content) {
        if (!isRecord(content) || !Array.isArray(content.annotations)) continue;
        for (const annotation of content.annotations) {
          if (!isRecord(annotation) || annotation.type !== 'url_citation') continue;
          const parsed = readSource(annotation);
          if (parsed) sources.push(parsed);
        }
      }
    }
  }

  return Object.freeze([...new Map(sources.map((source) => [source.url, source])).values()]);
}

export class OpenAIResearchProvider implements ResearchProvider {
  readonly name = 'openai' as const;
  readonly configured: boolean;
  readonly #client: OpenAI | null;
  readonly #model: string;
  readonly #creativeModel: string;

  constructor(apiKey: string | undefined, model = 'gpt-5.6-sol', creativeModel = 'gpt-5.6-terra') {
    const validApiKey = typeof apiKey === 'string' && /^sk-[A-Za-z0-9_-]{20,}$/.test(apiKey.trim());
    this.configured = validApiKey;
    this.#model = model;
    this.#creativeModel = creativeModel;
    this.#client = validApiKey ? new OpenAI({ apiKey: apiKey.trim(), timeout: 180_000, maxRetries: 1 }) : null;
  }

  async research(request: ResearchRequest, context?: ProviderRequestContext): Promise<ResearchProviderResult> {
    if (!this.#client) throw new Error('OPENAI_API_KEY is not configured.');

    const response = await this.#client.responses.parse({
      model: this.#model,
      ...(context?.safetyIdentifier ? { safety_identifier: context.safetyIdentifier } : {}),
      reasoning: { effort: 'low' },
      tools: [{ type: 'web_search' }],
      tool_choice: 'auto',
      include: ['web_search_call.action.sources'],
      store: false,
      input: [
        { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
        { role: 'user', content: createResearchUserPrompt(request) },
      ],
      text: { format: zodTextFormat(coffeeResearchResultSchema, 'coffee_research') },
    });

    if (!response.output_parsed) throw new Error('The research response did not contain structured output.');
    const raw = coffeeResearchResultSchema.parse(response.output_parsed);
    const sources = extractSources(response.output as readonly unknown[]);
    return { raw, sources, model: this.#model, responseId: response.id };
  }

  async createLabelConcept(request: LabelConceptRequest, context?: ProviderRequestContext) {
    if (!this.#client) throw new Error('OPENAI_API_KEY is not configured.');
    const response = await this.#client.responses.parse({
      model: this.#creativeModel,
      ...(context?.safetyIdentifier ? { safety_identifier: context.safetyIdentifier } : {}),
      reasoning: { effort: 'low' },
      store: false,
      input: [
        { role: 'system', content: LABEL_CONCEPT_SYSTEM_PROMPT },
        { role: 'user', content: createLabelConceptUserPrompt(request) },
      ],
      text: { format: zodTextFormat(rawLabelConceptSchema, 'coffee_label_concept') },
    });
    if (!response.output_parsed) throw new Error('The creative response did not contain structured output.');
    return { raw: rawLabelConceptSchema.parse(response.output_parsed), model: this.#creativeModel };
  }
}
