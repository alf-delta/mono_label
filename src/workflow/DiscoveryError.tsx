import type { CoffeeDiscoveryRequest } from '../discovery/discovery-types';
import { WorkflowHeader } from './WorkflowHeader';

export function DiscoveryError({ request, message, requestId, onRetry, onBack }: {
  request: CoffeeDiscoveryRequest;
  message: string;
  requestId?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Discovery error" onStartOver={onBack} />
      <section className="workflow-error">
        <span aria-hidden="true">!</span>
        <p className="eyebrow">Coffee finder stopped safely</p>
        <h1>No producer was guessed.</h1>
        <p>{message}</p>
        {requestId && <code>Request {requestId}</code>}
        <div>
          <button type="button" className="button button-primary" onClick={onRetry}>Try again</button>
          <button type="button" className="button button-secondary" onClick={onBack}>Change variety</button>
        </div>
        <small>{request.variety}</small>
      </section>
    </main>
  );
}
