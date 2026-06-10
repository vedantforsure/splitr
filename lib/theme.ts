// Single source of design truth. Screens reference these instead of inline
// literals so the visual language stays cohesive across the flow.

export const FONT = 'OpenRunde-Semibold';
export const FONT_REG = 'OpenRunde-Regular';

// Color — a deliberately small palette. Three neutrals for text, one accent,
// plus semantic colors. No ad-hoc grays.
export const C = {
  bg: '#0A0A0A',
  text: '#FFFFFF',
  textDim: '#9A9A9A', // secondary copy, labels
  textFaint: '#666666', // placeholders, tertiary
  accent: '#007AE4',
  green: '#2FB872',
  amber: '#E8A23D',
  danger: '#E45858',
};

// Surfaces — two translucent fills. `card` for resting containers, `chip` for
// interactive pills/inputs/toggles in their off state.
export const S = {
  card: 'rgba(255,255,255,0.06)',
  chip: 'rgba(255,255,255,0.10)',
  hairline: 'rgba(255,255,255,0.07)',
  dashed: 'rgba(255,255,255,0.18)',
};

// Radius scale.
export const R = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
};

// Type scale (sizes only; pair with FONT / FONT_REG).
export const T = {
  h1: 26,
  title: 18,
  body: 16,
  label: 14,
  small: 13,
  tiny: 12,
};

// Avatar fills, cycled by index for non-host people.
export const AVATAR_COLORS = [
  '#E4007A',
  '#00B37A',
  '#E48A00',
  '#7A00E4',
  '#E44848',
  '#00A6C4',
];

// Steps in the linear flow, for the header "step N of M" indicator.
export const FLOW_STEPS = 5;
