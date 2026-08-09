import { WorkflowHeader } from '../workflow/WorkflowHeader';
import { downloadBlob } from './export-client';
import type { ExportResult, ExportSnapshot } from './export-types';

export function ExportComplete({ snapshot, result, onBack, onStartOver }: {
  snapshot: ExportSnapshot;
  result: ExportResult;
  onBack: () => void;
  onStartOver: () => void;
}) {
  return (
    <main className="app-shell workflow-shell">
      <WorkflowHeader step="Export complete" onStartOver={onStartOver} />
      <section className="export-complete">
        <span className="export-complete-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Vector PDF ready</p>
        <h1>{snapshot.labelData.coffeeName}</h1>
        <p>{result.imposition.quantity} labels imposed on {result.imposition.format.name}. Text is outlined and the page is set to physical size.</p>
        <dl>
          <div><dt>File</dt><dd>{result.filename}</dd></div>
          <div><dt>Page</dt><dd>{result.imposition.pageWidthMm} × {result.imposition.pageHeightMm} mm</dd></div>
          <div><dt>Template</dt><dd>{snapshot.templateId}@{snapshot.templateVersion}</dd></div>
          <div><dt>Snapshot</dt><dd>{snapshot.id.slice(0, 8)}</dd></div>
        </dl>
        <div>
          <button type="button" className="button button-primary" onClick={() => downloadBlob(result.downloadUrl, result.filename)}>Download again</button>
          <button type="button" className="button button-secondary" onClick={onBack}>Change sheet setup</button>
        </div>
      </section>
    </main>
  );
}
