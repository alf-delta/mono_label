import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, extname, resolve, sep } from 'node:path';
import { loadEnv } from 'vite';
import { handleApi } from './api.js';
import { createApiRuntime } from './api-runtime.js';
import { createResearchService } from './research/create-research-service.js';
import { setSecurityHeaders } from './security-headers.js';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
const host = env.HOST || (mode === 'production' ? '0.0.0.0' : '127.0.0.1');
const port = Number(env.PORT || 5173);
if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) throw new Error('PORT must be an integer from 1 to 65535.');
const researchService = createResearchService(env);
const apiRuntime = createApiRuntime(env);
const distributionDirectory = resolve(process.cwd(), 'dist');
const indexFile = resolve(distributionDirectory, 'index.html');
if (!existsSync(indexFile)) throw new Error('Production assets are missing. Run `npm run build` before starting the server.');

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.otf': 'font/otf',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
};

function serveProductionFile(pathname: string, response: import('node:http').ServerResponse): void {
  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('Bad request');
    return;
  }
  const requested = decodedPathname === '/' ? '/index.html' : decodedPathname;
  let filePath = resolve(distributionDirectory, `.${requested}`);
  const safePath = filePath.startsWith(`${distributionDirectory}${sep}`);
  const found = safePath && existsSync(filePath) && statSync(filePath).isFile();
  if (!found) {
    if (extname(requested)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end('Not found');
      return;
    }
    filePath = indexFile;
  }
  const hashedAsset = /-[A-Za-z0-9_-]{8,}\./.test(basename(filePath));
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': hashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  setSecurityHeaders(response, true);
  if (await handleApi(request, response, researchService, apiRuntime)) return;
  serveProductionFile(new URL(request.url ?? '/', 'http://localhost').pathname, response);
});

server.requestTimeout = 210_000;
server.headersTimeout = 15_000;
server.keepAliveTimeout = 5_000;

server.listen(port, host, () => {
  console.log(`Monoblend Label Studio: http://${host}:${port}`);
  console.log(`Research provider: ${researchService.providerName}${researchService.configured ? '' : ' (not configured)'}`);
  if (researchService.providerName === 'openai' && researchService.configured && !apiRuntime.safetyIdentifiersConfigured) {
    console.warn('SAFETY_IDENTIFIER_SECRET is not configured; OpenAI safety identifiers are disabled.');
  }
});

function shutdown(signal: string): void {
  console.log(`${signal} received; closing HTTP server.`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
