/** 
 * Design tokens profissionais do ClipFlow Editor
 */
import '@/global.css';
import { Platform } from 'react-native';

export const palette = {
  bg: '#050508',
  bgSoft: '#0A0A0F',
  surface: '#0F0F16',
  surfaceAlt: '#141420',
  surfaceHover: '#1A1A24',
  surfaceGlass: 'rgba(15, 15, 22, 0.8)',
  border: '#1F1F2A',
  borderStrong: '#2A2A38',
  borderGlow: 'rgba(0, 202, 224, 0.2)',
  text: '#F0F0F5',
  textPrimary: '#FFFFFF',
  textSecondary: '#A8A8C0',
  textMuted: '#6B6B78',
  textDim: '#8A8A9A',
  accent: '#00CAE0',
  accentLight: '#4DD0E1',
  accentDark: '#0097A7',
  accentInk: '#00262B',
  accentSoft: 'rgba(0, 202, 224, 0.12)',
  accentGlow: 'rgba(0, 202, 224, 0.3)',
  success: '#2BD67B',
  successSoft: 'rgba(43, 214, 123, 0.12)',
  warning: '#FFB020',
  warningSoft: 'rgba(255, 176, 32, 0.12)',
  danger: '#FF4D4F',
  dangerSoft: 'rgba(255, 77, 79, 0.12)',
  like: '#FF2D55',
  pro: '#FFC53D',
  proSoft: 'rgba(255, 197, 61, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  gradientStart: '#00CAE0',
  gradientEnd: '#7C4DFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.2 },
  hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  bodyLg: { fontSize: 16, fontWeight: '400' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySm: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  small: { fontSize: 11, fontWeight: '500' as const },
  micro: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.2 },
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
});
