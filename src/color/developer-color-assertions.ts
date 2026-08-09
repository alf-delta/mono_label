import { resolveBackgroundColor } from './color-engine';

export interface ColorEngineAssertionSummary {
  approvedHex: string;
  adjustedHex: string;
  rejected: true;
}

/** Development-only contract check; imported behind import.meta.env.DEV. */
export function assertColorEngineContract(): ColorEngineAssertionSummary {
  const approved = resolveBackgroundColor('#7A4C5A');
  const adjusted = resolveBackgroundColor('#CC88A0');
  const rejected = resolveBackgroundColor('not-a-color');

  if (approved.status !== 'approved' || approved.finalHex !== '#7A4C5A') {
    throw new Error('Color engine approval contract failed.');
  }
  if (adjusted.status !== 'adjusted' || !adjusted.finalHex || !adjusted.validation.valid) {
    throw new Error('Color engine adjustment contract failed.');
  }
  if (rejected.status !== 'rejected' || rejected.finalHex !== null) {
    throw new Error('Color engine rejection contract failed.');
  }

  return Object.freeze({ approvedHex: approved.finalHex, adjustedHex: adjusted.finalHex, rejected: true });
}
