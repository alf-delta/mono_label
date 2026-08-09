import { useEffect, useMemo, useRef, useState } from 'react';
import { findNamedColor } from '../color/color-library';
import { CalibrationPanel } from '../label/calibration/CalibrationPanel';
import { updateRegionNumber } from '../label/calibration/template-calibration';
import { ContextualEditor } from '../label/editor/ContextualEditor';
import type { EditableLabelField } from '../label/editor/editor-types';
import { LabelInteractionOverlay } from '../label/editor/LabelInteractionOverlay';
import { REFERENCE_FIXTURE, type LabelFixture } from '../label/fixtures/reference-label';
import { LabelRenderer } from '../label/renderer/LabelRenderer';
import { useLabelData } from '../label/state/use-label-data';
import { COFFEE_LABEL_V1 } from '../label/templates/coffee-label-v1';
import type { CoffeeLabelTemplate, TemplateRegionKey } from '../label/templates/template-types';
import { useLabelValidation } from '../label/validation/use-label-validation';
import { ValidationSummary } from '../label/validation/ValidationSummary';
import { createExportSnapshot } from '../export/create-export-snapshot';
import type { ExportSnapshot } from '../export/export-types';
import type { ColorCandidate } from '../color/color-types';

const isCalibrationMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('calibrate') === '1';
type DeveloperFixturesModule = typeof import('../label/fixtures/developer-fixtures');
type DeveloperFixtureId = import('../label/fixtures/developer-fixtures').DeveloperFixtureId;

interface ReviewWorkspaceProps {
  initialFixture?: LabelFixture;
  colorCandidates?: readonly ColorCandidate[];
  onStartOver?: () => void;
  onApprove?: (snapshot: ExportSnapshot) => void;
}

