import { z } from 'zod';

export const researchRequestSchema = z.object({
  coffeeName: z.string().trim().min(2).max(120),
  producer: z.string().trim().min(2).max(120),
  variety: z.string().trim().min(2).max(80).optional(),
  sourceUrl: z.url().optional(),
  additionalInformation: z.string().trim().max(1200).optional(),
}).strict();

const confidenceSchema = z.enum(['high', 'medium', 'low', 'unknown']);

function sourcedField<T extends z.ZodType>(value: T, sourceListSchema: z.ZodType<string[]>) {
  return z.object({
    value: value.nullable(),
    confidence: confidenceSchema,
    sources: sourceListSchema,
  }).strict();
}

function createCoffeeResearchResultSchema(sourceListSchema: z.ZodType<string[]>) {
  return z.object({
    coffeeName: sourcedField(z.string(), sourceListSchema),
    variety: sourcedField(z.string(), sourceListSchema),
    processing: sourcedField(z.string(), sourceListSchema),
    altitude: sourcedField(z.string(), sourceListSchema),
    producer: sourcedField(z.object({ line1: z.string(), line2: z.string() }).strict(), sourceListSchema),
    tastingNotes: sourcedField(z.array(z.string()).max(6), sourceListSchema),
    brewMethod: sourcedField(z.enum(['pourover', 'espresso']), sourceListSchema),
    summary: z.string(),
  }).strict();
}

// Structured Outputs supports only a subset of JSON Schema string formats and
// rejects the `uri` format produced by z.url(). The provider parses this model-
// facing schema first, then applies coffeeResearchResultSchema below so URLs
// still receive strict server-side validation before they reach the client.
export const coffeeResearchModelOutputSchema = createCoffeeResearchResultSchema(z.array(z.string()).max(8));
export const coffeeResearchResultSchema = createCoffeeResearchResultSchema(z.array(z.url()).max(8));

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
