import { createHmac } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

class SlidingWindowRateLimiter {
  readonly #requests = new Map<string, number[]>();

  constructor(
    private readonly maximumRequests: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    const recent = (this.#requests.get(key) ?? []).filter((timestamp) => now - timestamp < this.windowMs);
    if (recent.length >= this.maximumRequests) {
      const retryAfterMs = Math.max(1_000, this.windowMs - (now - recent[0]));
      this.#requests.set(key, recent);
      return { limited: true, retryAfterSeconds: Math.ceil(retryAfterMs / 1_000) };
    }
    recent.push(now);
    this.#requests.set(key, recent);

    if (this.#requests.size > 10_000) {
      for (const [address, timestamps] of this.#requests) {
        if (timestamps.every((timestamp) => now - timestamp >= this.windowMs)) this.#requests.delete(address);
      }
    }

    return { limited: false, retryAfterSeconds: 0 };
  }
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function forwardedAddress(request: IncomingMessage): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const normalized = first?.trim();
  return normalized && normalized.length <= 128 ? normalized : null;
}

export interface ApiRequestContext {
  clientAddress: string;
  safetyIdentifier?: string;
}

export interface ApiRuntime {
  requestContext(request: IncomingMessage): ApiRequestContext;
  consume(endpoint: 'discover' | 'research' | 'concept' | 'export', clientAddress: string): RateLimitResult;
  safetyIdentifiersConfigured: boolean;
}

export function createApiRuntime(env: Record<string, string | undefined>): ApiRuntime {
  const trustProxy = env.TRUST_PROXY === '1';
  const safetySecret = env.SAFETY_IDENTIFIER_SECRET?.trim() || null;
  const windowMs = positiveInteger(env.API_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1_000);
  const limiters = {
    discover: new SlidingWindowRateLimiter(positiveInteger(env.DISCOVERY_RATE_LIMIT_MAX, 8), windowMs),
    research: new SlidingWindowRateLimiter(positiveInteger(env.RESEARCH_RATE_LIMIT_MAX, 8), windowMs),
    concept: new SlidingWindowRateLimiter(positiveInteger(env.CONCEPT_RATE_LIMIT_MAX, 8), windowMs),
    export: new SlidingWindowRateLimiter(positiveInteger(env.EXPORT_RATE_LIMIT_MAX, 12), windowMs),
  };

  return {
    safetyIdentifiersConfigured: Boolean(safetySecret),
    requestContext(request) {
      const clientAddress = (trustProxy ? forwardedAddress(request) : null) ?? request.socket.remoteAddress ?? 'unknown';
      const safetyIdentifier = safetySecret
        ? createHmac('sha256', safetySecret).update(`monoblend:${clientAddress}`).digest('hex')
        : undefined;
      return { clientAddress, safetyIdentifier };
    },
    consume(endpoint, clientAddress) {
      return limiters[endpoint].consume(clientAddress);
    },
  };
}
