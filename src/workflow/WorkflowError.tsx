import type { ResearchRequest } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

export function WorkflowError({ request, message, requestId, onRetry, onBack }: {
  request: ResearchRequest;
  message: string;
  requestId?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const requestLabel = request.entryMode === 'source'
    ? request.sourceUrl ?? 'Source import'
    : `${request.coffeeName} · ${request.producer}`;
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Research error" onStartOver={onBack} />
      <section className="workflow-error">
        <span aria-hidden="true">!</span>
        <p className="eyebrow">Research stopped safely</p>
        <h1>Nothing was added to the label.</h1>
        <p>{message}</p>
        {requestId && <code>Request {requestId}</code>}
        <div>
          <button type="button" className="button button-primary" onClick={onRetry}>Try again</button>
          <button type="button" className="button button-secondary" onClick={onBack}>Edit identification</button>
        </div>
        <small>{requestLabel}</small>
      </section>
    </main>
  );
}
