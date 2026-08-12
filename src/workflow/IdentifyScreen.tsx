import { useState, type FormEvent } from 'react';
import type { CoffeeDiscoveryRequest } from '../discovery/discovery-types';
import { WorkflowHeader } from './WorkflowHeader';

interface IdentifyScreenProps {
  initial?: CoffeeDiscoveryRequest;
  onSubmit: (request: CoffeeDiscoveryRequest) => void;
  onOpenReference?: () => void;
}

export function IdentifyScreen({ initial, onSubmit, onOpenReference }: IdentifyScreenProps) {
  const [variety, setVariety] = useState(initial?.variety ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ variety });
  };

  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 1 of 5" />
      <section className="identify-stage">
        <div className="identify-intro">
          <span className="eyebrow">Choose variety</span>
          <h1>Start with the coffee.</h1>
          <p>Enter one variety. We’ll find exact coffees with verified source pages, group them by origin, and ask you to choose before researching the label.</p>
          <ol className="workflow-steps workflow-steps-five" aria-label="Label workflow">
            <li className="is-active"><span>01</span> Variety</li>
            <li><span>02</span> Select</li>
            <li><span>03</span> Research</li>
            <li><span>04</span> Create</li>
            <li><span>05</span> Label</li>
          </ol>
        </div>
        <form className="identify-form" onSubmit={submit}>
          <label>
            <span>Coffee variety</span>
            <input autoFocus required minLength={2} maxLength={80} value={variety} onChange={(event) => setVariety(event.target.value)} placeholder="Geisha" />
          </label>
          <p className="identify-form-note">We accept common aliases such as Geisha / Gesha. Producer, country, and lot are selected on the next screen.</p>
          <button type="submit" className="button button-primary">Find matching coffees <span aria-hidden="true">→</span></button>
          {import.meta.env.DEV && onOpenReference && (
            <button type="button" className="text-button" onClick={onOpenReference}>Open calibrated reference directly</button>
          )}
        </form>
      </section>
    </main>
  );
}
