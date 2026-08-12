import { useMemo, useState, type FormEvent } from 'react';
import type { CoffeeCandidate, CoffeeDiscoveryRequest, CoffeeDiscoveryResponse } from '../discovery/discovery-types';
import type { ResearchRequest } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

interface CandidateSelectionProps {
  request: CoffeeDiscoveryRequest;
  response: CoffeeDiscoveryResponse;
  onBack: () => void;
  onSelect: (request: ResearchRequest) => void;
}

function candidateRequest(candidate: CoffeeCandidate, canonicalVariety: string): ResearchRequest {
  const context = [
    `Origin country: ${candidate.country}`,
    candidate.region ? `Region: ${candidate.region}` : null,
    candidate.farm ? `Farm: ${candidate.farm}` : null,
    candidate.processing ? `Listed processing: ${candidate.processing}` : null,
    candidate.harvest ? `Listed harvest: ${candidate.harvest}` : null,
  ].filter(Boolean).join('\n');

  return {
    coffeeName: candidate.coffeeName,
    producer: candidate.producer,
    variety: candidate.variety || canonicalVariety,
    sourceUrl: candidate.sourceUrl,
    additionalInformation: context,
  };
}

export function CandidateSelection({ request, response, onBack, onSelect }: CandidateSelectionProps) {
  const [coffeeName, setCoffeeName] = useState('');
  const [producer, setProducer] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const groups = useMemo(() => {
    const grouped = new Map<string, CoffeeCandidate[]>();
    for (const candidate of response.candidates) {
      const candidates = grouped.get(candidate.country) ?? [];
      candidates.push(candidate);
      grouped.set(candidate.country, candidates);
    }
    return [...grouped.entries()];
  }, [response.candidates]);

  const submitManual = (event: FormEvent) => {
    event.preventDefault();
    onSelect({
      coffeeName,
      producer,
      variety: response.canonicalVariety || request.variety,
      sourceUrl,
      additionalInformation: 'Exact coffee identity supplied manually by the user.',
    });
  };

  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 2 of 5" onStartOver={onBack} />
      <section className="candidate-stage">
        <aside className="candidate-context">
          <span className="eyebrow">Choose exact coffee</span>
          <h1>{response.canonicalVariety}</h1>
          <p>{response.summary}</p>
          <dl>
            <div><dt>Countries</dt><dd>{groups.length}</dd></div>
            <div><dt>Verified coffees</dt><dd>{response.candidates.length}</dd></div>
            <div><dt>Model</dt><dd>{response.meta.model}</dd></div>
          </dl>
          <button type="button" className="text-button candidate-back" onClick={onBack}>Change variety</button>
        </aside>

        <div className="candidate-results">
          {groups.length ? groups.map(([country, candidates]) => (
            <section className="candidate-country" key={country}>
              <div className="candidate-country-heading">
                <h2>{country}</h2>
                <span>{candidates.length} {candidates.length === 1 ? 'coffee' : 'coffees'}</span>
              </div>
              <div className="candidate-list">
                {candidates.map((candidate) => (
                  <article className="candidate-card" key={`${candidate.sourceUrl}-${candidate.coffeeName}`}>
                    <button type="button" onClick={() => onSelect(candidateRequest(candidate, response.canonicalVariety))}>
                      <span className="candidate-card-copy">
                        <small>{[candidate.producer, candidate.farm].filter(Boolean).join(' · ')}</small>
                        <strong>{candidate.coffeeName}</strong>
                        <span>{[candidate.region, candidate.processing, candidate.harvest].filter(Boolean).join(' · ') || candidate.variety}</span>
                      </span>
                      <span className="candidate-card-arrow" aria-hidden="true">↗</span>
                    </button>
                    <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Source · {candidate.sourceTitle}</a>
                  </article>
                ))}
              </div>
            </section>
          )) : (
            <div className="candidate-empty">
              <span className="eyebrow">No exact matches</span>
              <h2>Use the source you trust.</h2>
              <p>The finder did not locate a sufficiently specific product or lot page. Nothing was guessed.</p>
            </div>
          )}
        </div>

        <aside className="candidate-manual">
          <span className="eyebrow">Not in the list?</span>
          <h2>Add exact source</h2>
          <p>Paste the producer or roaster page for this exact coffee. All three fields are required so the next step cannot confuse it with another lot.</p>
          <form onSubmit={submitManual}>
            <label><span>Exact coffee / lot</span><input required minLength={2} maxLength={120} value={coffeeName} onChange={(event) => setCoffeeName(event.target.value)} placeholder="King Arthur Geisha" /></label>
            <label><span>Producer / farm</span><input required minLength={2} maxLength={120} value={producer} onChange={(event) => setProducer(event.target.value)} placeholder="Elkin Arcila" /></label>
            <label><span>Source URL</span><input required type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" /></label>
            <button type="submit" className="button button-secondary">Research this coffee</button>
          </form>
        </aside>
      </section>
    </main>
  );
}
