import type { TemplateBox } from '../templates/template-types';

export function textAnchor(box: TemplateBox): 'start' | 'middle' | 'end' {
  if (box.horizontalAlign === 'center') return 'middle';
  if (box.horizontalAlign === 'right') return 'end';
  return 'start';
}

export function textX(box: TemplateBox): number {
  if (box.horizontalAlign === 'center') return box.x + box.width / 2;
  if (box.horizontalAlign === 'right') return box.x + box.width;
  return box.x;
}

export function textY(box: TemplateBox): number {
  if (box.verticalAlign === 'middle') return box.y + box.height / 2;
  if (box.verticalAlign === 'bottom') return box.y + box.height;
  return box.y;
}
