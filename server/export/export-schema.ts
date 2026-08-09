import { z } from 'zod';
import { PRINT_FORMAT_IDS } from '../../src/export/export-types';

const marksSchema = z.object({
  cropMarks: z.boolean(),
  cutterGuides: z.boolean(),
  registrationMarks: z.boolean(),
}).strict();

const settingsSchema = z.object({
  formatId: z.enum(PRINT_FORMAT_IDS),
  orientation: z.enum(['auto', 'portrait', 'landscape']),
  marginMm: z.number().min(0).max(25),
  quantityMode: z.enum(['maximum', 'custom']),
  quantity: z.number().int().min(1).max(100),
  marks: marksSchema,
}).strict();

const labelDataSchema = z.object({
  coffeeName: z.string().min(1).max(120),
  variety: z.string().max(120),
  processing: z.string().max(120),
  altitude: z.string().max(120),
  producer: z.object({ line1: z.string().max(120), line2: z.string().max(120) }),
  tastingNotes: z.array(z.string().max(80)).max(6),
  brewMethod: z.enum(['pourover', 'espresso']),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/),
  foregroundColor: z.literal('#F9F7DE'),
  netWeight: z.string().max(40),
}).strict();

const snapshotSchema = z.object({
  id: z.uuid(),
  generatedAt: z.iso.datetime(),
  templateId: z.literal('coffee-label-v1'),
  templateVersion: z.literal(1),
  labelData: labelDataSchema,
  template: z.object({
    id: z.literal('coffee-label-v1'),
    version: z.literal(1),
    widthMm: z.number(),
    heightMm: z.number(),
    bleedMm: z.number(),
  }).passthrough(),
  layout: z.record(z.string(), z.unknown()),
  svgMarkup: z.string().min(100).max(500_000),
}).strict();

export const exportRequestSchema = z.object({
  snapshot: snapshotSchema,
  settings: settingsSchema,
  outlinedSvg: z.string().min(100).max(750_000),
}).strict();

export type ParsedExportRequest = z.infer<typeof exportRequestSchema>;
