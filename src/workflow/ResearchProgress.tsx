import type { ResearchRequest } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

const CHECKS = ['Identifying exact coffee', 'Finding origin and producer', 'Checking process and altitude', 'Finding tasting profile', 'Classifying brew method'];

export function ResearchProgress({ request }: { request: ResearchRequest }) {
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 2 of 5" />
      <section className="research-progress-stage" aria-live="polite">
        <span className="research-orbit" aria-hidden="true"><i /><i /><i /></span>
        <span className="eyebrow">Researching with evidence</span>
        <h1>{request.coffeeName}</h1>
        <p>Looking for the lot by {request.producer}. No field is marked resolved until the structured response returns with sources.</p>
        <ul>
          {CHECKS.map((check) => <li key={check}><span aria-hidden="true" />{check}</li>)}
        </ul>
      </section>
    </main>
  );
}
