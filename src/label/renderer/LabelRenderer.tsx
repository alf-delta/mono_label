import type { CSSProperties, Ref } from 'react';
import type { CoffeeLabel } from '../../types/coffee-label';
import { tastingNotesText, transformCase } from '../data/rendered-text';
import { FONT_ROLES } from '../typography/font-roles';
import type { CoffeeLabelTemplate, TemplateBox, TemplateRegionKey } from '../templates/template-types';
import type { LabelTextLayout, TextLayoutRegion } from '../validation/validation-types';
import { textAnchor, textX, textY } from './text-layout';

interface LabelRendererProps {
  data: Readonly<CoffeeLabel>;
  template: CoffeeLabelTemplate;
  calibration?: boolean;
  showGrid?: boolean;
  selectedRegion?: TemplateRegionKey;
  onSelectRegion?: (region: TemplateRegionKey) => void;
  layout?: LabelTextLayout;
  svgRef?: Ref<SVGSVGElement>;
  svgWidth?: number;
  svgHeight?: number;
}

const LABELS = {
  variety: 'VARIETY',
  processing: 'PROCESSING',
  altitude: 'ALTITUDE',
  producer: 'PRODUCER',
} as const;

function fontProps(box: TemplateBox, fontSize = box.fontSize) {
  const font = FONT_ROLES[box.fontRole];
  return {
    fontFamily: font.family,
    fontWeight: font.weight,
    fontStyle: font.style,
    fontSize,
    letterSpacing: box.letterSpacing,
  };
}

function CalibrationOverlay({
  template,
  selectedRegion,
  onSelectRegion,
}: Pick<LabelRendererProps, 'template' | 'selectedRegion' | 'onSelectRegion'>) {
  return (
    <g className="calibration-boxes" aria-hidden="true">
      {Object.entries(template.regions).map(([key, box]) => {
        const region = key as TemplateRegionKey;
        return (
          <rect
            key={key}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            className={selectedRegion === region ? 'calibration-box is-selected' : 'calibration-box'}
            onClick={() => onSelectRegion?.(region)}
          />
        );
      })}
    </g>
  );
}

