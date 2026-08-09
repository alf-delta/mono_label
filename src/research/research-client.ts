import { researchResponseSchema } from './research-schema';
import type { ResearchApiError, ResearchRequest, ResearchResponse } from './research-types';

export class ResearchClientError extends Error {
  constructor(
    message: string,
    readonly code: ResearchApiError['error']['code'] | 'INVALID_RESPONSE' | 'NETWORK_ERROR',
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export async function researchCoffee(request: ResearchRequest, signal?: AbortSignal): Promise<ResearchResponse> {
  let response: Response;
  try {
    response = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ResearchClientError('The research server could not be reached.', 'NETWORK_ERROR');
  }

  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const apiError = body as Partial<ResearchApiError> | null;
    throw new ResearchClientError(
      apiError?.error?.message ?? 'Research could not be completed.',
      apiError?.error?.code ?? 'INVALID_RESPONSE',
      apiError?.error?.requestId,
    );
  }

  const parsed = researchResponseSchema.safeParse(body);
  if (!parsed.success) throw new ResearchClientError('The research server returned an invalid response.', 'INVALID_RESPONSE');
  return parsed.data;
}
