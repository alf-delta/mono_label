import type { BrewMethod } from '../../types/coffee-label';
import { coverageSupportsText, loadFontCoverage } from '../typography/font-coverage';
import { FONT_ROLES, type FontRole } from '../typography/font-roles';

export interface FontValidationResource {
  available: boolean;
  supportsText(text: string): boolean;
}

export interface LabelValidationResources {
  fonts: Record<FontRole, FontValidationResource>;
  brewIconAvailable: boolean;
}

const iconCache = new Map<BrewMethod, Promise<boolean>>();

async function loadIcon(method: BrewMethod): Promise<boolean> {
  const cached = iconCache.get(method);
  if (cached) return cached;
  const request = fetch(`/assets/brew/${method}.svg`)
    .then((response) => response.ok)
    .catch(() => false);
  iconCache.set(method, request);
  return request;
}

export async function loadValidationResources(brewMethod: BrewMethod): Promise<LabelValidationResources> {
  await document.fonts.ready;

  const fontEntries = await Promise.all(
    (Object.keys(FONT_ROLES) as FontRole[]).map(async (role) => {
      const font = FONT_ROLES[role];
      const declaration = `${font.style} ${font.weight} 16px "${font.name}"`;
      const browserLoaded = document.fonts.check(declaration);
      const coverage = await loadFontCoverage(font.asset);
      return [
        role,
        {
          available: browserLoaded && coverage !== null,
          supportsText: (text: string) => coverageSupportsText(coverage, text),
        },
      ] as const;
    }),
  );

  return {
    fonts: Object.fromEntries(fontEntries) as Record<FontRole, FontValidationResource>,
    brewIconAvailable: await loadIcon(brewMethod),
  };
}

