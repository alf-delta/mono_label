import { useMemo } from 'react';
import { WorkflowHeader } from '../workflow/WorkflowHeader';
import { calculateImposition } from './imposition';
import { PRINT_FORMATS } from './print-formats';
import { SheetPreview } from './SheetPreview';
import type { ExportSettings, ExportSnapshot, ImpositionResult } from './export-types';

export function ExportWorkspace({ snapshot, settings, exporting, error, onSettingsChange, onBack, onExport }: {
  snapshot: ExportSnapshot;
  settings: ExportSettings;
  exporting: boolean;
  error?: string;
  onSettingsChange: (settings: ExportSettings) => void;
  onBack: () => void;
  onExport: (settings: ExportSettings, imposition: ImpositionResult) => void;
}) {
  const imposition = useMemo(() => calculateImposition(snapshot.template, settings), [settings, snapshot.template]);
  const update = <Key extends keyof ExportSettings>(key: Key, value: ExportSettings[Key]) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  const updateMark = (key: keyof ExportSettings['marks'], value: boolean) => {
    update('marks', { ...settings.marks, [key]: value });
  };

  return (
    <main className="app-shell export-shell">
      <WorkflowHeader step="Step 4 of 4" onStartOver={onBack} />
      <section className="export-workspace">
        <aside className="export-controls">
          <span className="eyebrow">Print setup</span>
          <h1>Build the sheet.</h1>
          <p>Physical dimensions are fixed. Choose the stock and the production marks your printer needs.</p>

          <fieldset>
            <legend>Sheet format</legend>
            <div className="format-options">
              {PRINT_FORMATS.map((format) => (
                <label key={format.id} className={settings.formatId === format.id ? 'format-option is-selected' : 'format-option'}>
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={settings.formatId === format.id}
                    onChange={() => update('formatId', format.id)}
                  />
                  <strong>{format.name}</strong>
                  <small>{format.family} · {format.widthMm} × {format.heightMm} mm</small>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="export-control-grid">
            <label>
              <span>Orientation</span>
              <select value={settings.orientation} onChange={(event) => update('orientation', event.target.value as ExportSettings['orientation'])}>
                <option value="auto">Auto maximum</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label>
              <span>Printer margin</span>
              <span className="unit-input"><input type="number" min="0" max="25" step="0.5" value={settings.marginMm} onChange={(event) => update('marginMm', Number(event.target.value))} /><em>mm</em></span>
            </label>
          </div>

          <fieldset>
            <legend>Quantity</legend>
            <label className="choice-row"><input type="radio" name="quantityMode" checked={settings.quantityMode === 'maximum'} onChange={() => update('quantityMode', 'maximum')} /><span><strong>Maximum</strong><small>{imposition.maximumQuantity} labels on this sheet</small></span></label>
            <label className="choice-row"><input type="radio" name="quantityMode" checked={settings.quantityMode === 'custom'} onChange={() => update('quantityMode', 'custom')} /><span><strong>Custom</strong><small>Any value up to the physical maximum</small></span></label>
            {settings.quantityMode === 'custom' && (
              <label className="quantity-input"><span>Labels</span><input type="number" min="1" max={imposition.maximumQuantity} value={Math.min(settings.quantity, imposition.maximumQuantity)} onChange={(event) => update('quantity', Number(event.target.value))} /></label>
            )}
          </fieldset>

          <fieldset>
            <legend>Print marks</legend>
            <label className="choice-row"><input type="checkbox" checked={settings.marks.cropMarks} onChange={(event) => updateMark('cropMarks', event.target.checked)} /><span><strong>Crop marks</strong><small>Trim coordinates around the imposed block</small></span></label>
            <label className="choice-row"><input type="checkbox" checked={settings.marks.cutterGuides} onChange={(event) => updateMark('cutterGuides', event.target.checked)} /><span><strong>Cutter guides</strong><small>Edge ticks for every guillotine cut</small></span></label>
            <label className="choice-row"><input type="checkbox" checked={settings.marks.registrationMarks} onChange={(event) => updateMark('registrationMarks', event.target.checked)} /><span><strong>Registration targets</strong><small>Top and bottom alignment targets</small></span></label>
          </fieldset>
        </aside>

        <section className="sheet-stage" aria-label="Print sheet preview">
          <div className="preview-header">
            <div><span className="eyebrow">Vector imposition</span><h2>{imposition.format.name} · {imposition.quantity} up</h2></div>
            <span className="status-badge"><i /> Outlined</span>
          </div>
          <div className="sheet-frame"><SheetPreview snapshot={snapshot} layout={imposition} settings={settings} /></div>
          <p className="preview-caption">Preview shows trim geometry and marks; the PDF uses exact millimetres.</p>
        </section>

        <aside className="export-summary">
          <span className="eyebrow">Production summary</span>
          <h2>Ready to impose</h2>
          <dl>
            <div><dt>Page</dt><dd>{imposition.pageWidthMm} × {imposition.pageHeightMm} mm</dd></div>
            <div><dt>Resolved orientation</dt><dd>{imposition.orientation}</dd></div>
            <div><dt>Grid</dt><dd>{imposition.columns} × {imposition.rows}</dd></div>
            <div><dt>Labels</dt><dd>{imposition.quantity} / {imposition.maximumQuantity}</dd></div>
            <div><dt>Label rotation</dt><dd>{imposition.labelRotation}°</dd></div>
            <div><dt>Bleed</dt><dd>{snapshot.template.bleedMm} mm</dd></div>
            <div><dt>Effective margin</dt><dd>{imposition.effectiveMarginMm} mm</dd></div>
          </dl>
          <div className="notice"><span aria-hidden="true">i</span><p>Repeated labels use common-cut lines. Text and icons are converted to paths before the PDF is generated.</p></div>
          {imposition.warnings.map((warning) => <p className="export-warning" key={warning}>{warning}</p>)}
          {error && <p className="export-error" role="alert">{error}</p>}
          <button type="button" className="button button-primary" disabled={exporting} onClick={() => onExport(settings, imposition)}>
            {exporting ? 'Building vector PDF…' : 'Generate print PDF'}
          </button>
          <button type="button" className="button button-secondary" disabled={exporting} onClick={onBack}>Back to label</button>
        </aside>
      </section>
    </main>
  );
}
