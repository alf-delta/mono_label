import { z } from 'zod';

export const coffeeDiscoveryRequestSchema = z.object({
  variety: z.string().trim().min(2).max(80),
}).strict();

function candidateSchema(sourceUrl: z.ZodType<string>) {
  return z.object({
    coffeeName: z.string().trim().min(2).max(160),
    variety: z.string().trim().min(2).max(80),
    producer: z.string().trim().min(2).max(120),
    farm: z.string().trim().min(2).max(120).nullable(),
    country: z.string().trim().min(2).max(80),
    region: z.string().trim().min(2).max(120).nullable(),
    processing: z.string().trim().min(2).max(120).nullable(),
    harvest: z.string().trim().min(2).max(80).nullable(),
    sourceUrl,
  }).strict();
}

function discoveryResultSchema(sourceUrl: z.ZodType<string>) {
  return z.object({
    canonicalVariety: z.string().trim().min(2).max(80),
    candidates: z.array(candidateSchema(sourceUrl)).max(12),
    summary: z.string().trim().min(1).max(500),
  }).strict();
}

export const coffeeDiscoveryModelOutputSchema = discoveryResultSchema(z.string());
export const rawCoffeeDiscoveryResultSchema = discoveryResultSchema(z.url());

export const coffeeCandidateSchema = candidateSchema(z.url()).extend({
  sourceTitle: z.string().trim().min(1).max(240),
}).strict();

export const coffeeDiscoveryResponseSchema = z.object({
  canonicalVariety: z.string().trim().min(2).max(80),
  candidates: z.array(coffeeCandidateSchema).max(12),
  summary: z.string().trim().min(1).max(500),
  meta: z.object({
    provider: z.enum(['openai', 'fixture']),
    model: z.string(),
    discoveredAt: z.string(),
  }).strict(),
}).strict();

export type RawCoffeeDiscoveryResult = z.infer<typeof rawCoffeeDiscoveryResultSchema>;
