export type WorkflowState =
  | 'identify'
  | 'discovering'
  | 'candidate-selection'
  | 'discovery-error'
  | 'researching'
  | 'research-review'
  | 'creating-label'
  | 'color-selection'
  | 'label-concept-error'
  | 'final-review'
  | 'exporting'
  | 'complete'
  | 'error';

import type { LabelFixture } from '../label/fixtures/reference-label';
import type { ResearchRequest, ResearchResponse } from '../research/research-types';
import type { ExportResult, ExportSettings, ExportSnapshot, ImpositionResult } from '../export/export-types';
import type { LabelConceptResponse } from '../concept/concept-types';
import type { CoffeeDiscoveryRequest, CoffeeDiscoveryResponse } from '../discovery/discovery-types';

export type WorkflowSession =
  | { state: 'identify'; initial?: CoffeeDiscoveryRequest }
  | { state: 'discovering'; request: CoffeeDiscoveryRequest }
  | { state: 'candidate-selection'; request: CoffeeDiscoveryRequest; response: CoffeeDiscoveryResponse }
  | { state: 'discovery-error'; request: CoffeeDiscoveryRequest; message: string; requestId?: string }
  | { state: 'researching'; request: ResearchRequest }
  | { state: 'research-review'; request: ResearchRequest; response: ResearchResponse }
  | { state: 'creating-label'; request: ResearchRequest; response: ResearchResponse }
  | { state: 'color-selection'; request: ResearchRequest; response: ResearchResponse; concept: LabelConceptResponse }
  | { state: 'label-concept-error'; request: ResearchRequest; response: ResearchResponse; message: string; requestId?: string }
  | { state: 'final-review'; fixture: LabelFixture; concept?: LabelConceptResponse }
  | { state: 'export-setup'; snapshot: ExportSnapshot; settings: ExportSettings; error?: string }
  | { state: 'exporting'; snapshot: ExportSnapshot; settings: ExportSettings; imposition: ImpositionResult }
  | { state: 'complete'; snapshot: ExportSnapshot; result: ExportResult }
  | { state: 'error'; request: ResearchRequest; message: string; requestId?: string };
