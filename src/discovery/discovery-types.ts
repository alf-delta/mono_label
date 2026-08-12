export interface CoffeeDiscoveryRequest {
  variety: string;
}

export interface CoffeeCandidate {
  coffeeName: string;
  variety: string;
  producer: string;
  farm: string | null;
  country: string;
  region: string | null;
  processing: string | null;
  harvest: string | null;
  sourceUrl: string;
  sourceTitle: string;
}

export interface CoffeeDiscoveryResponse {
  canonicalVariety: string;
  candidates: readonly CoffeeCandidate[];
  summary: string;
  meta: {
    provider: 'openai' | 'fixture';
    model: string;
    discoveredAt: string;
  };
}

export interface CoffeeDiscoveryApiError {
  error: {
    code: 'INVALID_DISCOVERY_REQUEST' | 'DISCOVERY_NOT_CONFIGURED' | 'DISCOVERY_FAILED' | 'METHOD_NOT_ALLOWED' | 'RATE_LIMITED';
    message: string;
    requestId?: string;
  };
}