export function LabelRenderer({
  data,
  template,
  calibration = false,
  showGrid = false,
  selectedRegion,
  onSelectRegion,
  layout,
  svgRef,
  svgWidth,
  svgHeight,
}: LabelRendererProps) {
  const r = template.regions;
  const metadataValueX = r.variety.x + template.metadataLabelWidthMm;
  const brewAsset = `/assets/brew/${data.brewMethod}.svg`;
  const labelStyle = { '--label-foreground': data.foregroundColor } as CSSProperties;

  const row = (key: keyof typeof LABELS, values: string[]) => {
    const box = r[key];
    const fitted = layout?.[key];
    const fontSize = fitted?.fontSize ?? box.fontSize;
    const lineGap = fontSize * box.lineHeight;
    const valueStartY = values.length > 1 ? textY(box) - lineGap / 2 : textY(box);
    return (
      <g
        data-region={key}
        data-font-size={fontSize}
        data-fit={fitted?.fits ?? true}
        className="label-region"
        onClick={() => calibration && onSelectRegion?.(key)}
      >
        <text x={box.x} y={valueStartY} dominantBaseline="middle" {...fontProps(box)}>
          {LABELS[key]}
        </text>
        <text x={metadataValueX} y={valueStartY} dominantBaseline="middle" {...fontProps(box, fontSize)}>
          {values.map((value, index) => (
            <tspan key={value} x={metadataValueX} dy={index === 0 ? 0 : lineGap}>
              {transformCase(value, box)}
            </tspan>
          ))}
        </text>
        {key !== 'producer' && (
          <line
            x1={box.x}
            x2={box.x + box.width}
            y1={box.y + box.height}
            y2={box.y + box.height}
            stroke="currentColor"
            strokeWidth={template.dividerStrokeMm}
          />
        )}
      </g>
    );
  };

  const layoutFor = (region: TextLayoutRegion) => layout?.[region];

  return (
    <svg
      ref={svgRef}
      className="label-svg"
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${template.widthMm} ${template.heightMm}`}
      role="img"
      aria-labelledby="label-title label-description"
      style={labelStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="label-title">{data.coffeeName} coffee label</title>
      <desc id="label-description">Monoblend coffee label with a {data.backgroundColor} background and ivory typography.</desc>
      <rect width={template.widthMm} height={template.heightMm} fill={data.backgroundColor} />

      {showGrid && (
        <defs>
          <pattern id="mm-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#69d9ff" strokeWidth="0.08" opacity="0.5" />
          </pattern>
        </defs>
      )}
      {showGrid && <rect width={template.widthMm} height={template.heightMm} fill="url(#mm-grid)" />}

      <g color={data.foregroundColor} fill={data.foregroundColor}>
        {row('variety', [data.variety])}
        {row('processing', [data.processing])}
        {row('altitude', [data.altitude])}
        {row('producer', [data.producer.line1, data.producer.line2])}

        <g data-region="bestFor" className="label-region" onClick={() => calibration && onSelectRegion?.('bestFor')}>
          <text
            x={textX(r.bestFor)}
            y={textY(r.bestFor)}
            textAnchor={textAnchor(r.bestFor)}
            dominantBaseline="middle"
            {...fontProps(r.bestFor)}
          >
            BEST FOR
          </text>
        </g>

        <g
          data-region="brewIcon"
          data-brew-method={data.brewMethod}
          className="label-region"
          onClick={() => calibration && onSelectRegion?.('brewIcon')}
        >
          <image
            href={brewAsset}
            x={r.brewIcon.x}
            y={r.brewIcon.y}
            width={r.brewIcon.width}
            height={r.brewIcon.height}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        <text
          data-region="coffeeName"
          data-font-size={layoutFor('coffeeName')?.fontSize ?? r.coffeeName.fontSize}
          data-fit={layoutFor('coffeeName')?.fits ?? true}
          className="label-region"
          x={textX(r.coffeeName)}
          y={textY(r.coffeeName)}
          textAnchor={textAnchor(r.coffeeName)}
          dominantBaseline="middle"
          {...fontProps(r.coffeeName, layoutFor('coffeeName')?.fontSize)}
          onClick={() => calibration && onSelectRegion?.('coffeeName')}
        >
          {transformCase(data.coffeeName, r.coffeeName)}
        </text>

        <text
          data-region="tastingNotes"
          data-font-size={layoutFor('tastingNotes')?.fontSize ?? r.tastingNotes.fontSize}
          data-fit={layoutFor('tastingNotes')?.fits ?? true}
          className="label-region"
          x={textX(r.tastingNotes)}
          y={textY(r.tastingNotes)}
          textAnchor={textAnchor(r.tastingNotes)}
          dominantBaseline="middle"
          {...fontProps(r.tastingNotes, layoutFor('tastingNotes')?.fontSize)}
          onClick={() => calibration && onSelectRegion?.('tastingNotes')}
        >
          {transformCase(tastingNotesText(data.tastingNotes), r.tastingNotes)}
        </text>

        <text
          data-region="netWeight"
          data-font-size={layoutFor('netWeight')?.fontSize ?? r.netWeight.fontSize}
          data-fit={layoutFor('netWeight')?.fits ?? true}
          className="label-region"
          x={textX(r.netWeight)}
          y={textY(r.netWeight)}
          textAnchor={textAnchor(r.netWeight)}
          dominantBaseline="middle"
          {...fontProps(r.netWeight, layoutFor('netWeight')?.fontSize)}
          onClick={() => calibration && onSelectRegion?.('netWeight')}
        >
          net wt. {data.netWeight}
        </text>
      </g>

      {calibration && (
        <CalibrationOverlay
          template={template}
          selectedRegion={selectedRegion}
          onSelectRegion={onSelectRegion}
        />
      )}
    </svg>
  );
}
