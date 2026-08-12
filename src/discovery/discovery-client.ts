import { coffeeDiscoveryResponseSchema } from './discovery-schema';
import type { CoffeeDiscoveryApiError, CoffeeDiscoveryRequest, CoffeeDiscoveryResponse } from './discovery-types';

export class CoffeeDiscoveryClientError extends Error {
  constructor(
    message: string,
    readonly code: CoffeeDiscoveryApiError['error']['code'] | 'INVALID_RESPONSE' | 'NETWORK_ERROR',
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export async function discoverCoffees(
  request: CoffeeDiscoveryRequest,
  signal?: AbortSignal,
): Promise<CoffeeDiscoveryResponse> {
  let response: Response;
  try {
    response = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new CoffeeDiscoveryClientError('The coffee finder could not be reached.', 'NETWORK_ERROR');
  }

  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const apiError = body as Partial<CoffeeDiscoveryApiError> | null;
    throw new CoffeeDiscoveryClientError(
      apiError?.error?.message ?? 'Coffee discovery could not be completed.',
      apiError?.error?.code ?? 'INVALID_RESPONSE',
      apiError?.error?.requestId,
    );
  }

  const parsed = coffeeDiscoveryResponseSchema.safeParse(body);
  if (!parsed.success) throw new CoffeeDiscoveryClientError('The coffee finder returned an invalid response.', 'INVALID_RESPONSE');
  return parsed.data;
}
