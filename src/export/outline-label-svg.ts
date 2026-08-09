import { FONT_ROLES } from '../label/typography/font-roles';
import type { ExportSnapshot } from './export-types';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface VariableFont {
  variation?: { set: (coordinates: Record<string, number>) => void };
}

interface LoadedFonts {
  primaryBold: import('opentype.js').Font;
  bodyRegular: import('opentype.js').Font;
  displayItalic: import('opentype.js').Font;
}

function pathNumber(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function serializePath(path: import('opentype.js').Path): string {
  return path.commands.map((command) => {
    if (command.type === 'Z') return 'Z';
    if (command.type === 'M' || command.type === 'L') {
      return `${command.type} ${pathNumber(command.x)} ${pathNumber(command.y)}`;
    }
    if (command.type === 'Q') {
      return `Q ${pathNumber(command.x1)} ${pathNumber(command.y1)} ${pathNumber(command.x)} ${pathNumber(command.y)}`;
    }
    return `C ${pathNumber(command.x1)} ${pathNumber(command.y1)} ${pathNumber(command.x2)} ${pathNumber(command.y2)} ${pathNumber(command.x)} ${pathNumber(command.y)}`;
  }).join(' ');
}

async function fontBuffer(asset: string): Promise<ArrayBuffer> {
  const response = await fetch(asset, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Could not load print font: ${asset}`);
  return response.arrayBuffer();
}

async function loadOutlineFonts(): Promise<LoadedFonts> {
  const opentype = await import('opentype.js');
  const [montserratBuffer, editorialBuffer] = await Promise.all([
    fontBuffer(FONT_ROLES.primaryBold.asset),
    fontBuffer(FONT_ROLES.displayItalic.asset),
  ]);
  const primaryBold = opentype.parse(montserratBuffer.slice(0));
  const bodyRegular = opentype.parse(montserratBuffer.slice(0));
  const displayItalic = opentype.parse(editorialBuffer);
  (primaryBold as import('opentype.js').Font & VariableFont).variation?.set({ wght: 700 });
  (bodyRegular as import('opentype.js').Font & VariableFont).variation?.set({ wght: 400 });
  return { primaryBold, bodyRegular, displayItalic };
}

function numericAttribute(element: Element, name: string, fallback = 0): number {
  const value = Number.parseFloat(element.getAttribute(name) ?? '');
  return Number.isFinite(value) ? value : fallback;
}

function fontFor(element: Element, fonts: LoadedFonts): import('opentype.js').Font {
  const text = element.closest('text') ?? element;
  const family = text.getAttribute('font-family') ?? '';
  const weight = numericAttribute(text, 'font-weight', 400);
  if (family.includes('Editorial')) return fonts.displayItalic;
  return weight >= 600 ? fonts.primaryBold : fonts.bodyRegular;
}

async function inlineBrewAssets(root: SVGSVGElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('image'));
  for (const image of images) {
    const href = image.getAttribute('href');
    if (!href) throw new Error('The brew icon is missing its source.');
    const assetUrl = new URL(href, window.location.origin);
    if (assetUrl.origin !== window.location.origin || !assetUrl.pathname.startsWith('/assets/brew/')) {
      throw new Error('Only bundled brew icons can be exported.');
    }
    const response = await fetch(assetUrl.pathname, { cache: 'force-cache' });
    if (!response.ok) throw new Error('The brew icon could not be loaded.');
    const iconDocument = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    if (iconDocument.querySelector('parsererror')) throw new Error('The brew icon is not valid SVG.');
    const iconRoot = iconDocument.documentElement;
    const nested = document.createElementNS(SVG_NS, 'svg');
    for (const attribute of ['x', 'y', 'width', 'height', 'preserveAspectRatio']) {
      const value = image.getAttribute(attribute);
      if (value) nested.setAttribute(attribute, value);
    }
    nested.setAttribute('viewBox', iconRoot.getAttribute('viewBox') ?? '0 0 1 1');
    nested.setAttribute('overflow', 'visible');
    for (const child of Array.from(iconRoot.childNodes)) nested.append(document.importNode(child, true));
    image.replaceWith(nested);
  }
}

function copyRegionAttributes(source: Element, target: Element): void {
  for (const attribute of ['class', 'data-region', 'data-font-size', 'data-fit']) {
    const value = source.getAttribute(attribute);
    if (value) target.setAttribute(attribute, value);
  }
}

function outlineTextElement(text: SVGTextElement, fonts: LoadedFonts): void {
  const runs: SVGGraphicsElement[] = text.querySelectorAll('tspan').length > 0
    ? Array.from(text.querySelectorAll('tspan'))
    : [text];
  const group = document.createElementNS(SVG_NS, 'g');
  copyRegionAttributes(text, group);

  for (const run of runs) {
    const value = run.textContent ?? '';
    if (!value) continue;
    const font = fontFor(run, fonts);
    const textParent = run.closest('text') ?? run;
    const fontSize = numericAttribute(textParent, 'font-size');
    const letterSpacingMm = numericAttribute(textParent, 'letter-spacing');
    const target = run.getBBox();
    const path = font.getPath(value, 0, 0, fontSize, {
      kerning: true,
      letterSpacing: fontSize > 0 ? letterSpacingMm / fontSize : 0,
    });
    const bounds = path.getBoundingBox();
    const outlined = document.createElementNS(SVG_NS, 'path');
    outlined.setAttribute('d', serializePath(path));
    outlined.setAttribute('transform', `translate(${target.x - bounds.x1} ${target.y - bounds.y1})`);
    group.append(outlined);
  }
  text.replaceWith(group);
}

export async function createOutlinedLabelSvg(snapshot: ExportSnapshot): Promise<string> {
  await document.fonts.ready;
  const parsed = new DOMParser().parseFromString(snapshot.svgMarkup, 'image/svg+xml');
  if (parsed.querySelector('parsererror')) throw new Error('The frozen label SVG is invalid.');
  const root = document.importNode(parsed.documentElement, true) as unknown as SVGSVGElement;
  root.style.position = 'fixed';
  root.style.left = '-10000px';
  root.style.top = '0';
  root.style.width = `${snapshot.template.widthMm}mm`;
  root.style.height = `${snapshot.template.heightMm}mm`;
  root.style.opacity = '0';
  root.style.pointerEvents = 'none';
  document.body.append(root);

  try {
    const fonts = await loadOutlineFonts();
    for (const text of Array.from(root.querySelectorAll('text'))) outlineTextElement(text, fonts);
    await inlineBrewAssets(root);
    root.removeAttribute('class');
    root.removeAttribute('style');
    root.removeAttribute('width');
    root.removeAttribute('height');
    const result = new XMLSerializer().serializeToString(root);
    if (/<(?:text|tspan|image)\b/i.test(result)) throw new Error('The print SVG still contains non-outlined content.');
    return result;
  } finally {
    root.remove();
  }
}
