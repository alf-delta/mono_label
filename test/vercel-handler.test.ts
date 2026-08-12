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

test('Vercel discovery returns exact fixture candidates with verified sources', async () => {
  const handler = createVercelHandler({ RESEARCH_PROVIDER: 'fixture', SAFETY_IDENTIFIER_SECRET: 'test-secret' });
  const result = response();
  await handler(request('/api/discover', 'POST', { variety: 'Geisha' }), result.nodeResponse);

  assert.equal(result.captured.status, 200);
  const body = JSON.parse(result.captured.body) as {
    canonicalVariety: string;
    candidates: Array<{ country: string; coffeeName: string; sourceTitle: string }>;
  };
  assert.equal(body.canonicalVariety, 'Geisha');
  assert.deepEqual(body.candidates, [{
    country: 'Colombia',
    coffeeName: 'King Arthur Geisha',
    farm: 'Finca Puerto Arturo',
    harvest: '2022',
    processing: 'Washed',
    producer: 'Elkin Arcila',
    region: 'Támesis, Antioquia',
    sourceTitle: 'Local deterministic discovery fixture',
    sourceUrl: 'https://example.invalid/monoblend-research-fixture',
    variety: 'Geisha',
  }]);
});

test('color creation rejects an incomplete researched identity', async () => {
  const handler = createVercelHandler({ RESEARCH_PROVIDER: 'fixture', SAFETY_IDENTIFIER_SECRET: 'test-secret' });
  const result = response();
  const sourced = <T>(value: T | null) => ({ value, confidence: value === null ? 'unknown' : 'medium', sources: value === null ? [] : ['https://example.invalid/source'] });
  await handler(request('/api/label-concept', 'POST', {
    research: {
      coffeeName: sourced('King Arthur Geisha'),
      variety: sourced('Geisha'),
      processing: sourced('Washed'),
      altitude: sourced('1850'),
      producer: sourced({ line1: 'Colombia', line2: 'Támesis' }),
      tastingNotes: sourced(null),
      brewMethod: sourced('pourover'),
      summary: 'Incomplete tasting profile.',
    },
  }), result.nodeResponse);

  assert.equal(result.captured.status, 400);
  const body = JSON.parse(result.captured.body) as { error: { code: string } };
  assert.equal(body.error.code, 'INVALID_CONCEPT_REQUEST');
});
