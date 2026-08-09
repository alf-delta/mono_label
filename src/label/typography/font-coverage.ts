interface GlyphCoverage {
  supports(codePoint: number): boolean;
}

const coverageCache = new Map<string, Promise<GlyphCoverage | null>>();

function tag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function format12Coverage(view: DataView, offset: number): GlyphCoverage {
  const groupCount = view.getUint32(offset + 12);
  const groups = Array.from({ length: groupCount }, (_, index) => {
    const groupOffset = offset + 16 + index * 12;
    return {
      start: view.getUint32(groupOffset),
      end: view.getUint32(groupOffset + 4),
      startGlyph: view.getUint32(groupOffset + 8),
    };
  });

  return {
    supports(codePoint) {
      let low = 0;
      let high = groups.length - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        const group = groups[middle];
        if (codePoint < group.start) high = middle - 1;
        else if (codePoint > group.end) low = middle + 1;
        else return group.startGlyph + codePoint - group.start > 0;
      }
      return false;
    },
  };
}

function format4Coverage(view: DataView, offset: number): GlyphCoverage {
  const tableLength = view.getUint16(offset + 2);
  const tableEnd = offset + tableLength;
  const segmentCount = view.getUint16(offset + 6) / 2;
  const endCodesOffset = offset + 14;
  const startCodesOffset = endCodesOffset + segmentCount * 2 + 2;
  const deltasOffset = startCodesOffset + segmentCount * 2;
  const rangeOffsetsOffset = deltasOffset + segmentCount * 2;

  return {
    supports(codePoint) {
      if (codePoint > 0xffff) return false;
      for (let index = 0; index < segmentCount; index += 1) {
        const end = view.getUint16(endCodesOffset + index * 2);
        if (codePoint > end) continue;
        const start = view.getUint16(startCodesOffset + index * 2);
        if (codePoint < start) return false;
        const delta = view.getInt16(deltasOffset + index * 2);
        const rangeOffsetPosition = rangeOffsetsOffset + index * 2;
        const rangeOffset = view.getUint16(rangeOffsetPosition);
        if (rangeOffset === 0) return ((codePoint + delta) & 0xffff) !== 0;
        const glyphPosition = rangeOffsetPosition + rangeOffset + (codePoint - start) * 2;
        if (glyphPosition + 2 > tableEnd) return false;
        const glyph = view.getUint16(glyphPosition);
        return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
      }
      return false;
    },
  };
}

function parseCoverage(buffer: ArrayBuffer): GlyphCoverage | null {
  const view = new DataView(buffer);
  const tableCount = view.getUint16(4);
  let cmapOffset = -1;

  for (let index = 0; index < tableCount; index += 1) {
    const recordOffset = 12 + index * 16;
    if (tag(view, recordOffset) === 'cmap') {
      cmapOffset = view.getUint32(recordOffset + 8);
      break;
    }
  }

  if (cmapOffset < 0) return null;
  const subtableCount = view.getUint16(cmapOffset + 2);
  let format4Offset = -1;
  let format12Offset = -1;

  for (let index = 0; index < subtableCount; index += 1) {
    const recordOffset = cmapOffset + 4 + index * 8;
    const subtableOffset = cmapOffset + view.getUint32(recordOffset + 4);
    const format = view.getUint16(subtableOffset);
    if (format === 12) format12Offset = subtableOffset;
    if (format === 4 && format4Offset < 0) format4Offset = subtableOffset;
  }

  if (format12Offset >= 0) return format12Coverage(view, format12Offset);
  if (format4Offset >= 0) return format4Coverage(view, format4Offset);
  return null;
}

export async function loadFontCoverage(asset: string): Promise<GlyphCoverage | null> {
  const cached = coverageCache.get(asset);
  if (cached) return cached;

  const request = fetch(asset)
    .then((response) => {
      if (!response.ok) return null;
      return response.arrayBuffer();
    })
    .then((buffer) => (buffer ? parseCoverage(buffer) : null))
    .catch(() => null);

  coverageCache.set(asset, request);
  return request;
}

export function coverageSupportsText(coverage: GlyphCoverage | null, text: string): boolean {
  if (!coverage) return false;
  return Array.from(text).every((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint === undefined || /\s/u.test(character) || coverage.supports(codePoint);
  });
}

