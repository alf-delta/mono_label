import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { researchRequestSchema } from '../src/research/research-schema.js';
import type { ResearchApiError } from '../src/research/research-types.js';
import { readJsonBody, sendJson } from './http-utils.js';
import { handleExportApi } from './export/export-api.js';
import { ResearchService } from './research/research-service.js';
import { labelConceptRequestSchema } from '../src/concept/concept-schema.js';
import type { LabelConceptApiError } from '../src/concept/concept-types.js';
import type { ApiRuntime } from './api-runtime.js';

function sendError(response: ServerResponse, status: number, error: ResearchApiError['error']): void {
  sendJson(response, status, { error } satisfies ResearchApiError);
}

function sendConceptError(response: ServerResponse, status: number, error: LabelConceptApiError['error']): void {
  sendJson(response, status, { error } satisfies LabelConceptApiError);
}

export async function handleApi(
  request: IncomingMessage,
  response: ServerResponse,
  service: ResearchService,
  runtime: ApiRuntime,
): Promise<boolean> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const context = runtime.requestContext(request);

  if (url.pathname === '/api/export') {
    if (request.method === 'POST') {
      const rateLimit = runtime.consume('export', context.clientAddress);
      if (rateLimit.limited) {
        response.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
        sendJson(response, 429, { error: { code: 'RATE_LIMITED', message: 'Too many export requests. Try again later.' } });
        return true;
      }
    }
    return handleExportApi(request, response);
  }

  if (url.pathname === '/api/health') {
    if (request.method !== 'GET') {
      sendError(response, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Use GET for this endpoint.' });
      return true;
    }
    sendJson(response, 200, { ok: true, researchConfigured: service.configured, provider: service.providerName });
    return true;
  }

  if (url.pathname === '/api/label-concept') {
    if (request.method !== 'POST') {
      sendConceptError(response, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for this endpoint.' });
      return true;
    }
    if (!service.configured) {
      sendConceptError(response, 503, { code: 'CONCEPT_NOT_CONFIGURED', message: 'The color studio is not configured on this server.' });
      return true;
    }
    const rateLimit = runtime.consume('concept', context.clientAddress);
    if (rateLimit.limited) {
      response.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      sendConceptError(response, 429, { code: 'RATE_LIMITED', message: 'Too many creative requests. Try again later.' });
      return true;
    }

    const requestId = randomUUID();
    try {
      const parsed = labelConceptRequestSchema.safeParse(await readJsonBody(request, 65_536));
      const variety = parsed.success ? parsed.data.research.variety.value : null;
      if (!parsed.success || !variety) {
        sendConceptError(response, 400, {
          code: 'INVALID_CONCEPT_REQUEST',
          message: 'A researched coffee variety is required to create its color identity.',
        });
        return true;
      }
      sendJson(response, 200, await service.createLabelConcept(parsed.data, { safetyIdentifier: context.safetyIdentifier }));
    } catch (error) {
      const invalidBody = error instanceof SyntaxError || (error instanceof Error && error.message === 'REQUEST_TOO_LARGE');
      if (invalidBody) {
        sendConceptError(response, 400, { code: 'INVALID_CONCEPT_REQUEST', message: 'The color concept request is invalid.' });
        return true;
      }
      console.error(`[concept:${requestId}]`, error instanceof Error ? error.message : 'Unknown creative provider error');
      sendConceptError(response, 502, {
        code: 'CONCEPT_FAILED',
        message: 'The color studio could not create a valid palette. Try again.',
        requestId,
      });
    }
    return true;
  }

  if (url.pathname !== '/api/research') return false;
  if (request.method !== 'POST') {
    sendError(response, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for this endpoint.' });
    return true;
  }
  if (!service.configured) {
    sendError(response, 503, { code: 'RESEARCH_NOT_CONFIGURED', message: 'Research is not configured on this server.' });
    return true;
  }
  const rateLimit = runtime.consume('research', context.clientAddress);
  if (rateLimit.limited) {
    response.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    sendError(response, 429, { code: 'RATE_LIMITED', message: 'Too many research requests. Try again later.' });
    return true;
  }

  const requestId = randomUUID();
  try {
    const body = await readJsonBody(request);
    const parsed = researchRequestSchema.safeParse(body);
    if (!parsed.success) {
      sendError(response, 400, { code: 'INVALID_REQUEST', message: 'Enter a coffee name and producer.' });
      return true;
    }
    sendJson(response, 200, await service.research(parsed.data, { safetyIdentifier: context.safetyIdentifier }));
  } catch (error) {
    const invalidBody = error instanceof SyntaxError || (error instanceof Error && error.message === 'REQUEST_TOO_LARGE');
    if (invalidBody) {
      sendError(response, 400, { code: 'INVALID_REQUEST', message: 'The research request is invalid.' });
      return true;
    }
    console.error(`[research:${requestId}]`, error instanceof Error ? error.message : 'Unknown provider error');
    sendError(response, 502, { code: 'RESEARCH_FAILED', message: 'Research could not be completed. Try again.', requestId });
  }
  return true;
}
