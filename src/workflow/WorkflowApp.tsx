import { useEffect, useRef, useState } from 'react';
import { ReviewWorkspace } from '../app/App';
import { createLabelFixture, REFERENCE_FIXTURE } from '../label/fixtures/reference-label';
import { researchCoffee, ResearchClientError } from '../research/research-client';
import { researchResultToLabelInput } from '../research/research-to-label.js';
import type { ResearchRequest, ResearchResponse } from '../research/research-types';
import { IdentifyScreen } from './IdentifyScreen';
import { ResearchProgress } from './ResearchProgress';
import { ResearchReview } from './ResearchReview';
import type { WorkflowSession } from './workflow-state';
import { WorkflowError } from './WorkflowError';
import { DEFAULT_EXPORT_SETTINGS } from '../export/print-formats';
import { ExportWorkspace } from '../export/ExportWorkspace';
import { ExportComplete } from '../export/ExportComplete';
import { createOutlinedLabelSvg } from '../export/outline-label-svg';
import { downloadBlob, exportPrintPdf } from '../export/export-client';
import type { ExportSettings, ExportSnapshot, ImpositionResult } from '../export/export-types';
import { createLabelConcept, LabelConceptClientError } from '../concept/concept-client';
import { CreatingLabel } from '../concept/CreatingLabel';
import { ColorConceptScreen } from '../concept/ColorConceptScreen';
import { ConceptError } from '../concept/ConceptError';
import { conceptColors, type LabelConceptColor } from '../concept/concept-types';
import { CoffeeDiscoveryClientError, discoverCoffees } from '../discovery/discovery-client';
import type { CoffeeDiscoveryRequest } from '../discovery/discovery-types';
import { CandidateSelection } from './CandidateSelection';
import { DiscoveryError } from './DiscoveryError';
import { DiscoveryProgress } from './DiscoveryProgress';

function initialSession(): WorkflowSession {
  const parameters = new URLSearchParams(window.location.search);
  const developerReview = import.meta.env.DEV && (
    parameters.has('fixture') || parameters.get('calibrate') === '1' || parameters.get('review') === '1'
  );
  return developerReview ? { state: 'final-review', fixture: REFERENCE_FIXTURE } : { state: 'identify' };
}

function createResearchFixture(response: ResearchResponse, color: LabelConceptColor) {
  return createLabelFixture(
    'research-result',
    color.name,
    color.story,
    researchResultToLabelInput(response, color.hex),
  );
}

function varietyFromResearch(request: ResearchRequest, response?: ResearchResponse): CoffeeDiscoveryRequest {
  return { variety: request.variety ?? response?.result.variety.value ?? request.coffeeName };
}

