// homiHire Design System — Dark industrial with amber accents
export const COLORS = {
  // Core
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceElevated: '#1C1C26',
  surfaceBorder: '#2A2A38',

  // Brand
  primary: '#F5A623',        // Amber/Gold — main brand color
  primaryDark: '#D4891A',
  primaryLight: '#FFD080',
  primaryMuted: 'rgba(245,166,35,0.12)',

  // Text
  textPrimary: '#F0EFE8',
  textSecondary: '#9B9AA8',
  textMuted: '#5C5B6B',
  textInverse: '#0A0A0F',

  // Status
  success: '#3DBA7E',
  successMuted: 'rgba(61,186,126,0.12)',
  error: '#E05252',
  errorMuted: 'rgba(224,82,82,0.12)',
  warning: '#F5A623',
  warningMuted: 'rgba(245,166,35,0.15)',
  info: '#4A9EFF',
  infoMuted: 'rgba(74,158,255,0.12)',

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',

  // White
  white: '#FFFFFF',
  black: '#000000',
};

export const FONTS = {
  // Font families
  heading: 'System',        // Will use native system font (bold weight)
  body: 'System',

  // Sizes
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 44,

  // Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};