export function ReviewWorkspace({ initialFixture = REFERENCE_FIXTURE, colorCandidates, onStartOver, onApprove }: ReviewWorkspaceProps) {
  const [activeFixture, setActiveFixture] = useState<LabelFixture>(initialFixture);
  const [developerFixtures, setDeveloperFixtures] = useState<DeveloperFixturesModule | null>(null);
  const { labelData, labelInput, replaceLabelData, updateLabelInput } = useLabelData(activeFixture.input);
  const [template, setTemplate] = useState<CoffeeLabelTemplate>(() => structuredClone(COFFEE_LABEL_V1));
  const [selectedRegion, setSelectedRegion] = useState<TemplateRegionKey>('coffeeName');
  const [showGrid, setShowGrid] = useState(false);
  const [editingField, setEditingField] = useState<EditableLabelField | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const labelSvgRef = useRef<SVGSVGElement>(null);
  const validation = useLabelValidation(labelData, template);
  const isDirty = useMemo(
    () => JSON.stringify(labelInput) !== JSON.stringify(activeFixture.input),
    [activeFixture.input, labelInput],
  );
  const backgroundColorName = colorCandidates?.find((candidate) => candidate.hex === labelData.backgroundColor)?.name
    ?? findNamedColor(labelData.backgroundColor)?.name
    ?? 'EXTERNAL COLOR';

  const templateSummary = useMemo(
    () => `${template.widthMm} × ${template.heightMm} mm · ${template.bleedMm} mm bleed`,
    [template],
  );

  const calibrationHref = useMemo(() => {
    const url = new URL(window.location.href);
    if (isCalibrationMode) url.searchParams.delete('calibrate');
    else url.searchParams.set('calibrate', '1');
    return `${url.pathname}${url.search}`;
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    void import('../color/developer-color-assertions').then(({ assertColorEngineContract }) => {
      assertColorEngineContract();
    });

    void import('../export/developer-imposition-assertions').then(({ assertImpositionContract }) => {
      assertImpositionContract();
    });

    void import('../label/fixtures/developer-fixtures').then((module) => {
      setDeveloperFixtures(module);
      const requested = new URLSearchParams(window.location.search).get('fixture');
      if (!module.isDeveloperFixtureId(requested)) return;
      const fixture = module.DEVELOPER_LABEL_FIXTURES[requested];
      setActiveFixture(fixture);
      replaceLabelData(fixture.input);
      setEditingField(null);
    });
  }, [replaceLabelData]);

  const selectFixture = (fixtureId: DeveloperFixtureId) => {
    if (!developerFixtures) return;
    const fixture = developerFixtures.DEVELOPER_LABEL_FIXTURES[fixtureId];
    setActiveFixture(fixture);
    replaceLabelData(fixture.input);
    setEditingField(null);

    const url = new URL(window.location.href);
    if (fixtureId === 'reference') url.searchParams.delete('fixture');
    else url.searchParams.set('fixture', fixtureId);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  const changeNumber = (
    field: 'x' | 'y' | 'width' | 'height' | 'fontSize' | 'lineHeight' | 'letterSpacing',
    value: number,
  ) => {
    if (!Number.isFinite(value)) return;
    setTemplate((current) => updateRegionNumber(current, selectedRegion, field, value));
  };

  return (
    <main className={isCalibrationMode ? 'app-shell calibration-active' : 'app-shell'}>
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Monoblend Label Studio home">
          <span className="wordmark-mark" aria-hidden="true">M</span>
          <span>MONOBLEND</span>
        </a>
        <div className="topbar-title">
          <span className="eyebrow">Label Studio</span>
          <span className="milestone">Print-ready review · M7</span>
        </div>
        <div className="topbar-actions">
          {onStartOver && <button type="button" className="topbar-action" onClick={onStartOver}>New coffee</button>}
          {import.meta.env.DEV && (
            <a className="calibration-link" href={calibrationHref}>
              {isCalibrationMode ? 'Exit calibration' : 'Calibrate template'}
            </a>
          )}
        </div>
      </header>

      <section className="workspace">
        <aside className="context-panel">
          <span className="eyebrow">{activeFixture.name}{isDirty ? ' · Edited' : ''}</span>
          <h1>{labelData.coffeeName}</h1>
          <p className="context-copy">{activeFixture.description}</p>

          {import.meta.env.DEV && developerFixtures && developerFixtures.isDeveloperFixtureId(activeFixture.id) && (
            <developerFixtures.DeveloperFixturePicker
              fixtures={developerFixtures.DEVELOPER_LABEL_FIXTURE_LIST}
              selectedId={activeFixture.id}
              onChange={selectFixture}
            />
          )}

          <dl className="coffee-summary">
            <div><dt>Variety</dt><dd>{labelData.variety}</dd></div>
            <div><dt>Process</dt><dd>{labelData.processing}</dd></div>
            <div><dt>Origin</dt><dd>{labelData.producer.line2}, {labelData.producer.line1}</dd></div>
            <div><dt>Best for</dt><dd>{labelData.brewMethod.toLocaleUpperCase()}</dd></div>
          </dl>

          <div className="template-meta">
            <span>Template</span>
            <strong>{template.id}</strong>
            <small>{templateSummary}</small>
          </div>
        </aside>

        <section className="preview-stage" aria-label="Label preview">
          <div className="preview-header">
            <div>
              <span className="eyebrow">Canonical renderer</span>
              <h2>Print preview</h2>
            </div>
            <span className="status-badge"><i /> SVG live</span>
          </div>

          <div className="label-frame" ref={frameRef}>
            <div className="label-canvas">
              <LabelRenderer
                svgRef={labelSvgRef}
                data={labelData}
                template={template}
                calibration={isCalibrationMode}
                showGrid={showGrid}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                layout={validation.layout}
              />
              {!isCalibrationMode && (
                <LabelInteractionOverlay
                  template={template}
                  selectedField={editingField}
                  onSelect={setEditingField}
                />
              )}
            </div>
          </div>
          <p className="preview-caption">Preview scales responsively; geometry remains fixed in physical template units.</p>
        </section>

        {isCalibrationMode ? (
          <CalibrationPanel
            template={template}
            selectedRegion={selectedRegion}
            frameRef={frameRef}
            showGrid={showGrid}
            onShowGridChange={setShowGrid}
            onRegionChange={setSelectedRegion}
            onNumberChange={changeNumber}
            onReset={() => setTemplate(structuredClone(COFFEE_LABEL_V1))}
            layout={validation.layout}
          />
        ) : (
          <aside className="details-panel">
            {editingField ? (
              <>
                <ContextualEditor
                  field={editingField}
                  input={labelInput}
                  tastingNotesMaxCount={template.tastingNotesMaxCount}
                  errors={validation.result?.errors ?? []}
                  colorCandidates={colorCandidates}
                  onChange={updateLabelInput}
                  onClose={() => setEditingField(null)}
                />
                <ValidationSummary status={validation.status} result={validation.result} />
              </>
            ) : (
              <>
                <span className="eyebrow">Milestone 7</span>
                <h2>Review label</h2>
                <p>Hover or focus a label block to reveal its edit control.</p>
                <ValidationSummary status={validation.status} result={validation.result} />
                <button
                  type="button"
                  className="swatch-row swatch-button"
                  aria-label="Edit Background color"
                  onClick={() => setEditingField('backgroundColor')}
                >
                  <span className="color-swatch" style={{ backgroundColor: labelData.backgroundColor }} />
                  <span className="swatch-copy"><small>Background · editable</small><strong>{backgroundColorName} · {labelData.backgroundColor}</strong></span>
                  <span className="swatch-edit" aria-hidden="true">✎</span>
                </button>
                <div className="swatch-row">
                  <span className="color-swatch" style={{ backgroundColor: labelData.foregroundColor }} />
                  <span className="swatch-copy"><small>Foreground · fixed</small><strong>{labelData.foregroundColor}</strong></span>
                </div>
                <div className="notice">
                  <span aria-hidden="true">i</span>
                  <p>Content is editable; typography, alignment, and geometry remain template-controlled.</p>
                </div>
                {isDirty && (
                  <button
                    type="button"
                    className="button button-secondary reset-content"
                    onClick={() => replaceLabelData(activeFixture.input)}
                  >
                    Reset content
                  </button>
                )}
                <button
                  type="button"
                  className="button button-primary"
                  disabled={validation.status !== 'ready' || !validation.result?.valid || !onApprove}
                  onClick={() => {
                    if (!labelSvgRef.current || !validation.result?.valid) return;
                    onApprove?.(createExportSnapshot(labelData, template, validation.result.layout, labelSvgRef.current));
                  }}
                >
                  Approve &amp; export
                </button>
              </>
            )}
          </aside>
        )}
      </section>
    </main>
  );
}
