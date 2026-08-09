import type { CSSProperties } from 'react';
import type { CoffeeLabelTemplate, TemplateBox } from '../templates/template-types';
import { EDITABLE_FIELD_LABELS, type EditableLabelField } from './editor-types';

interface InteractiveRegion {
  field: EditableLabelField;
  box: Pick<TemplateBox, 'x' | 'y' | 'width' | 'height'>;
  kind?: 'background';
}

interface LabelInteractionOverlayProps {
  template: CoffeeLabelTemplate;
  selectedField: EditableLabelField | null;
  onSelect: (field: EditableLabelField) => void;
}

function percent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export function LabelInteractionOverlay({ template, selectedField, onSelect }: LabelInteractionOverlayProps) {
  const r = template.regions;
  const brewLeft = Math.min(r.bestFor.x, r.brewIcon.x);
  const brewTop = Math.min(r.bestFor.y, r.brewIcon.y);
  const brewRight = Math.max(r.bestFor.x + r.bestFor.width, r.brewIcon.x + r.brewIcon.width);
  const brewBottom = Math.max(r.bestFor.y + r.bestFor.height, r.brewIcon.y + r.brewIcon.height);
  const regions: InteractiveRegion[] = [
    { field: 'backgroundColor', box: { x: 0, y: 0, width: template.widthMm, height: template.heightMm }, kind: 'background' },
    { field: 'variety', box: r.variety },
    { field: 'processing', box: r.processing },
    { field: 'altitude', box: r.altitude },
    { field: 'producer', box: r.producer },
    { field: 'brewMethod', box: { x: brewLeft, y: brewTop, width: brewRight - brewLeft, height: brewBottom - brewTop } },
    { field: 'coffeeName', box: r.coffeeName },
    { field: 'tastingNotes', box: r.tastingNotes },
  ];

  return (
    <div className="label-interaction-overlay" aria-label="Editable label regions">
      {regions.map(({ field, box, kind }) => {
        const style = {
          left: percent(box.x, template.widthMm),
          top: percent(box.y, template.heightMm),
          width: percent(box.width, template.widthMm),
          height: percent(box.height, template.heightMm),
        } as CSSProperties;

        return (
          <button
            key={field}
            type="button"
            className={[
              'label-edit-region',
              kind === 'background' ? 'is-background' : '',
              selectedField === field ? 'is-selected' : '',
            ].filter(Boolean).join(' ')}
            style={style}
            aria-label={`Edit ${EDITABLE_FIELD_LABELS[field]}`}
            onClick={() => onSelect(field)}
          >
            <span className="pencil-badge" aria-hidden="true">✎</span>
          </button>
        );
      })}
    </div>
  );
}
