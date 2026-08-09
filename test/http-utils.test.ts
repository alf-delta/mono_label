import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import test from 'node:test';
import { readJsonBody } from '../server/http-utils';

test('reads the pre-parsed JSON body supplied by Vercel', async () => {
  const body = { coffeeName: 'Geisha', producer: 'Elkin Arcila' };
  const request = { body } as IncomingMessage & { body: unknown };
  assert.deepEqual(await readJsonBody(request), body);
});

test('keeps request-size enforcement for pre-parsed Vercel bodies', async () => {
  const request = { body: { value: 'x'.repeat(200) } } as IncomingMessage & { body: unknown };
  await assert.rejects(() => readJsonBody(request, 32), /REQUEST_TOO_LARGE/);
});
