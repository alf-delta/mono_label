import { WorkflowHeader } from '../workflow/WorkflowHeader';

export function ConceptError({ coffeeName, message, requestId, onRetry, onBack }: {
  coffeeName: string;
  message: string;
  requestId?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Color studio paused" onStartOver={onBack} />
      <section className="workflow-error">
        <span aria-hidden="true">!</span>
        <p className="eyebrow">The research is safe</p>
        <h1>The palette needs another pass.</h1>
        <p>{message}</p>
        {requestId && <code>Request {requestId}</code>}
        <div>
          <button type="button" className="button button-primary" onClick={onRetry}>Create again</button>
          <button type="button" className="button button-secondary" onClick={onBack}>Back to research</button>
        </div>
        <small>{coffeeName}</small>
      </section>
    </main>
  );
}
