import { z } from 'zod';
import { coffeeResearchResultSchema } from '../research/research-schema';

const anchorFieldSchema = z.enum(['coffeeName', 'variety', 'processing', 'tastingNote', 'origin']);
const anchorSchema = z.object({
  field: anchorFieldSchema,
  value: z.string().trim().min(1).max(120),
}).strict();

export const rawConceptColorSchema = z.object({
  name: z.string().trim().min(3).max(42),
  requestedHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  story: z.string().trim().min(32).max(220),
  anchors: z.array(anchorSchema).min(2).max(4),
}).strict();

export const rawLabelConceptSchema = z.object({
  recommended: rawConceptColorSchema,
  alternatives: z.array(rawConceptColorSchema).length(3),
}).strict();

export const labelConceptRequestSchema = z.object({
  research: coffeeResearchResultSchema,
}).strict();

const colorMetricsSchema = z.object({
  relativeLuminance: z.number(),
  contrastRatio: z.number(),
  saturation: z.number(),
  lightness: z.number(),
}).strict();

const conceptColorSchema = rawConceptColorSchema.extend({
  id: z.string(),
  role: z.enum(['suggested', 'alternative']),
  hex: z.string().regex(/^#[0-9A-F]{6}$/),
  profile: z.string(),
  resolution: z.enum(['approved', 'adjusted']),
  metrics: colorMetricsSchema,
}).strict();

export const labelConceptResponseSchema = z.object({
  recommended: conceptColorSchema,
  alternatives: z.tuple([conceptColorSchema, conceptColorSchema, conceptColorSchema]),
  meta: z.object({
    provider: z.enum(['openai', 'fixture']),
    model: z.string(),
    generatedAt: z.string(),
  }).strict(),
}).strict();

export type RawLabelConcept = z.infer<typeof rawLabelConceptSchema>;
export type RawConceptColor = z.infer<typeof rawConceptColorSchema>;
