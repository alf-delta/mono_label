export const FONT_ROLES = {
  primaryBold: {
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    weight: 700,
    style: 'normal',
    asset: '/assets/fonts/Montserrat-VariableFont_wght.ttf',
  },
  displayItalic: {
    name: 'PP Editorial New',
    family: "'PP Editorial New', serif",
    weight: 400,
    style: 'italic',
    asset: '/assets/fonts/PPEditorialNew-Italic.otf',
  },
  bodyRegular: {
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    weight: 400,
    style: 'normal',
    asset: '/assets/fonts/Montserrat-VariableFont_wght.ttf',
  },
} as const;

export type FontRole = keyof typeof FONT_ROLES;
