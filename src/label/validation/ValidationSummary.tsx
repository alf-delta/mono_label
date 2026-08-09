import type { LabelValidationResult, ValidationStatus } from './validation-types';

interface ValidationSummaryProps {
  status: ValidationStatus;
  result: LabelValidationResult | null;
}

export function ValidationSummary({ status, result }: ValidationSummaryProps) {
  if (status === 'measuring' || !result) {
    return (
      <section className="validation-summary is-measuring" aria-live="polite">
        <span className="validation-dot" />
        <div><strong>Measuring typography</strong><p>Loading exact font metrics and assets…</p></div>
      </section>
    );
  }

  const shrunk = Object.entries(result.layout).filter(([, layout]) => layout.didShrink);

  if (result.valid) {
    return (
      <section className="validation-summary is-valid" aria-live="polite">
        <span className="validation-dot" />
        <div>
          <strong>All content fits</strong>
          <p>{shrunk.length ? `${shrunk.length} field${shrunk.length === 1 ? '' : 's'} reduced within template limits.` : 'Default typography preserved.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="validation-errors" aria-live="polite">
      <div className="validation-errors-heading">
        <span className="validation-dot" />
        <strong>{result.errors.length} validation {result.errors.length === 1 ? 'issue' : 'issues'}</strong>
      </div>
      <ul>
        {result.errors.map((error, index) => (
          <li key={`${error.field}-${error.type}-${index}`}>
            <span>{error.field}</span>
            <p>{error.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

