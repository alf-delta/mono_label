import PDFDocument from 'pdfkit';
import svgToPdf from 'svg-to-pdfkit';
import {
  CROP_MARK_LENGTH_MM,
  CROP_MARK_OFFSET_MM,
  CUTTER_GUIDE_LENGTH_MM,
  calculateImposition,
} from '../../src/export/imposition';
import type { ExportSettings, ImpositionResult } from '../../src/export/export-types';
import { COFFEE_LABEL_V1 } from '../../src/label/templates/coffee-label-v1';
import type { ParsedExportRequest } from './export-schema';

const POINTS_PER_MM = 72 / 25.4;
const MARK_STROKE_MM = 0.15;

function pt(millimetres: number): number {
  return millimetres * POINTS_PER_MM;
}

function drawLine(document: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number): void {
  document.moveTo(pt(x1), pt(y1)).lineTo(pt(x2), pt(y2)).stroke();
}

function setupMarkStyle(document: PDFKit.PDFDocument): void {
  document.strokeColor('#111111').lineWidth(pt(MARK_STROKE_MM)).lineCap('butt');
}

function drawCropMarks(document: PDFKit.PDFDocument, layout: ImpositionResult): void {
  setupMarkStyle(document);
  const top = layout.horizontalCuts[0];
  const bottom = layout.horizontalCuts[layout.horizontalCuts.length - 1];
  const left = layout.verticalCuts[0];
  const right = layout.verticalCuts[layout.verticalCuts.length - 1];
  const outside = COFFEE_LABEL_V1.bleedMm + CROP_MARK_OFFSET_MM;
  for (const x of layout.verticalCuts) {
    drawLine(document, x, top - outside - CROP_MARK_LENGTH_MM, x, top - outside);
    drawLine(document, x, bottom + outside, x, bottom + outside + CROP_MARK_LENGTH_MM);
  }
  for (const y of layout.horizontalCuts) {
    drawLine(document, left - outside - CROP_MARK_LENGTH_MM, y, left - outside, y);
    drawLine(document, right + outside, y, right + outside + CROP_MARK_LENGTH_MM, y);
  }
}

function drawCutterGuides(document: PDFKit.PDFDocument, layout: ImpositionResult): void {
  setupMarkStyle(document);
  for (const x of layout.verticalCuts) {
    drawLine(document, x, 0, x, CUTTER_GUIDE_LENGTH_MM);
    drawLine(document, x, layout.pageHeightMm - CUTTER_GUIDE_LENGTH_MM, x, layout.pageHeightMm);
  }
  for (const y of layout.horizontalCuts) {
    drawLine(document, 0, y, CUTTER_GUIDE_LENGTH_MM, y);
    drawLine(document, layout.pageWidthMm - CUTTER_GUIDE_LENGTH_MM, y, layout.pageWidthMm, y);
  }
}

function drawRegistrationTarget(document: PDFKit.PDFDocument, x: number, y: number): void {
  const radius = 1.4;
  setupMarkStyle(document);
  document.circle(pt(x), pt(y), pt(radius)).stroke();
  drawLine(document, x - radius - 0.8, y, x + radius + 0.8, y);
  drawLine(document, x, y - radius - 0.8, x, y + radius + 0.8);
}

function drawRegistrationMarks(document: PDFKit.PDFDocument, layout: ImpositionResult): void {
  const inset = Math.max(2.5, layout.effectiveMarginMm / 2);
  drawRegistrationTarget(document, layout.pageWidthMm / 2, inset);
  drawRegistrationTarget(document, layout.pageWidthMm / 2, layout.pageHeightMm - inset);
}

function drawLabel(
  document: PDFKit.PDFDocument,
  outlinedSvg: string,
  placement: ImpositionResult['placements'][number],
): void {
  document.save();
  if (placement.rotation === 90) {
    document.translate(pt(placement.trimX + placement.trimWidth), pt(placement.trimY));
    document.rotate(90, { origin: [0, 0] });
    svgToPdf(document, outlinedSvg, 0, 0, {
      width: pt(COFFEE_LABEL_V1.widthMm),
      height: pt(COFFEE_LABEL_V1.heightMm),
      assumePt: true,
      precision: 5,
      warningCallback: (warning) => { throw new Error(`SVG export warning: ${warning}`); },
    });
  } else {
    svgToPdf(document, outlinedSvg, pt(placement.trimX), pt(placement.trimY), {
      width: pt(COFFEE_LABEL_V1.widthMm),
      height: pt(COFFEE_LABEL_V1.heightMm),
      assumePt: true,
      precision: 5,
      warningCallback: (warning) => { throw new Error(`SVG export warning: ${warning}`); },
    });
  }
  document.restore();
}

function slug(value: string): string {
  return value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLocaleLowerCase() || 'coffee';
}

export function exportFilename(coffeeName: string, settings: ExportSettings, quantity: number): string {
  return `${slug(coffeeName)}-${settings.formatId}-${quantity}up.pdf`;
}

export async function generatePrintPdf(request: ParsedExportRequest): Promise<{
  buffer: Buffer;
  filename: string;
  imposition: ImpositionResult;
}> {
  const imposition = calculateImposition(COFFEE_LABEL_V1, request.settings);
  const document = new PDFDocument({
    autoFirstPage: true,
    size: [pt(imposition.pageWidthMm), pt(imposition.pageHeightMm)],
    margin: 0,
    compress: true,
    info: {
      Title: `${request.snapshot.labelData.coffeeName} - print sheet`,
      Author: 'Monoblend Label Studio',
      Subject: `${request.snapshot.templateId} v${request.snapshot.templateVersion}; ${imposition.quantity} labels`,
      Keywords: `coffee label, ${request.settings.formatId}, vector, outlined text`,
      CreationDate: new Date(request.snapshot.generatedAt),
    },
  });
  Object.assign(document.info, { MonoblendSnapshot: JSON.stringify({
    id: request.snapshot.id,
    generatedAt: request.snapshot.generatedAt,
    templateId: request.snapshot.templateId,
    templateVersion: request.snapshot.templateVersion,
    labelData: request.snapshot.labelData,
    exportSettings: request.settings,
  }) });
  const chunks: Buffer[] = [];
  document.on('data', (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  for (const placement of imposition.placements) {
    document.save();
    document.fillColor(request.snapshot.labelData.backgroundColor).rect(
      pt(placement.trimX - COFFEE_LABEL_V1.bleedMm),
      pt(placement.trimY - COFFEE_LABEL_V1.bleedMm),
      pt(placement.trimWidth + 2 * COFFEE_LABEL_V1.bleedMm),
      pt(placement.trimHeight + 2 * COFFEE_LABEL_V1.bleedMm),
    ).fill();
    document.restore();
    drawLabel(document, request.outlinedSvg, placement);
  }
  if (request.settings.marks.cropMarks) drawCropMarks(document, imposition);
  if (request.settings.marks.cutterGuides) drawCutterGuides(document, imposition);
  if (request.settings.marks.registrationMarks) drawRegistrationMarks(document, imposition);
  document.end();

  return {
    buffer: await completed,
    filename: exportFilename(request.snapshot.labelData.coffeeName, request.settings, imposition.quantity),
    imposition,
  };
}
