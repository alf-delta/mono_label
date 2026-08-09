import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import test from 'node:test';
import { createVercelHandler } from '../server/vercel-handler';

interface CapturedResponse {
  status: number;
  headers: Record<string, string | number | readonly string[]>;
  body: string;
}

function request(path: string, method: string, body?: unknown): IncomingMessage {
  return {
    url: path,
    method,
    body,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as IncomingMessage;
}

function response(): { nodeResponse: ServerResponse; captured: CapturedResponse } {
  const captured: CapturedResponse = { status: 0, headers: {}, body: '' };
  const nodeResponse = {
    setHeader(name: string, value: string | number | readonly string[]) {
      captured.headers[name.toLocaleLowerCase()] = value;
      return this;
    },
    writeHead(status: number, headers?: Record<string, string | number>) {
      captured.status = status;
      for (const [name, value] of Object.entries(headers ?? {})) captured.headers[name.toLocaleLowerCase()] = value;
      return this;
    },
    end(value?: string | Buffer) {
      captured.body = Buffer.isBuffer(value) ? value.toString('utf8') : value ?? '';
      return this;
    },
  } as unknown as ServerResponse;
  return { nodeResponse, captured };
}

test('Vercel health function reaches the shared API service', async () => {
  const handler = createVercelHandler({ RESEARCH_PROVIDER: 'fixture', SAFETY_IDENTIFIER_SECRET: 'test-secret' });
  const result = response();
  await handler(request('/api/health', 'GET'), result.nodeResponse);

  assert.equal(result.captured.status, 200);
  assert.deepEqual(JSON.parse(result.captured.body), {
    ok: true,
    researchConfigured: true,
    provider: 'fixture',
  });
});

test('Vercel research function accepts the platform pre-parsed request body', async () => {
  const handler = createVercelHandler({ RESEARCH_PROVIDER: 'fixture', SAFETY_IDENTIFIER_SECRET: 'test-secret' });
  const result = response();
  await handler(request('/api/research', 'POST', {
    coffeeName: 'Geisha Elkin Arcila',
    producer: 'Elkin Arcila',
  }), result.nodeResponse);

  assert.equal(result.captured.status, 200);
  const body = JSON.parse(result.captured.body) as { result: { variety: { value: string } } };
  assert.equal(body.result.variety.value, 'Geisha');
});
