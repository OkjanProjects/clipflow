/**
 * Design tokens do ClipFlow.
 *
 * As cores foram derivadas da análise do CapCut:
 *  - `accent` é o mesmo ciano do CTA "Use template" do site (#00cae0).
 *  - `bg`/`surface` seguem o tema escuro do PWA (theme_color #121217).
 */
import '@/global.css';

import { Platform } from 'react-native';

export const palette = {
  bg: '#0B0B0F',
  surface: '#141419',
  surfaceAlt: '#1C1C23',
  border: '#26262F',
  borderStrong: '#35353F',

  text: '#FFFFFF',
  textDim: '#9A9AA6',
  textMuted: '#6B6B78',

  accent: '#00CAE0',
  accentInk: '#00262B',
  accentSoft: 'rgba(0, 202, 224, 0.14)',

  like: '#FF2D55',
  pro: '#FFC53D',
  success: '#2BD67B',
  danger: '#FF4D4F',

  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
});
