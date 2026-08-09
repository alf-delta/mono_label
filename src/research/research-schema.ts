import { z } from 'zod';

export const researchRequestSchema = z.object({
  coffeeName: z.string().trim().min(2).max(120),
  producer: z.string().trim().min(2).max(120),
  additionalInformation: z.string().trim().max(1200).optional(),
}).strict();

const confidenceSchema = z.enum(['high', 'medium', 'low', 'unknown']);
const sourceListSchema = z.array(z.url()).max(8);

function sourcedField<T extends z.ZodType>(value: T) {
  return z.object({
    value: value.nullable(),
    confidence: confidenceSchema,
    sources: sourceListSchema,
  }).strict();
}

export const coffeeResearchResultSchema = z.object({
  coffeeName: sourcedField(z.string()),
  variety: sourcedField(z.string()),
  processing: sourcedField(z.string()),
  altitude: sourcedField(z.string()),
  producer: sourcedField(z.object({ line1: z.string(), line2: z.string() }).strict()),
  tastingNotes: sourcedField(z.array(z.string()).max(6)),
  brewMethod: sourcedField(z.enum(['pourover', 'espresso'])),
  summary: z.string(),
}).strict();

export const researchResponseSchema = z.object({
  result: coffeeResearchResultSchema,
  sources: z.array(z.object({ url: z.url(), title: z.string() }).strict()),
  meta: z.object({
    provider: z.enum(['openai', 'fixture']),
    model: z.string(),
    researchedAt: z.string(),
  }).strict(),
}).strict();

export type RawCoffeeResearchResult = z.infer<typeof coffeeResearchResultSchema>;
