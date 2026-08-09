# Deterministic color engine

Milestone 5 keeps semantic suggestion separate from print approval:

1. A named candidate enters the engine as `{ name, hex }`.
2. `color-engine.ts` calculates contrast, relative luminance, HSL saturation, and HSL lightness.
3. Thresholds live only in `color-rules.ts`.
4. A valid candidate is approved unchanged; a parseable out-of-range candidate is adjusted deterministically when possible; otherwise it is rejected.
5. Only approved library candidates are exposed in the primary Review interface.

The foreground remains fixed. There is no freeform color picker. `ColorCandidate` includes the fields needed for a future persistence adapter without coupling the engine to a database.
