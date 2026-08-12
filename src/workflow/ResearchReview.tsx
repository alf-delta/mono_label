import { unresolvedResearchFields } from '../research/normalize-research';
import type { CoffeeResearchResult, ResearchRequest, ResearchResponse, SourcedResearchField } from '../research/research-types';
import { WorkflowHeader } from './WorkflowHeader';

interface ResearchReviewProps {
  request: ResearchRequest;
  response: ResearchResponse;
  onBack: () => void;
  onCreateLabel: () => void;
}

function displayValue(value: unknown): string {
  if (value === null) return 'Unknown';
  if (Array.isArray(value)) return value.join(' · ');
  if (typeof value === 'object') return Object.values(value as Record<string, string>).filter(Boolean).join(' / ');
  return String(value);
}

function isResolved(field: SourcedResearchField<unknown>): boolean {
  if (field.value === null || field.confidence === 'unknown') return false;
  return !Array.isArray(field.value) || field.value.length > 0;
}

function ResearchField({ label, field, sourceTitles }: {
  label: string;
  field: SourcedResearchField<unknown>;
  sourceTitles: ReadonlyMap<string, string>;
}) {
  const unresolved = field.value === null || field.confidence === 'unknown';
  return (
    <article className={unresolved ? 'research-field is-unresolved' : 'research-field'}>
      <div className="research-field-heading">
        <span>{label}</span>
        <em className={`confidence confidence-${field.confidence}`}>{field.confidence}</em>
      </div>
      <strong>{displayValue(field.value)}</strong>
      <div className="field-sources">
        {field.sources.length ? field.sources.map((url) => (
          <a key={url} href={url} target="_blank" rel="noreferrer">{sourceTitles.get(url) ?? new URL(url).hostname}</a>
        )) : <small>No verified source attached</small>}
      </div>
    </article>
  );
}

export function ResearchReview({ request, response, onBack, onCreateLabel }: ResearchReviewProps) {
  const result: CoffeeResearchResult = response.result;
  const unresolved = unresolvedResearchFields(result);
  const sourceTitles = new Map(response.sources.map((source) => [source.url, source.title]));
  const criticalFields: Array<[string, SourcedResearchField<unknown>]> = [
    ['coffee name', result.coffeeName],
    ['variety', result.variety],
    ['producer', result.producer],
    ['tasting profile', result.tastingNotes],
  ];
  const missingCritical = criticalFields.filter(([, field]) => !isResolved(field)).map(([label]) => label);
  const canCreateLabel = missingCritical.length === 0;
  const fields: Array<[string, SourcedResearchField<unknown>]> = [
    ['Coffee name', result.coffeeName],
    ['Variety', result.variety],
    ['Processing', result.processing],
    ['Altitude', result.altitude],
    ['Producer / location', result.producer],
    ['Tasting notes', result.tastingNotes],
    ['Best for', result.brewMethod],
  ];

  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Step 3 of 5" onStartOver={onBack} />
      <section className="research-review-stage">
        <aside className="research-review-context">
          <span className="eyebrow">Research review</span>
          <h1>{request.coffeeName}</h1>
          <p>{result.summary}</p>
          <dl>
            <div><dt>Provider</dt><dd>{response.meta.provider}</dd></div>
            <div><dt>Model</dt><dd>{response.meta.model}</dd></div>
            <div><dt>Sources</dt><dd>{response.sources.length}</dd></div>
          </dl>
          <div className={unresolved.length ? 'research-readiness has-issues' : 'research-readiness'}>
            <strong>{unresolved.length ? `${unresolved.length} unresolved` : 'Research complete'}</strong>
            <p>{unresolved.length ? 'Continue to correct these fields manually in Label Review.' : 'All required fields have sourced values.'}</p>
          </div>
        </aside>
        <div className="research-fields">
          {fields.map(([label, field]) => <ResearchField key={label} label={label} field={field} sourceTitles={sourceTitles} />)}
        </div>
        <aside className="research-decision">
          <span className="eyebrow">{canCreateLabel ? 'Ready for color' : 'Identity incomplete'}</span>
          <h2>{canCreateLabel ? 'Create its identity' : 'Verify this coffee'}</h2>
          <p>The color studio will translate the verified variety and profile into one recommendation and three coffee-specific alternatives.</p>
          <div className="research-creative-facts">
            {[result.variety.value, ...(result.tastingNotes.value?.slice(0, 3) ?? [])].filter(Boolean).map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </div>
          {!canCreateLabel && <p className="research-create-warning">Missing verified {missingCritical.join(', ')}. Choose another exact source or research this variety again.</p>}
          <div className="research-decision-actions">
            <button type="button" className="button button-primary" disabled={!canCreateLabel} onClick={onCreateLabel}>Create label <span aria-hidden="true">→</span></button>
            <button type="button" className="button button-secondary" onClick={onBack}>Research again</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
