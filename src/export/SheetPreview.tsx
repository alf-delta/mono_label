import { LabelRenderer } from '../label/renderer/LabelRenderer';
import {
  CROP_MARK_LENGTH_MM,
  CROP_MARK_OFFSET_MM,
  CUTTER_GUIDE_LENGTH_MM,
} from './imposition';
import type { ExportSettings, ExportSnapshot, ImpositionResult } from './export-types';

function CropMarks({ layout, bleed }: { layout: ImpositionResult; bleed: number }) {
  const top = layout.horizontalCuts[0];
  const bottom = layout.horizontalCuts[layout.horizontalCuts.length - 1];
  const left = layout.verticalCuts[0];
  const right = layout.verticalCuts[layout.verticalCuts.length - 1];
  const outside = bleed + CROP_MARK_OFFSET_MM;
  return (
    <g className="print-mark crop-mark">
      {layout.verticalCuts.map((x) => (
        <g key={`crop-v-${x}`}>
          <line x1={x} x2={x} y1={top - outside - CROP_MARK_LENGTH_MM} y2={top - outside} />
          <line x1={x} x2={x} y1={bottom + outside} y2={bottom + outside + CROP_MARK_LENGTH_MM} />
        </g>
      ))}
      {layout.horizontalCuts.map((y) => (
        <g key={`crop-h-${y}`}>
          <line x1={left - outside - CROP_MARK_LENGTH_MM} x2={left - outside} y1={y} y2={y} />
          <line x1={right + outside} x2={right + outside + CROP_MARK_LENGTH_MM} y1={y} y2={y} />
        </g>
      ))}
    </g>
  );
}

function CutterGuides({ layout }: { layout: ImpositionResult }) {
  return (
    <g className="print-mark cutter-guide">
      {layout.verticalCuts.map((x) => (
        <g key={`guide-v-${x}`}>
          <line x1={x} x2={x} y1={0} y2={CUTTER_GUIDE_LENGTH_MM} />
          <line x1={x} x2={x} y1={layout.pageHeightMm - CUTTER_GUIDE_LENGTH_MM} y2={layout.pageHeightMm} />
        </g>
      ))}
      {layout.horizontalCuts.map((y) => (
        <g key={`guide-h-${y}`}>
          <line x1={0} x2={CUTTER_GUIDE_LENGTH_MM} y1={y} y2={y} />
          <line x1={layout.pageWidthMm - CUTTER_GUIDE_LENGTH_MM} x2={layout.pageWidthMm} y1={y} y2={y} />
        </g>
      ))}
    </g>
  );
}

function RegistrationMarks({ layout }: { layout: ImpositionResult }) {
  const inset = Math.max(2.5, layout.effectiveMarginMm / 2);
  const target = (y: number) => (
    <g transform={`translate(${layout.pageWidthMm / 2} ${y})`}>
      <circle r="1.4" />
      <line x1="-2.2" x2="2.2" y1="0" y2="0" />
      <line x1="0" x2="0" y1="-2.2" y2="2.2" />
    </g>
  );
  return (
    <g className="print-mark registration-mark">
      {target(inset)}
      {target(layout.pageHeightMm - inset)}
    </g>
  );
}

export function SheetPreview({ snapshot, layout, settings }: {
  snapshot: ExportSnapshot;
  layout: ImpositionResult;
  settings: ExportSettings;
}) {
  return (
    <svg
      className="sheet-preview-svg"
      viewBox={`0 0 ${layout.pageWidthMm} ${layout.pageHeightMm}`}
      role="img"
      aria-label={`${layout.format.name} sheet with ${layout.quantity} labels`}
      style={{ aspectRatio: `${layout.pageWidthMm} / ${layout.pageHeightMm}` }}
    >
      <rect className="sheet-paper" width={layout.pageWidthMm} height={layout.pageHeightMm} />
      {layout.placements.map((placement) => (
        <g key={placement.index} aria-hidden="true">
          <rect
            x={placement.trimX - snapshot.template.bleedMm}
            y={placement.trimY - snapshot.template.bleedMm}
            width={placement.trimWidth + 2 * snapshot.template.bleedMm}
            height={placement.trimHeight + 2 * snapshot.template.bleedMm}
            fill={snapshot.labelData.backgroundColor}
          />
          {placement.rotation === 90 ? (
            <g transform={`translate(${placement.trimX + placement.trimWidth} ${placement.trimY}) rotate(90)`}>
              <LabelRenderer
                data={snapshot.labelData}
                template={snapshot.template}
                layout={snapshot.layout}
                svgWidth={snapshot.template.widthMm}
                svgHeight={snapshot.template.heightMm}
              />
            </g>
          ) : (
            <svg
              x={placement.trimX}
              y={placement.trimY}
              width={snapshot.template.widthMm}
              height={snapshot.template.heightMm}
              viewBox={`0 0 ${snapshot.template.widthMm} ${snapshot.template.heightMm}`}
            >
              <LabelRenderer data={snapshot.labelData} template={snapshot.template} layout={snapshot.layout} />
            </svg>
          )}
        </g>
      ))}
      <g className="trim-preview" aria-hidden="true">
        {layout.verticalCuts.map((x) => <line key={`trim-v-${x}`} x1={x} x2={x} y1={layout.horizontalCuts[0]} y2={layout.horizontalCuts.at(-1)} />)}
        {layout.horizontalCuts.map((y) => <line key={`trim-h-${y}`} x1={layout.verticalCuts[0]} x2={layout.verticalCuts.at(-1)} y1={y} y2={y} />)}
      </g>
      {settings.marks.cropMarks && <CropMarks layout={layout} bleed={snapshot.template.bleedMm} />}
      {settings.marks.cutterGuides && <CutterGuides layout={layout} />}
      {settings.marks.registrationMarks && <RegistrationMarks layout={layout} />}
    </svg>
  );
}
