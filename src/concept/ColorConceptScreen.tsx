import { useMemo, useState, type CSSProperties } from 'react';
import { createLabelFixture } from '../label/fixtures/reference-label';
import { LabelRenderer } from '../label/renderer/LabelRenderer';
import { COFFEE_LABEL_V1 } from '../label/templates/coffee-label-v1';
import { useLabelValidation } from '../label/validation/use-label-validation';
import { researchResultToLabelInput, type ResearchRequest, type ResearchResponse } from '../research/research-types';
import { WorkflowHeader } from '../workflow/WorkflowHeader';
import { conceptColors, type LabelConceptColor, type LabelConceptResponse } from './concept-types';

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
  const selected = colors.find((color) => color.id === selectedId) ?? concept.recommended;
  const otherColors = colors.filter((color) => color.id !== selected.id);
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
        <aside className="concept-story-panel">
          <span className="eyebrow">{selected.role === 'suggested' ? 'AI recommendation' : 'Selected direction'}</span>
          <h1>{selected.name}</h1>
          <code>{selected.hex}</code>
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
              <span className="eyebrow">Other directions</span>
              <h2>Every color belongs to this coffee.</h2>
            </div>
            <span>{otherColors.length} options</span>
          </div>
          <div className="concept-option-list" role="radiogroup" aria-label="Color directions">
            {otherColors.map((color, index) => (
              <button
                type="button"
                role="radio"
                aria-checked="false"
                className="concept-option-card"
                key={color.id}
                onClick={() => setSelectedId(color.id)}
                style={{ '--option-color': color.hex, '--option-index': index } as CSSProperties}
              >
                <span className="concept-option-swatch" aria-hidden="true" />
                <span className="concept-option-copy">
                  <small>{color.role === 'suggested' ? 'AI recommendation' : color.hex}</small>
                  <strong>{color.name}</strong>
                  <p>{color.story}</p>
                </span>
                <span className="concept-option-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
