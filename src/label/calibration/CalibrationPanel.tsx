import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';
import type { CoffeeLabelTemplate, TemplateRegionKey } from '../templates/template-types';
import type { LabelTextLayout, TextLayoutRegion } from '../validation/validation-types';
import { measureRegion, type RegionMeasurement } from './template-calibration';

const EDITABLE_NUMBERS = ['x', 'y', 'width', 'height', 'fontSize', 'lineHeight', 'letterSpacing'] as const;
type EditableNumber = (typeof EDITABLE_NUMBERS)[number];

interface CalibrationPanelProps {
  template: CoffeeLabelTemplate;
  selectedRegion: TemplateRegionKey;
  frameRef: RefObject<HTMLDivElement | null>;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  onRegionChange: (region: TemplateRegionKey) => void;
  onNumberChange: (field: EditableNumber, value: number) => void;
  onReset: () => void;
  layout: LabelTextLayout;
}

export function CalibrationPanel({
  template,
  selectedRegion,
  frameRef,
  showGrid,
  onShowGridChange,
  onRegionChange,
  onNumberChange,
  onReset,
  layout,
}: CalibrationPanelProps) {
  const [measurement, setMeasurement] = useState<RegionMeasurement>(() =>
    measureRegion(frameRef.current?.querySelector('svg') ?? null, selectedRegion, template),
  );
  const box = template.regions[selectedRegion];
  const fitted = selectedRegion in layout ? layout[selectedRegion as TextLayoutRegion] : null;

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMeasurement(measureRegion(frameRef.current?.querySelector('svg') ?? null, selectedRegion, template));
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedRegion, frameRef, layout, template]);

  const copyTemplate = async () => {
    await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
  };

  return (
    <aside className="calibration-panel">
      <div className="calibration-heading">
        <div>
          <span className="eyebrow">Developer mode</span>
          <h2>Template calibration</h2>
        </div>
        <span className="live-indicator">Live</span>
      </div>

      <label className="field-label" htmlFor="region">Region</label>
      <select id="region" value={selectedRegion} onChange={(event) => onRegionChange(event.target.value as TemplateRegionKey)}>
        {Object.keys(template.regions).map((region) => (
          <option value={region} key={region}>{region}</option>
        ))}
      </select>

      <div className="number-grid">
        {EDITABLE_NUMBERS.map((field) => (
          <label key={field}>
            <span>{field}</span>
            <input
              type="number"
              step={field === 'lineHeight' ? 0.01 : 0.1}
              value={box[field]}
              disabled={field === 'fontSize' && selectedRegion === 'brewIcon'}
              onChange={(event) => onNumberChange(field, Number(event.target.value))}
            />
          </label>
        ))}
      </div>

      <dl className="measurements">
        <div><dt>Measured width</dt><dd>{measurement.renderedWidth?.toFixed(2) ?? '—'} mm</dd></div>
        <div><dt>Measured height</dt><dd>{measurement.renderedHeight?.toFixed(2) ?? '—'} mm</dd></div>
        <div><dt>Baseline</dt><dd>{measurement.baseline.toFixed(2)} mm</dd></div>
        <div><dt>Overflow</dt><dd className={measurement.overflow ? 'status-error' : 'status-ok'}>{measurement.overflow ? 'Yes' : 'No'}</dd></div>
        <div><dt>Font role</dt><dd>{box.fontRole}</dd></div>
        <div><dt>Rendered size</dt><dd>{fitted ? `${fitted.fontSize.toFixed(2)} mm` : '—'}</dd></div>
        <div><dt>Fit result</dt><dd className={fitted && !fitted.fits ? 'status-error' : 'status-ok'}>{fitted ? (fitted.fits ? 'Fits' : 'Overflow') : 'Fixed'}</dd></div>
        <div><dt>Policy</dt><dd>{box.overflow}</dd></div>
      </dl>

      <label className="switch-row">
        <input type="checkbox" checked={showGrid} onChange={(event) => onShowGridChange(event.target.checked)} />
        <span>Show 5 mm grid</span>
      </label>

      <div className="calibration-actions">
        <button type="button" className="button button-secondary" onClick={onReset}>Reset</button>
        <button type="button" className="button button-secondary" onClick={copyTemplate}>Copy JSON</button>
      </div>
      <p className="calibration-note">Changes are session-only. Final calibrated values belong in coffee-label-v1.ts.</p>
    </aside>
  );
}
