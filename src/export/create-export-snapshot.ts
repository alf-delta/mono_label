import type { CoffeeLabel } from '../types/coffee-label';
import type { CoffeeLabelTemplate } from '../label/templates/template-types';
import type { LabelTextLayout } from '../label/validation/validation-types';
import type { ExportSnapshot } from './export-types';

export function createExportSnapshot(
  labelData: Readonly<CoffeeLabel>,
  template: CoffeeLabelTemplate,
  layout: LabelTextLayout,
  svg: SVGSVGElement,
): ExportSnapshot {
  const exportedSvg = svg.cloneNode(true) as SVGSVGElement;
  exportedSvg.removeAttribute('aria-labelledby');
  exportedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exportedSvg.setAttribute('width', `${template.widthMm}mm`);
  exportedSvg.setAttribute('height', `${template.heightMm}mm`);
  return Object.freeze({
    id: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    templateId: template.id,
    templateVersion: template.version,
    labelData: structuredClone(labelData),
    template: structuredClone(template),
    layout: structuredClone(layout),
    svgMarkup: new XMLSerializer().serializeToString(exportedSvg),
  });
}
