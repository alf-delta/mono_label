import { labelConceptResponseSchema } from './concept-schema';
import type { LabelConceptApiError, LabelConceptRequest, LabelConceptResponse } from './concept-types';

export class LabelConceptClientError extends Error {
  constructor(
    message: string,
    readonly code: LabelConceptApiError['error']['code'] | 'INVALID_RESPONSE' | 'NETWORK_ERROR',
    readonly requestId?: string,
  ) {
    super(message);
  }
}

export async function createLabelConcept(
  request: LabelConceptRequest,
  signal?: AbortSignal,
): Promise<LabelConceptResponse> {
  let response: Response;
  try {
    response = await fetch('/api/label-concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new LabelConceptClientError('The color studio could not be reached.', 'NETWORK_ERROR');
  }

  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const apiError = body as Partial<LabelConceptApiError> | null;
    throw new LabelConceptClientError(
      apiError?.error?.message ?? 'The color concept could not be created.',
      apiError?.error?.code ?? 'INVALID_RESPONSE',
      apiError?.error?.requestId,
    );
  }

  const parsed = labelConceptResponseSchema.safeParse(body);
  if (!parsed.success) throw new LabelConceptClientError('The color studio returned an invalid palette.', 'INVALID_RESPONSE');
  return parsed.data;
}
