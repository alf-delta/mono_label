import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createLabelFixture } from '../label/fixtures/reference-label';
import { LabelRenderer } from '../label/renderer/LabelRenderer';
import { COFFEE_LABEL_V1 } from '../label/templates/coffee-label-v1';
import { useLabelValidation } from '../label/validation/use-label-validation';
import { researchResultToLabelInput } from '../research/research-to-label.js';
import type { ResearchRequest, ResearchResponse } from '../research/research-types';
import { WorkflowHeader } from '../workflow/WorkflowHeader';

const CREATIVE_STAGES = [
  'Reading the varietal',
  'Mapping tasting notes',
  'Building distinct directions',
  'Checking ivory contrast',
] as const;

export function CreatingLabel({ request, response }: { request: ResearchRequest; response: ResearchResponse }) {
  const [activeStage, setActiveStage] = useState(0);
  const fixture = useMemo(() => createLabelFixture(
    'concept-preview',
    'Color studio preview',
    'A neutral canvas while the bespoke palette is being created.',
    researchResultToLabelInput(response, '#5E5650'),
  ), [response]);
  const validation = useLabelValidation(fixture.label, COFFEE_LABEL_V1);
  const result = response.result;
  const facts = [
    result.variety.value,
    result.processing.value,
    ...(result.tastingNotes.value?.slice(0, 3) ?? []),
    result.producer.value?.line2,
  ].filter((value): value is string => Boolean(value));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, CREATIVE_STAGES.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="app-shell workflow-shell concept-creating-shell">
      <WorkflowHeader step="Step 3 of 5" />
      <section className="concept-creating-stage" aria-live="polite">
        <div className="concept-creating-copy">
          <span className="eyebrow">Monoblend color studio</span>
          <h1>Creating a color for<br />{request.coffeeName}.</h1>
          <p>We are translating the verified identity of this exact coffee into one lead color and three distinct directions.</p>
          <div className="concept-fact-cloud" aria-label="Coffee facts used for the palette">
            {facts.map((fact, index) => (
              <span key={`${fact}-${index}`} style={{ '--fact-index': index } as CSSProperties}>{fact}</span>
            ))}
          </div>
        </div>

        <div className="concept-creating-preview" aria-hidden="true">
          <div className="concept-preview-halo" />
          <div className="concept-preview-label">
            <LabelRenderer data={fixture.label} template={COFFEE_LABEL_V1} layout={validation.layout} />
          </div>
        </div>

        <ol className="concept-stage-list">
          {CREATIVE_STAGES.map((stage, index) => (
            <li key={stage} className={index < activeStage ? 'is-complete' : index === activeStage ? 'is-active' : ''}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{stage}</strong>
              <i aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