export function WorkflowApp() {
  const [session, setSession] = useState<WorkflowSession>(initialSession);
  const abortRef = useRef<AbortController | null>(null);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  const startDiscovery = (request: CoffeeDiscoveryRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSession({ state: 'discovering', request });

    void discoverCoffees(request, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setSession({ state: 'candidate-selection', request, response });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const clientError = error instanceof CoffeeDiscoveryClientError ? error : null;
        setSession({
          state: 'discovery-error',
          request,
          message: clientError?.message ?? 'Coffee discovery could not be completed.',
          requestId: clientError?.requestId,
        });
      });
  };

  const startResearch = (request: ResearchRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSession({ state: 'researching', request });

    void researchCoffee(request, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setSession({ state: 'research-review', request, response });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const clientError = error instanceof ResearchClientError ? error : null;
        setSession({
          state: 'error',
          request,
          message: clientError?.message ?? 'Research could not be completed.',
          requestId: clientError?.requestId,
        });
      });
  };

  const startLabelConcept = (request: ResearchRequest, response: ResearchResponse) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSession({ state: 'creating-label', request, response });

    const minimumReveal = new Promise<void>((resolve) => window.setTimeout(resolve, 3_200));
    void Promise.all([createLabelConcept({ research: response.result }, controller.signal), minimumReveal])
      .then(([concept]) => {
        if (!controller.signal.aborted) setSession({ state: 'color-selection', request, response, concept });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const clientError = error instanceof LabelConceptClientError ? error : null;
        setSession({
          state: 'label-concept-error',
          request,
          response,
          message: clientError?.message ?? 'The color studio could not create a valid palette.',
          requestId: clientError?.requestId,
        });
      });
  };

  const returnToLabel = (snapshot: ExportSnapshot) => {
    const data = snapshot.labelData;
    const fixture = createLabelFixture(
      'export-return',
      'Approved label',
      'Frozen content returned from print setup.',
      {
        coffeeName: data.coffeeName,
        variety: data.variety,
        processing: data.processing,
        altitude: data.altitude,
        producer: data.producer,
        tastingNotes: data.tastingNotes,
        brewMethod: data.brewMethod,
        backgroundColor: data.backgroundColor,
        netWeight: data.netWeight,
      },
    );
    setSession({ state: 'final-review', fixture });
  };

  const startExport = (snapshot: ExportSnapshot, settings: ExportSettings, imposition: ImpositionResult) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSession({ state: 'exporting', snapshot, settings, imposition });

    void createOutlinedLabelSvg(snapshot)
      .then((outlinedSvg) => exportPrintPdf({ snapshot, settings, outlinedSvg }, controller.signal))
      .then(({ blob, filename }) => {
        if (controller.signal.aborted) return;
        if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
        const downloadUrl = URL.createObjectURL(blob);
        downloadUrlRef.current = downloadUrl;
        downloadBlob(downloadUrl, filename);
        setSession({ state: 'complete', snapshot, result: { filename, downloadUrl, settings, imposition } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSession({
          state: 'export-setup',
          snapshot,
          settings,
          error: error instanceof Error ? error.message : 'The print PDF could not be generated.',
        });
      });
  };

  if (session.state === 'identify') {
    return (
      <IdentifyScreen
        initial={session.initial}
        onSubmit={startDiscovery}
        onOpenReference={() => setSession({ state: 'final-review', fixture: REFERENCE_FIXTURE })}
      />
    );
  }

  if (session.state === 'discovering') return <DiscoveryProgress request={session.request} />;

  if (session.state === 'candidate-selection') {
    return (
      <CandidateSelection
        request={session.request}
        response={session.response}
        onBack={() => setSession({ state: 'identify', initial: session.request })}
        onSelect={startResearch}
      />
    );
  }

  if (session.state === 'discovery-error') {
    return (
      <DiscoveryError
        request={session.request}
        message={session.message}
        requestId={session.requestId}
        onRetry={() => startDiscovery(session.request)}
        onBack={() => setSession({ state: 'identify', initial: session.request })}
      />
    );
  }

  if (session.state === 'researching') return <ResearchProgress request={session.request} />;

  if (session.state === 'research-review') {
    return (
      <ResearchReview
        request={session.request}
        response={session.response}
        onBack={() => setSession({ state: 'identify', initial: varietyFromResearch(session.request, session.response) })}
        onCreateLabel={() => startLabelConcept(session.request, session.response)}
      />
    );
  }

  if (session.state === 'creating-label') {
    return <CreatingLabel request={session.request} response={session.response} />;
  }

  if (session.state === 'color-selection') {
    return (
      <ColorConceptScreen
        request={session.request}
        research={session.response}
        concept={session.concept}
        onBack={() => setSession({ state: 'research-review', request: session.request, response: session.response })}
        onRegenerate={() => startLabelConcept(session.request, session.response)}
        onContinue={(color) => setSession({
          state: 'final-review',
          fixture: createResearchFixture(session.response, color),
          concept: session.concept,
        })}
      />
    );
  }

  if (session.state === 'label-concept-error') {
    return (
      <ConceptError
        coffeeName={session.request.coffeeName}
        message={session.message}
        requestId={session.requestId}
        onRetry={() => startLabelConcept(session.request, session.response)}
        onBack={() => setSession({ state: 'research-review', request: session.request, response: session.response })}
      />
    );
  }

  if (session.state === 'error') {
    return (
      <WorkflowError
        request={session.request}
        message={session.message}
        requestId={session.requestId}
        onRetry={() => startResearch(session.request)}
        onBack={() => setSession({ state: 'identify', initial: varietyFromResearch(session.request) })}
      />
    );
  }

  if (session.state === 'export-setup' || session.state === 'exporting') {
    const exporting = session.state === 'exporting';
    return (
      <ExportWorkspace
        snapshot={session.snapshot}
        settings={session.settings}
        exporting={exporting}
        error={session.state === 'export-setup' ? session.error : undefined}
        onSettingsChange={(settings) => setSession({ state: 'export-setup', snapshot: session.snapshot, settings })}
        onBack={() => {
          abortRef.current?.abort();
          returnToLabel(session.snapshot);
        }}
        onExport={(settings, imposition) => startExport(session.snapshot, settings, imposition)}
      />
    );
  }

  if (session.state === 'complete') {
    return (
      <ExportComplete
        snapshot={session.snapshot}
        result={session.result}
        onBack={() => setSession({ state: 'export-setup', snapshot: session.snapshot, settings: session.result.settings })}
        onStartOver={() => setSession({ state: 'identify' })}
      />
    );
  }

  return (
    <ReviewWorkspace
      initialFixture={session.fixture}
      colorCandidates={session.concept ? conceptColors(session.concept) : undefined}
      onStartOver={() => setSession({ state: 'identify' })}
      onApprove={(snapshot) => setSession({ state: 'export-setup', snapshot, settings: DEFAULT_EXPORT_SETTINGS })}
    />
  );
}
