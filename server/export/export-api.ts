import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { COFFEE_LABEL_V1 } from '../../src/label/templates/coffee-label-v1.js';
import { readJsonBody, sendJson } from '../http-utils.js';
import { exportRequestSchema } from './export-schema.js';
import { generatePrintPdf } from './pdf-export.js';

function safeOutlinedSvg(svg: string): boolean {
  const disallowed = /<(?:text|tspan|image|script|foreignObject|a|use|style)\b|<!DOCTYPE|\b(?:href|xlink:href)\s*=|\bon[a-z]+\s*=|url\s*\(/i;
  const expectedViewBox = new RegExp(`viewBox=["']0 0 ${COFFEE_LABEL_V1.widthMm} ${COFFEE_LABEL_V1.heightMm}["']`);
  return svg.startsWith('<svg') && expectedViewBox.test(svg) && !disallowed.test(svg);
}

export async function handleExportApi(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname !== '/api/export') return false;
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for this endpoint.' } });
    return true;
  }

  const requestId = randomUUID();
  try {
    const parsed = exportRequestSchema.safeParse(await readJsonBody(request, 1_500_000));
    if (!parsed.success) {
      sendJson(response, 400, { error: { code: 'INVALID_EXPORT', message: 'The print export request is invalid.' } });
      return true;
    }
    const template = parsed.data.snapshot.template;
    const templateMatches = template.id === COFFEE_LABEL_V1.id
      && template.version === COFFEE_LABEL_V1.version
      && template.widthMm === COFFEE_LABEL_V1.widthMm
      && template.heightMm === COFFEE_LABEL_V1.heightMm
      && template.bleedMm === COFFEE_LABEL_V1.bleedMm;
    if (!templateMatches || !safeOutlinedSvg(parsed.data.outlinedSvg)) {
      sendJson(response, 400, { error: { code: 'INVALID_EXPORT', message: 'The frozen print artwork failed validation.' } });
      return true;
    }
    const exported = await generatePrintPdf(parsed.data);
    if (process.env.EXPORT_QA_COPY === '1') {
      const outputDirectory = resolve(process.cwd(), 'output/pdf');
      await mkdir(outputDirectory, { recursive: true });
      await writeFile(resolve(outputDirectory, exported.filename), exported.buffer);
    }
    response.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': exported.buffer.length,
      'Content-Disposition': `attachment; filename="${exported.filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Monoblend-Quantity': String(exported.imposition.quantity),
      'X-Monoblend-Template': `${COFFEE_LABEL_V1.id}@${COFFEE_LABEL_V1.version}`,
    });
    response.end(exported.buffer);
  } catch (error) {
    console.error(`[export:${requestId}]`, error instanceof Error ? error.message : 'Unknown PDF export error');
    sendJson(response, 500, {
      error: { code: 'EXPORT_FAILED', message: 'The print PDF could not be generated.', requestId },
    });
  }
  return true;
}
