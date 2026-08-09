import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApi } from './api.js';
import { createApiRuntime } from './api-runtime.js';
import { sendJson } from './http-utils.js';
import { createResearchService } from './research/create-research-service.js';
import { setSecurityHeaders } from './security-headers.js';

export type VercelApiHandler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;

export function createVercelHandler(env: Record<string, string | undefined>): VercelApiHandler {
  const service = createResearchService(env);
  // Vercel overwrites X-Forwarded-For with the public client address, so it is
  // trusted inside this platform-specific adapter without changing local defaults.
  const runtime = createApiRuntime({ ...env, TRUST_PROXY: '1' });

  return async (request, response) => {
    setSecurityHeaders(response, true);
    if (await handleApi(request, response, service, runtime)) return;
    sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Not found.' } });
  };
}

export default createVercelHandler(process.env);
