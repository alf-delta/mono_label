import type { IncomingMessage, ServerResponse } from 'node:http';

export function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export async function readJsonBody(request: IncomingMessage, maximumBytes = 16_384): Promise<unknown> {
  const providedBody = (request as IncomingMessage & { body?: unknown }).body;
  if (providedBody !== undefined) {
    if (Buffer.isBuffer(providedBody)) {
      if (providedBody.length > maximumBytes) throw new Error('REQUEST_TOO_LARGE');
      return providedBody.length === 0 ? {} : JSON.parse(providedBody.toString('utf8')) as unknown;
    }
    if (typeof providedBody === 'string') {
      if (Buffer.byteLength(providedBody, 'utf8') > maximumBytes) throw new Error('REQUEST_TOO_LARGE');
      return providedBody.length === 0 ? {} : JSON.parse(providedBody) as unknown;
    }
    const serialized = JSON.stringify(providedBody);
    if (Buffer.byteLength(serialized, 'utf8') > maximumBytes) throw new Error('REQUEST_TOO_LARGE');
    return providedBody;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumBytes) throw new Error('REQUEST_TOO_LARGE');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
