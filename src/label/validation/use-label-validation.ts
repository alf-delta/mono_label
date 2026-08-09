import { useEffect, useMemo, useState } from 'react';
import type { CoffeeLabel } from '../../types/coffee-label';
import type { CoffeeLabelTemplate } from '../templates/template-types';
import { createCanvasTextMeasurer } from '../typography/text-measurer';
import { loadValidationResources } from './validation-resources';
import { createDefaultLabelLayout, validateLabel } from './validate-label';
import type { LabelValidationResult, ValidationStatus } from './validation-types';

interface ValidationState {
  key: string;
  result: LabelValidationResult;
}

export function useLabelValidation(data: Readonly<CoffeeLabel>, template: CoffeeLabelTemplate) {
  const key = useMemo(() => JSON.stringify([data, template]), [data, template]);
  const [state, setState] = useState<ValidationState | null>(null);
  const fallbackLayout = useMemo(() => createDefaultLabelLayout(data, template), [data, template]);

  useEffect(() => {
    let cancelled = false;

    void loadValidationResources(data.brewMethod).then((resources) => {
      if (cancelled) return;
      const result = validateLabel(data, template, createCanvasTextMeasurer(), resources);
      setState({ key, result });
    });

    return () => {
      cancelled = true;
    };
  }, [data, key, template]);

  const ready = state?.key === key;
  return {
    status: (ready ? 'ready' : 'measuring') as ValidationStatus,
    result: ready ? state.result : null,
    layout: ready ? state.result.layout : fallbackLayout,
  } as const;
}

