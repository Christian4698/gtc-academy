// ============================================================
//  GTC ACADEMY — Design System
// ============================================================
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── COLORS ────────────────────────────────────────────────────────────────────
export const Colors = {
  // Backgrounds
  bg:       '#030C1E',
  bg2:      '#050F24',
  bg3:      '#081530',
  surface:  'rgba(255, 255, 255, 0.04)',
  surface2: 'rgba(255, 255, 255, 0.07)',
  surface3: 'rgba(255, 255, 255, 0.11)',

  // Borders
  border:       'rgba(255, 255, 255, 0.08)',
  border2:      'rgba(255, 255, 255, 0.14)',
  borderCyan:   'rgba(0, 200, 255, 0.3)',
  borderGreen:  'rgba(0, 224, 154, 0.3)',
  borderAmber:  'rgba(255, 176, 32, 0.3)',
  borderPurple: 'rgba(155, 115, 248, 0.3)',
  borderRed:    'rgba(255, 94, 94, 0.3)',

  // Brand
  cyan:     '#00C8FF',
  cyanBg:   'rgba(0, 200, 255, 0.10)',
  cyanDark: '#0099CC',

  // Semantic
  green:    '#00E09A',
  greenBg:  'rgba(0, 224, 154, 0.10)',
  amber:    '#FFB020',
  amberBg:  'rgba(255, 176, 32, 0.10)',
  purple:   '#9B73F8',
  purpleBg: 'rgba(155, 115, 248, 0.10)',
  red:      '#FF5E5E',
  redBg:    'rgba(255, 94, 94, 0.10)',

  // Text
  white:    '#FFFFFF',
  dim:      'rgba(255, 255, 255, 0.55)',
  muted:    'rgba(255, 255, 255, 0.30)',
  faint:    'rgba(255, 255, 255, 0.15)',

  // Course accent colours
  excel:    '#0A6EFF',
  data:     '#00C896',
  bi:       '#7C3AED',
  sheets:   '#FF6B35',
  consult:  '#E91E8C',

  // Gradients (as arrays for LinearGradient)
  gradBlue:    ['#0A3EFF', '#00C8FF'] as const,
  gradGreen:   ['#00A86B', '#00E09A'] as const,
  gradPurple:  ['#7B35FF', '#00C8FF'] as const,
  gradAmber:   ['#FF8C00', '#FFB020'] as const,
  gradDark:    ['#081832', '#0A1F42'] as const,
  gradCard:    ['rgba(10,30,80,0.8)', 'rgba(5,15,36,0.95)'] as const,
} as const;

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
export const Typography = {
  family: {
    regular:  'Outfit_400Regular',
    medium:   'Outfit_500Medium',
    semiBold: 'Outfit_600SemiBold',
    bold:     'Outfit_700Bold',
    extraBold:'Outfit_800ExtraBold',
    black:    'Outfit_900Black',
  },
  size: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  letterSpacing: {
    tight:  0,
    normal: 0,
    wide:   0.5,
    wider:  1.0,
    widest: 2.0,
  },
} as const;

// ── SPACING ───────────────────────────────────────────────────────────────────
export const Spacing = {
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ── RADIUS ────────────────────────────────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
} as const;

// ── SHADOWS ───────────────────────────────────────────────────────────────────
export const Shadows = {
  cyan: {
    shadowColor:   '#00C8FF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  12,
    elevation:     8,
  },
  card: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius:  8,
    elevation:     4,
  },
  purple: {
    shadowColor:   '#9B73F8',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  16,
    elevation:     8,
  },
} as const;

// ── SCREEN DIMENSIONS ─────────────────────────────────────────────────────────
export const Screen = {
  width:  SCREEN_W,
  height: SCREEN_H,
  isSmall: SCREEN_W < 375,
  isLarge: SCREEN_W >= 414,
  isIOS:   Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
} as const;

// ── ANIMATION TIMING ──────────────────────────────────────────────────────────
export const Timing = {
  fast:   150,
  normal: 250,
  slow:   400,
  spring: { damping: 15, stiffness: 200 },
} as const;

// ── COURSE ACCENT MAP ─────────────────────────────────────────────────────────
export const CourseAccents: Record<string, string> = {
  excel:      Colors.excel,
  sheets:     Colors.sheets,
  data:       Colors.data,
  bi:         Colors.bi,
  dashboards: Colors.consult,
  consulting: Colors.cyan,
};

// ── PLAN COLOURS ──────────────────────────────────────────────────────────────
export const PlanColors = {
  free:             { text: Colors.dim,    bg: Colors.surface  },
  premium_monthly:  { text: Colors.amber,  bg: Colors.amberBg  },
  premium_annual:   { text: Colors.purple, bg: Colors.purpleBg },
} as const;
