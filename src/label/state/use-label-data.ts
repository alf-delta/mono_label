import { useCallback, useMemo, useState } from 'react';
import type { CoffeeLabel, CoffeeLabelInput } from '../../types/coffee-label';
import { normalizeCoffeeLabel } from '../data/normalize-coffee-label';

export function useLabelData(initialInput: CoffeeLabelInput) {
  const cloneInput = (input: CoffeeLabelInput): CoffeeLabelInput => ({
    ...input,
    producer: { ...input.producer },
    tastingNotes: [...input.tastingNotes],
  });

  const [labelInput, setLabelInput] = useState<CoffeeLabelInput>(() => cloneInput(initialInput));
  const labelData = useMemo<CoffeeLabel>(() => normalizeCoffeeLabel(labelInput), [labelInput]);

  const replaceLabelData = useCallback((input: CoffeeLabelInput) => {
    setLabelInput(cloneInput(input));
  }, []);

  const updateLabelInput = useCallback((update: (current: CoffeeLabelInput) => CoffeeLabelInput) => {
    setLabelInput((current) => cloneInput(update(current)));
  }, []);

  return { labelData, labelInput, replaceLabelData, updateLabelInput } as const;
}
