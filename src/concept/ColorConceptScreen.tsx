import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { validateBackgroundColor } from '../color/color-engine';
import { normalizeHexColor } from '../color/color-math';
import { createLabelFixture } from '../label/fixtures/reference-label';
import { LabelRenderer } from '../label/renderer/LabelRenderer';
import { COFFEE_LABEL_V1 } from '../label/templates/coffee-label-v1';
import { useLabelValidation } from '../label/validation/use-label-validation';
import { researchResultToLabelInput } from '../research/research-to-label.js';
import type { ResearchRequest, ResearchResponse } from '../research/research-types';
import { WorkflowHeader } from '../workflow/WorkflowHeader';
import { conceptColors, type LabelConceptColor, type LabelConceptResponse } from './concept-types';

const MANUAL_COLOR_ID = 'manual-hex-color';

function normalizeManualHex(value: string): string | null {
  const trimmed = value.trim();
  return normalizeHexColor(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
}

export function ColorConceptScreen({ request, research, concept, onBack, onRegenerate, onContinue }: {
  request: ResearchRequest;
  research: ResearchResponse;
  concept: LabelConceptResponse;
  onBack: () => void;
  onRegenerate: () => void;
  onContinue: (color: LabelConceptColor) => void;
}) {
  const colors = conceptColors(concept);
  const [selectedId, setSelectedId] = useState(concept.recommended.id);
  const [manualColor, setManualColor] = useState<LabelConceptColor | null>(null);
  const [manualHex, setManualHex] = useState(concept.recommended.hex);
  const [manualError, setManualError] = useState<string | null>(null);
  const selected = selectedId === MANUAL_COLOR_ID && manualColor
    ? manualColor
    : colors.find((color) => color.id === selectedId) ?? concept.recommended;

  const selectDirection = (color: LabelConceptColor) => {
    setSelectedId(color.id);
    setManualHex(color.hex);
    setManualError(null);
  };

  const applyManualHex = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeManualHex(manualHex);
    if (!normalized) {
      setManualError('Enter a six-digit HEX code, for example #7A4C5A.');
      return;
    }

    const validation = validateBackgroundColor(normalized);
    if (!validation.valid || !validation.metrics) {
      setManualError(validation.issues[0]?.message ?? 'This color is outside the print-safe range.');
      return;
    }

    setManualColor({
      ...selected,
      id: MANUAL_COLOR_ID,
      name: 'Manual color',
      hex: normalized,
      requestedHex: normalized,
      profile: 'Manual HEX',
      role: 'alternative',
      resolution: 'approved',
      metrics: validation.metrics,
    });
    setSelectedId(MANUAL_COLOR_ID);
    setManualHex(normalized);
    setManualError(null);
  };
  const fixture = useMemo(() => createLabelFixture(
    'concept-result',
    selected.name,
    selected.story,
    researchResultToLabelInput(research, selected.hex),
  ), [research, selected]);
  const validation = useLabelValidation(fixture.label, COFFEE_LABEL_V1);
  const style = {
    '--concept-color': selected.hex,
    '--concept-ink': '#F9F7DE',
  } as CSSProperties;

  return (
    <main className="app-shell workflow-shell concept-result-shell" style={style}>
      <WorkflowHeader step="Step 4 of 5" onStartOver={onBack} />
      <section className="concept-result-stage">
        <aside className="concept-story-panel" data-selected-color={selected.hex}>
          <span className="eyebrow">{selected.id === MANUAL_COLOR_ID ? 'Manual color' : selected.role === 'suggested' ? 'AI recommendation' : 'Selected direction'}</span>
          <h1>{selected.name}</h1>
          <div className="concept-selected-color">
            <span style={{ '--selected-swatch': selected.hex } as CSSProperties} aria-hidden="true" />
            <form className={manualError ? 'concept-hex-form has-error' : 'concept-hex-form'} onSubmit={applyManualHex}>
              <label htmlFor="manual-concept-hex">Background HEX</label>
              <div>
                <input
                  id="manual-concept-hex"
                  aria-describedby="manual-concept-hex-feedback"
                  aria-invalid={Boolean(manualError)}
                  autoComplete="off"
                  inputMode="text"
                  maxLength={7}
                  spellCheck={false}
                  value={manualHex}
                  onChange={(event) => {
                    setManualHex(event.target.value.toLocaleUpperCase());
                    setManualError(null);
                  }}
                />
                <button type="submit">Apply</button>
              </div>
            </form>
          </div>
          <small id="manual-concept-hex-feedback" className={manualError ? 'concept-hex-feedback is-error' : 'concept-hex-feedback'}>
            {manualError ?? 'Enter a custom six-digit HEX. Print-safety rules still apply.'}
          </small>
          <p>{selected.story}</p>
          <div className="concept-anchor-list">
            {selected.anchors.map((anchor) => (
              <span key={`${anchor.field}-${anchor.value}`}><small>{anchor.field}</small>{anchor.value}</span>
            ))}
          </div>
          <div className="concept-story-actions">
            <button type="button" className="button button-primary" onClick={() => onContinue(selected)}>
              Continue with this color
            </button>
            <button type="button" className="button button-secondary" onClick={onRegenerate}>Create new directions</button>
          </div>
          <small className="concept-model-note">Created by {concept.meta.provider} · {concept.meta.model}</small>
        </aside>

        <div className="concept-label-gallery">
          <div className="concept-color-wash" aria-hidden="true" />
          <div className="concept-result-label" key={selected.id}>
            <LabelRenderer data={fixture.label} template={COFFEE_LABEL_V1} layout={validation.layout} />
          </div>
          <div className="concept-label-caption">
            <span>Live label preview</span>
            <strong>{request.coffeeName}</strong>
          </div>
        </div>

        <aside className="concept-options-panel">
          <div className="concept-options-heading">
            <div>
              <span className="eyebrow">Color directions</span>
              <h2>Choose the label background.</h2>
            </div>
            <span>{colors.length} options</span>
          </div>
          <div className="concept-option-list" role="radiogroup" aria-label="Color directions">
            {colors.map((color, index) => {
              const isSelected = color.id === selected.id;
              return (
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Select ${color.name} ${color.hex}`}
                className={isSelected ? 'concept-option-card is-selected' : 'concept-option-card'}
                key={color.id}
                onClick={() => selectDirection(color)}
                data-color-id={color.id}
                data-color-hex={color.hex}
                style={{ '--option-color': color.hex, '--option-index': index } as CSSProperties}
              >
                <span className="concept-option-swatch" aria-hidden="true" />
                <span className="concept-option-copy">
                  <small>{isSelected ? 'Selected' : color.role === 'suggested' ? 'AI recommendation' : color.hex}</small>
                  <strong>{color.name}</strong>
                  <p>{color.story}</p>
                </span>
                <span className="concept-option-arrow" aria-hidden="true">↗</span>
              </button>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
