import { createServer } from 'node:http';
import { loadEnv } from 'vite';
import { handleApi } from './api';
import { createResearchService } from './research/create-research-service';
import { createApiRuntime } from './api-runtime';
import { setSecurityHeaders } from './security-headers';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
const host = env.API_HOST || '127.0.0.1';
const port = Number(env.API_PORT || 5174);
const researchService = createResearchService(env);
const apiRuntime = createApiRuntime(env);

const server = createServer(async (request, response) => {
  setSecurityHeaders(response, false);
  if (await handleApi(request, response, researchService, apiRuntime)) return;
  response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }));
});

server.listen(port, host, () => {
  console.log(`Research API: http://${host}:${port}`);
  console.log(`Research provider: ${researchService.providerName}${researchService.configured ? '' : ' (not configured)'}`);
});
