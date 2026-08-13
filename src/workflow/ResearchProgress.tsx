import type { ResearchRequest } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

const CHECKS = ['Identifying exact coffee', 'Finding origin and producer', 'Checking process and altitude', 'Finding tasting profile', 'Classifying brew method'];

export function ResearchProgress({ request }: { request: ResearchRequest }) {
  const sourceName = request.sourceUrl ? new URL(request.sourceUrl).hostname.replace(/^www\./, '') : 'supplied source';
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 2 of 5" />
      <section className="research-progress-stage" aria-live="polite">
        <span className="research-orbit" aria-hidden="true"><i /><i /><i /></span>
        <span className="eyebrow">Extracting from source</span>
        <h1>{request.entryMode === 'source' ? sourceName : request.coffeeName}</h1>
        <p>{request.entryMode === 'source'
          ? 'Reading the exact page you supplied, identifying the coffee, and structuring its label facts for review.'
          : `Researching the confirmed lot by ${request.producer}. No field is marked resolved until the structured response returns with sources.`}</p>
        <ul>
          {CHECKS.map((check) => <li key={check}><span aria-hidden="true" />{check}</li>)}
        </ul>
      </section>
    </main>
  );
}
