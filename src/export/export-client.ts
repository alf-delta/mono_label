import type { ExportRequest } from './export-types';

export class ExportClientError extends Error {
  constructor(message: string, readonly requestId?: string) {
    super(message);
  }
}

function filenameFrom(response: Response): string {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? 'monoblend-label-sheet.pdf';
}

export async function exportPrintPdf(request: ExportRequest, signal?: AbortSignal): Promise<{
  blob: Blob;
  filename: string;
}> {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; requestId?: string } } | null;
    throw new ExportClientError(body?.error?.message ?? 'The print PDF could not be generated.', body?.error?.requestId);
  }
  return { blob: await response.blob(), filename: filenameFrom(response) };
}

export function downloadBlob(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
