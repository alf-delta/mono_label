import type { CoffeeLabelTemplate, TemplateRegionKey } from '../templates/template-types';

export interface RegionMeasurement {
  renderedWidth: number | null;
  renderedHeight: number | null;
  baseline: number;
  overflow: boolean;
}

export function measureRegion(
  svg: SVGSVGElement | null,
  region: TemplateRegionKey,
  template: CoffeeLabelTemplate,
): RegionMeasurement {
  const box = template.regions[region];
  const node = svg?.querySelector<SVGGraphicsElement>(`[data-region="${region}"]`);

  if (!node) {
    return { renderedWidth: null, renderedHeight: null, baseline: box.y + box.height / 2, overflow: false };
  }

  const textNodes = Array.from(node.querySelectorAll<SVGTextElement>('text'));
  if (node instanceof SVGTextElement) textNodes.push(node);
  const bounds = textNodes.length
    ? textNodes.reduce(
        (largest, textNode) => {
          const current = textNode.getBBox();
          return current.width > largest.width ? current : largest;
        },
        textNodes[0].getBBox(),
      )
    : node.getBBox();
  return {
    renderedWidth: bounds.width,
    renderedHeight: bounds.height,
    baseline: box.y + box.height / 2,
    overflow: bounds.width > box.width + 0.01 || bounds.height > box.height + 0.01,
  };
}

export function updateRegionNumber(
  template: CoffeeLabelTemplate,
  region: TemplateRegionKey,
  field: 'x' | 'y' | 'width' | 'height' | 'fontSize' | 'lineHeight' | 'letterSpacing',
  value: number,
): CoffeeLabelTemplate {
  return {
    ...template,
    regions: {
      ...template.regions,
      [region]: {
        ...template.regions[region],
        [field]: value,
      },
    },
  };
}
