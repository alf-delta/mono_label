import type { CoffeeLabelInput } from '../../types/coffee-label';
import { ColorSelectionEditor } from '../../color/ColorSelectionEditor';
import type { LabelValidationError } from '../validation/validation-types';
import { EDITABLE_FIELD_LABELS, type EditableLabelField } from './editor-types';
import type { ColorCandidate } from '../../color/color-types';

interface ContextualEditorProps {
  field: EditableLabelField;
  input: CoffeeLabelInput;
  tastingNotesMaxCount: number;
  errors: readonly LabelValidationError[];
  colorCandidates?: readonly ColorCandidate[];
  onChange: (update: (current: CoffeeLabelInput) => CoffeeLabelInput) => void;
  onClose: () => void;
}

const SINGLE_FIELDS = ['variety', 'processing', 'altitude', 'coffeeName'] as const;
type SingleField = (typeof SINGLE_FIELDS)[number];

function isSingleField(field: EditableLabelField): field is SingleField {
  return (SINGLE_FIELDS as readonly string[]).includes(field);
}

export function ContextualEditor({
  field,
  input,
  tastingNotesMaxCount,
  errors,
  colorCandidates,
  onChange,
  onClose,
}: ContextualEditorProps) {
  const fieldErrors = errors.filter((error) => error.field === field || error.field.startsWith(`${field}.`));

  const updateSingle = (singleField: SingleField, value: string) => {
    onChange((current) => ({ ...current, [singleField]: value }));
  };

  const updateNote = (index: number, value: string) => {
    onChange((current) => ({
      ...current,
      tastingNotes: current.tastingNotes.map((note, noteIndex) => noteIndex === index ? value : note),
    }));
  };

  const removeNote = (index: number) => {
    onChange((current) => ({
      ...current,
      tastingNotes: current.tastingNotes.filter((_, noteIndex) => noteIndex !== index),
    }));
  };

  const addNote = () => {
    if (input.tastingNotes.length >= tastingNotesMaxCount) return;
    onChange((current) => ({ ...current, tastingNotes: [...current.tastingNotes, ''] }));
  };

  return (
    <div className="contextual-editor" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
      <div className="editor-heading">
        <div>
          <span className="eyebrow">Editing block</span>
          <h2>{EDITABLE_FIELD_LABELS[field]}</h2>
        </div>
        <button type="button" className="editor-close" aria-label="Close editor" onClick={onClose}>×</button>
      </div>
      <p className="editor-help">Changes update the canonical SVG immediately. Layout and typography rules remain locked.</p>

      {isSingleField(field) && (
        <label className="editor-field">
          <span>{EDITABLE_FIELD_LABELS[field]}</span>
          <input
            autoFocus
            type="text"
            value={input[field]}
            onChange={(event) => updateSingle(field, event.target.value)}
          />
        </label>
      )}

      {field === 'producer' && (
        <div className="producer-editor">
          <label className="editor-field">
            <span>Line 1</span>
            <input
              autoFocus
              type="text"
              value={input.producer.line1}
              onChange={(event) => onChange((current) => ({
                ...current,
                producer: { ...current.producer, line1: event.target.value },
              }))}
            />
          </label>
          <label className="editor-field">
            <span>Line 2</span>
            <input
              type="text"
              value={input.producer.line2}
              onChange={(event) => onChange((current) => ({
                ...current,
                producer: { ...current.producer, line2: event.target.value },
              }))}
            />
          </label>
          <p className="editor-footnote">The printed line break is fixed here; browser wrapping is never used.</p>
        </div>
      )}

      {field === 'tastingNotes' && (
        <div className="notes-editor">
          <div className="notes-counter">{input.tastingNotes.length} / {tastingNotesMaxCount}</div>
          {input.tastingNotes.map((note, index) => (
            <div className="note-row" key={index}>
              <label>
                <span>Note {index + 1}</span>
                <input
                  autoFocus={index === 0}
                  type="text"
                  value={note}
                  onChange={(event) => updateNote(index, event.target.value)}
                />
              </label>
              <button type="button" aria-label={`Remove tasting note ${index + 1}`} onClick={() => removeNote(index)}>×</button>
            </div>
          ))}
          <button
            type="button"
            className="button button-secondary add-note"
            disabled={input.tastingNotes.length >= tastingNotesMaxCount}
            onClick={addNote}
          >
            Add note
          </button>
        </div>
      )}

      {field === 'brewMethod' && (
        <fieldset className="brew-editor">
          <legend>Choose one supported method</legend>
          {(['pourover', 'espresso'] as const).map((method) => (
            <label key={method} className={input.brewMethod === method ? 'brew-option is-selected' : 'brew-option'}>
              <input
                type="radio"
                name="brew-method"
                value={method}
                checked={input.brewMethod === method}
                onChange={() => onChange((current) => ({ ...current, brewMethod: method }))}
              />
              <img src={`/assets/brew/${method}.svg`} alt="" />
              <span>{method}</span>
            </label>
          ))}
        </fieldset>
      )}

      {field === 'backgroundColor' && (
        <ColorSelectionEditor
          currentHex={input.backgroundColor}
          candidates={colorCandidates}
          onSelect={(backgroundColor) => onChange((current) => ({ ...current, backgroundColor }))}
        />
      )}

      {fieldErrors.length > 0 && (
        <div className="field-errors" role="alert">
          {fieldErrors.map((error, index) => <p key={`${error.field}-${error.type}-${index}`}>{error.message}</p>)}
        </div>
      )}
    </div>
  );
}
