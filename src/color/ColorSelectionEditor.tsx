import { validateBackgroundColor } from './color-engine';
import { COLOR_CANDIDATES, SUGGESTED_COLOR, findNamedColor } from './color-library';
import type { ColorCandidate } from './color-types';

interface ColorSelectionEditorProps {
  currentHex: string;
  candidates?: readonly ColorCandidate[];
  onSelect: (hex: string) => void;
}

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ColorOption({ candidate, currentHex, onSelect }: {
  candidate: ColorCandidate;
  currentHex: string;
  onSelect: (hex: string) => void;
}) {
  const selected = currentHex.toLocaleUpperCase() === candidate.hex;
  return (
    <label className={selected ? 'color-option is-selected' : 'color-option'}>
      <input
        type="radio"
        name="background-color"
        value={candidate.hex}
        checked={selected}
        onChange={() => onSelect(candidate.hex)}
      />
      <span className="color-option-swatch" style={{ backgroundColor: candidate.hex }} aria-hidden="true" />
      <span className="color-option-copy">
        <strong>{candidate.name}</strong>
        <small>{candidate.hex} · {candidate.profile}</small>
        <small>{candidate.metrics.contrastRatio}:1 contrast · S {percentage(candidate.metrics.saturation)} · L {percentage(candidate.metrics.lightness)}</small>
      </span>
      <span className="color-option-check" aria-hidden="true">{selected ? '✓' : ''}</span>
    </label>
  );
}

export function ColorSelectionEditor({ currentHex, candidates = COLOR_CANDIDATES, onSelect }: ColorSelectionEditorProps) {
  const currentValidation = validateBackgroundColor(currentHex);
  const suggested = candidates.find((candidate) => candidate.role === 'suggested') ?? SUGGESTED_COLOR;
  const alternatives = candidates.filter((candidate) => candidate.id !== suggested.id);
  const currentName = candidates.find((candidate) => candidate.hex === currentHex.toLocaleUpperCase())?.name
    ?? findNamedColor(currentHex)?.name
    ?? 'CUSTOM / EXTERNAL COLOR';
  const displayHex = currentHex.toLocaleUpperCase();

  return (
    <div className="color-selection-editor">
      <div className={currentValidation.valid ? 'current-color is-valid' : 'current-color is-invalid'}>
        <span className="current-color-swatch" style={{ backgroundColor: currentHex }} aria-hidden="true" />
        <span>
          <small>Current background</small>
          <strong>{currentName}</strong>
          <code>{displayHex}</code>
        </span>
        <em>{currentValidation.valid ? 'Compliant' : 'Blocked'}</em>
      </div>

      <fieldset className="color-choice-group">
        <legend>AI choice</legend>
        <p className="color-choice-note">The recommended direction and its alternatives remain tied to the researched coffee and the same print-safety rules.</p>
        <ColorOption candidate={suggested} currentHex={currentHex} onSelect={onSelect} />
      </fieldset>

      <fieldset className="color-choice-group">
        <legend>Valid alternatives</legend>
        <div className="color-options">
          {alternatives.map((candidate) => (
            <ColorOption key={candidate.id} candidate={candidate} currentHex={currentHex} onSelect={onSelect} />
          ))}
        </div>
      </fieldset>

      <p className="color-library-note">
        {candidates.length} / {candidates.length} color directions pass the same ivory-foreground rules. Freeform color entry is intentionally unavailable.
      </p>
    </div>
  );
}
