import { useState, type FormEvent } from 'react';
import type { ResearchRequest } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

interface IdentifyScreenProps {
  initial?: ResearchRequest;
  onSubmit: (request: ResearchRequest) => void;
  onOpenReference?: () => void;
}

export function IdentifyScreen({ initial, onSubmit, onOpenReference }: IdentifyScreenProps) {
  const [coffeeName, setCoffeeName] = useState(initial?.coffeeName ?? '');
  const [producer, setProducer] = useState(initial?.producer ?? '');
  const [additionalInformation, setAdditionalInformation] = useState(initial?.additionalInformation ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ coffeeName, producer, additionalInformation: additionalInformation || undefined });
  };

  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 1 of 5" />
      <section className="identify-stage">
        <div className="identify-intro">
          <span className="eyebrow">Identify coffee</span>
          <h1>Start with what you know.</h1>
          <p>We’ll research the exact lot, preserve the evidence, and leave uncertain label fields unresolved.</p>
          <ol className="workflow-steps workflow-steps-five" aria-label="Label workflow">
            <li className="is-active"><span>01</span> Identify</li>
            <li><span>02</span> Research</li>
            <li><span>03</span> Review</li>
            <li><span>04</span> Create</li>
            <li><span>05</span> Label</li>
          </ol>
        </div>
        <form className="identify-form" onSubmit={submit}>
          <label>
            <span>Coffee name</span>
            <input autoFocus required minLength={2} maxLength={120} value={coffeeName} onChange={(event) => setCoffeeName(event.target.value)} placeholder="Geisha" />
          </label>
          <label>
            <span>Producer</span>
            <input required minLength={2} maxLength={120} value={producer} onChange={(event) => setProducer(event.target.value)} placeholder="Elkin Arcila" />
          </label>
          <label>
            <span>Source URL / additional information <em>Optional</em></span>
            <textarea maxLength={1200} value={additionalInformation} onChange={(event) => setAdditionalInformation(event.target.value)} placeholder="Roaster page, product link, crop year, or other distinguishing context" />
          </label>
          <button type="submit" className="button button-primary">Find coffee <span aria-hidden="true">→</span></button>
          {import.meta.env.DEV && onOpenReference && (
            <button type="button" className="text-button" onClick={onOpenReference}>Open calibrated reference directly</button>
          )}
        </form>
      </section>
    </main>
  );
}
