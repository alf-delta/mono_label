import type { CoffeeDiscoveryRequest } from '../discovery/discovery-types';
import { WorkflowHeader } from './WorkflowHeader';

const CHECKS = ['Finding exact offerings', 'Verifying source pages', 'Separating origins', 'Grouping producers'];

export function DiscoveryProgress({ request }: { request: CoffeeDiscoveryRequest }) {
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 1 of 5" />
      <section className="research-progress-stage" aria-live="polite">
        <span className="research-orbit" aria-hidden="true"><i /><i /><i /></span>
        <span className="eyebrow">Finding verified coffees</span>
        <h1>{request.variety}</h1>
        <p>Looking for exact lots and product pages. General variety articles and unsupported producer guesses are excluded.</p>
        <ul className="discovery-checks">
          {CHECKS.map((check) => <li key={check}><span aria-hidden="true" />{check}</li>)}
        </ul>
      </section>
    </main>
  );
}
