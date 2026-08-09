import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import test from 'node:test';
import { createApiRuntime } from '../server/api-runtime';

function request(remoteAddress: string, forwardedFor?: string): IncomingMessage {
  return {
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {},
    socket: { remoteAddress },
  } as IncomingMessage;
}

test('proxy addresses are trusted only when explicitly enabled', () => {
  const untrusted = createApiRuntime({});
  const trusted = createApiRuntime({ TRUST_PROXY: '1' });
  const incoming = request('127.0.0.1', '203.0.113.7, 10.0.0.2');

  assert.equal(untrusted.requestContext(incoming).clientAddress, '127.0.0.1');
  assert.equal(trusted.requestContext(incoming).clientAddress, '203.0.113.7');
});

test('safety identifiers are stable, private, and secret-dependent', () => {
  const first = createApiRuntime({ SAFETY_IDENTIFIER_SECRET: 'release-secret-a' });
  const second = createApiRuntime({ SAFETY_IDENTIFIER_SECRET: 'release-secret-b' });
  const incoming = request('203.0.113.7');
  const firstId = first.requestContext(incoming).safetyIdentifier;

  assert.equal(firstId, first.requestContext(incoming).safetyIdentifier);
  assert.notEqual(firstId, second.requestContext(incoming).safetyIdentifier);
  assert.equal(firstId?.includes('203.0.113.7'), false);
  assert.match(firstId ?? '', /^[a-f0-9]{64}$/);
});

test('each expensive endpoint has an independent sliding-window budget', () => {
  const runtime = createApiRuntime({
    RESEARCH_RATE_LIMIT_MAX: '1',
    CONCEPT_RATE_LIMIT_MAX: '1',
    EXPORT_RATE_LIMIT_MAX: '1',
  });

  assert.equal(runtime.consume('research', 'client').limited, false);
  assert.equal(runtime.consume('research', 'client').limited, true);
  assert.equal(runtime.consume('concept', 'client').limited, false);
  assert.equal(runtime.consume('export', 'client').limited, false);
});
