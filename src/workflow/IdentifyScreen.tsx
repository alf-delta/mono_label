import { useState, type FormEvent } from 'react';
import { EMPTY_MANUAL_COFFEE, type ManualCoffeeInput } from '../research/manual-research';
import type { ResearchRequest } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

export type IdentifyDraft =
  | { mode: 'source'; sourceUrl: string }
  | { mode: 'manual'; input: ManualCoffeeInput };

interface IdentifyScreenProps {
  initial?: IdentifyDraft;
  onImportSource: (request: ResearchRequest) => void;
  onManualSubmit: (input: ManualCoffeeInput) => void;
  onOpenReference?: () => void;
}

export function IdentifyScreen({ initial, onImportSource, onManualSubmit, onOpenReference }: IdentifyScreenProps) {
  const [mode, setMode] = useState<IdentifyDraft['mode']>(initial?.mode ?? 'source');
  const [sourceUrl, setSourceUrl] = useState(initial?.mode === 'source' ? initial.sourceUrl : '');
  const [manual, setManual] = useState<ManualCoffeeInput>(initial?.mode === 'manual' ? initial.input : EMPTY_MANUAL_COFFEE);

  const updateManual = <Key extends keyof ManualCoffeeInput>(key: Key, value: ManualCoffeeInput[Key]) => {
    setManual((current) => ({ ...current, [key]: value }));
  };

  const submitSource = (event: FormEvent) => {
    event.preventDefault();
    onImportSource({
      coffeeName: '',
      producer: '',
      entryMode: 'source',
      sourceUrl,
      additionalInformation: 'Extract the exact coffee and its label facts from the supplied source page.',
    });
  };

  const submitManual = (event: FormEvent) => {
    event.preventDefault();
    onManualSubmit(manual);
  };

  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 1 of 5" />
      <section className="identify-stage">
        <div className="identify-intro">
          <span className="eyebrow">Start a label</span>
          <h1>Bring the facts.<br />Or bring the source.</h1>
          <p>Build the label from scratch, or paste one trustworthy product page and let GPT extract the coffee details for your review.</p>
          <ol className="workflow-steps workflow-steps-five" aria-label="Label workflow">
            <li className="is-active"><span>01</span> Input</li>
            <li><span>02</span> Review</li>
            <li><span>03</span> Color</li>
            <li><span>04</span> Label</li>
            <li><span>05</span> Print</li>
          </ol>
        </div>

        <div className="identify-entry-panel">
          <fieldset className="identify-mode-switch">
            <legend>How do you want to start?</legend>
            <label className={mode === 'source' ? 'is-selected' : ''}>
              <input type="radio" name="entry-mode" checked={mode === 'source'} onChange={() => setMode('source')} />
              <span><strong>Import from source</strong><small>Paste one product or producer page</small></span>
            </label>
            <label className={mode === 'manual' ? 'is-selected' : ''}>
              <input type="radio" name="entry-mode" checked={mode === 'manual'} onChange={() => setMode('manual')} />
              <span><strong>Manual entry</strong><small>Fill every label field yourself</small></span>
            </label>
          </fieldset>

          {mode === 'source' ? (
            <form className="identify-form identify-source-form" onSubmit={submitSource}>
              <span className="eyebrow">Import from source</span>
              <h2>Paste the page you trust.</h2>
              <p>GPT will read the supplied page first, extract the exact coffee, and return every fact on a review screen. It will not create the label until you approve.</p>
              <label>
                <span>Source URL</span>
                <input autoFocus required type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://roaster.com/coffee/…" />
              </label>
              <p className="identify-form-note">Best results come from an exact product, producer, or lot page—not a homepage or search result.</p>
              <button type="submit" className="button button-primary">Extract coffee details <span aria-hidden="true">→</span></button>
            </form>
          ) : (
            <form className="identify-form identify-manual-form" onSubmit={submitManual}>
              <div className="identify-manual-heading">
                <span className="eyebrow">Manual entry</span>
                <h2>Build from scratch.</h2>
              </div>
              <div className="identify-manual-grid">
                <label className="is-wide"><span>Coffee name</span><input autoFocus required minLength={2} maxLength={120} value={manual.coffeeName} onChange={(event) => updateManual('coffeeName', event.target.value)} placeholder="King Arthur Geisha" /></label>
                <label><span>Variety</span><input required minLength={2} maxLength={80} value={manual.variety} onChange={(event) => updateManual('variety', event.target.value)} placeholder="Geisha" /></label>
                <label><span>Processing</span><input required minLength={2} maxLength={80} value={manual.processing} onChange={(event) => updateManual('processing', event.target.value)} placeholder="Honey" /></label>
                <label><span>Altitude</span><input required minLength={2} maxLength={40} value={manual.altitude} onChange={(event) => updateManual('altitude', event.target.value)} placeholder="1800 masl" /></label>
                <label><span>Origin · line 1</span><input required minLength={2} maxLength={40} value={manual.originLine1} onChange={(event) => updateManual('originLine1', event.target.value)} placeholder="Colombia" /></label>
                <label><span>Origin · line 2</span><input required minLength={2} maxLength={40} value={manual.originLine2} onChange={(event) => updateManual('originLine2', event.target.value)} placeholder="Támesis" /></label>
                <label>
                  <span>Best for</span>
                  <select value={manual.brewMethod} onChange={(event) => updateManual('brewMethod', event.target.value as ManualCoffeeInput['brewMethod'])}>
                    <option value="pourover">Pourover</option>
                    <option value="espresso">Espresso</option>
                  </select>
                </label>
                <label className="is-wide"><span>Tasting notes</span><input required minLength={2} maxLength={180} value={manual.tastingNotes} onChange={(event) => updateManual('tastingNotes', event.target.value)} placeholder="Tangerine, peach, jasmine, honey" /></label>
              </div>
              <p className="identify-form-note">Separate tasting notes with commas. You will review everything before color creation.</p>
              <button type="submit" className="button button-primary">Review manual details <span aria-hidden="true">→</span></button>
            </form>
          )}

          {import.meta.env.DEV && onOpenReference && (
            <button type="button" className="text-button" onClick={onOpenReference}>Open calibrated reference directly</button>
          )}
        </div>
      </section>
    </main>
  );
}
