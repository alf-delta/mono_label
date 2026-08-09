interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

const HEX_PATTERN = /^#([0-9A-F]{6})$/i;

function channelToHex(channel: number): string {
  return Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0');
}

export function normalizeHexColor(value: string): string | null {
  const normalized = value.trim().toLocaleUpperCase();
  return HEX_PATTERN.test(normalized) ? normalized : null;
}

export function hexToRgb(value: string): RgbColor | null {
  const hex = normalizeHexColor(value);
  if (!hex) return null;
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex({ red, green, blue }: RgbColor): string {
  return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`.toLocaleUpperCase();
}

export function rgbToHsl({ red, green, blue }: RgbColor): HslColor {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  if (delta === 0) return { hue: 0, saturation: 0, lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (maximum === r) hue = 60 * (((g - b) / delta) % 6);
  else if (maximum === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);

  return { hue: hue < 0 ? hue + 360 : hue, saturation, lightness };
}

export function hslToRgb({ hue, saturation, lightness }: HslColor): RgbColor {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = ((hue % 360) + 360) % 360 / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = lightness - chroma / 2;
  const [r, g, b] = segment < 1 ? [chroma, intermediate, 0]
    : segment < 2 ? [intermediate, chroma, 0]
      : segment < 3 ? [0, chroma, intermediate]
        : segment < 4 ? [0, intermediate, chroma]
          : segment < 5 ? [intermediate, 0, chroma]
            : [chroma, 0, intermediate];

  return { red: (r + offset) * 255, green: (g + offset) * 255, blue: (b + offset) * 255 };
}

export function hslToHex(hsl: HslColor): string {
  return rgbToHex(hslToRgb(hsl));
}

function linearizeChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: RgbColor): number {
  return 0.2126 * linearizeChannel(rgb.red)
    + 0.7152 * linearizeChannel(rgb.green)
    + 0.0722 * linearizeChannel(rgb.blue);
}

export function contrastRatio(first: RgbColor, second: RgbColor): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const light = Math.max(firstLuminance, secondLuminance);
  const dark = Math.min(firstLuminance, secondLuminance);
  return (light + 0.05) / (dark + 0.05);
}

export function colorDistance(first: string, second: string): number {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  if (!firstRgb || !secondRgb) return 0;
  return Math.sqrt(
    (firstRgb.red - secondRgb.red) ** 2
    + (firstRgb.green - secondRgb.green) ** 2
    + (firstRgb.blue - secondRgb.blue) ** 2,
  );
}
