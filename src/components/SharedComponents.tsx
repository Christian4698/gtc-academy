// ============================================================
//  GTC ACADEMY — Shared UI Components
// ============================================================
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, DimensionValue,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../theme';

// ============================================================
//  PROGRESS RING
// ============================================================
interface RingProps {
  value:       number;   // 0-100
  size:        number;
  strokeWidth: number;
  color?:      string;
  label?:      string;
}

export const ProgressRing = ({ value, size, strokeWidth, color = Colors.cyan, label }: RingProps) => {
  const radius     = (size - strokeWidth) / 2;
  const circumf    = radius * 2 * Math.PI;
  const animated   = useRef(new Animated.Value(0)).current;
  const strokeDash = animated.interpolate({ inputRange: [0, 100], outputRange: [circumf, 0] });

  useEffect(() => {
    Animated.timing(animated, {
      toValue:         value,
      duration:        900,
      easing:          Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGrad id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%"   stopColor="#0A3EFF" />
            <Stop offset="100%" stopColor="#00C8FF" />
          </SvgGrad>
        </Defs>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress - using AnimatedCircle workaround */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#ring)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumf}
          strokeDashoffset={circumf - (circumf * value) / 100}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {label !== undefined ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.ringValue, { color }]}>{value}%</Text>
          <Text style={styles.ringLabel}>{label}</Text>
        </View>
      ) : (
        <Text style={[styles.ringValue, { color }]}>{value}%</Text>
      )}
    </View>
  );
};

// ============================================================
//  STAT CARD
// ============================================================
interface StatProps {
  label:  string;
  value:  string;
  color?: string;
  sub?:   string;
  icon?:  string;
}

export const StatCard = ({ label, value, color = Colors.cyan, sub, icon }: StatProps) => (
  <View style={styles.statCard}>
    {icon && <Text style={styles.statIcon}>{icon}</Text>}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={[styles.statSub, { color }]}>{sub}</Text>}
  </View>
);

// ============================================================
//  PREMIUM BANNER
// ============================================================
interface BannerProps {
  onPress: () => void;
  style?:  object;
}

export const PremiumBanner = ({ onPress, style }: BannerProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.bannerWrap, style]}>
    <LinearGradient
      colors={['#1A0840', '#0C1842']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      <View style={styles.bannerBg} />
      <Text style={styles.bannerEmoji}>💎</Text>
      <View style={styles.bannerBody}>
        <Text style={styles.bannerTitle}>Unlock Premium</Text>
        <Text style={styles.bannerSub}>All courses · Templates · Unlimited AI</Text>
      </View>
      <View style={styles.bannerArrow}>
        <Text style={styles.bannerArrowText}>›</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// ============================================================
//  SKELETON LOADER
// ============================================================
interface SkeletonProps {
  width?:   DimensionValue;
  height?:  number;
  radius?:  number;
  count?:   number;
  style?:   object;
}

export const SkeletonBlock = ({ width = '100%', height = 16, radius = Radius.sm, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{
      width, height,
      borderRadius: radius,
      backgroundColor: Colors.surface2,
      opacity,
    }, style]} />
  );
};

export const SkeletonLoader = ({ count = 3, height = 80 }: { count?: number; height?: number }) => (
  <View style={{ gap: Spacing[3] }}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={[styles.skeletonCard, { height }]}>
        <SkeletonBlock width={height - 16} height={height - 16} radius={Radius.md} />
        <View style={{ flex: 1, gap: Spacing[2] }}>
          <SkeletonBlock width="40%" height={14} />
          <SkeletonBlock width="90%" height={16} />
          <SkeletonBlock width="60%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

// ============================================================
//  SECTION HEADER
// ============================================================
interface SectionProps {
  title:    string;
  action?:  string;
  onAction?: () => void;
}

export const SectionHeader = ({ title, action, onAction }: SectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================================
//  PILL / BADGE
// ============================================================
interface PillProps {
  children: React.ReactNode;
  color?:   string;
  bg?:      string;
  size?:    'sm' | 'md';
}

export const Pill = ({ children, color = Colors.cyan, bg = Colors.cyanBg, size = 'sm' }: PillProps) => (
  <View style={[styles.pill, { backgroundColor: bg }, size === 'md' && styles.pillMd]}>
    <Text style={[styles.pillText, { color }, size === 'md' && styles.pillTextMd]}>
      {children}
    </Text>
  </View>
);

// ============================================================
//  DIVIDER
// ============================================================
export const Divider = ({ label }: { label?: string }) => (
  <View style={styles.dividerRow}>
    <View style={styles.dividerLine} />
    {label && <Text style={styles.dividerLabel}>{label}</Text>}
    {label && <View style={styles.dividerLine} />}
  </View>
);

// ============================================================
//  EMPTY STATE
// ============================================================
interface EmptyProps {
  icon:    string;
  title:   string;
  body?:   string;
  action?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon, title, body, action, onAction }: EmptyProps) => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {body && <Text style={styles.emptyBody}>{body}</Text>}
    {action && (
      <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.8}>
        <LinearGradient colors={Colors.gradBlue} style={styles.emptyBtnGrad}>
          <Text style={styles.emptyBtnText}>{action}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================================
//  STYLES
// ============================================================
const styles = StyleSheet.create({
  // Ring
  ringValue: {
    fontSize:   Typography.size['2xl'],
    fontFamily: Typography.family.black,
    letterSpacing: Typography.letterSpacing.tight,
    lineHeight: Typography.size['2xl'],
  },
  ringLabel: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.medium,
    color:      Colors.muted,
    marginTop:  2,
  },

  // Stat card
  statCard: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.md,
    padding:         Spacing[3],
    minWidth:        0,
  },
  statIcon: {
    fontSize:     18,
    marginBottom: 4,
  },
  statValue: {
    fontSize:      Typography.size.xl,
    fontFamily:    Typography.family.black,
    letterSpacing: Typography.letterSpacing.tight,
    lineHeight:    Typography.size.xl * 1.1,
  },
  statLabel: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.semiBold,
    color:      Colors.muted,
    marginTop:  3,
    letterSpacing: Typography.letterSpacing.wide,
  },
  statSub: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.medium,
    marginTop:  2,
    opacity:    0.7,
  },

  // Premium banner
  bannerWrap: {
    borderRadius: Radius.xl,
    overflow:     'hidden',
    marginVertical: Spacing[2],
    borderWidth:  1,
    borderColor:  Colors.borderPurple,
  },
  banner: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing[4],
    gap:            Spacing[3],
    position:       'relative',
    overflow:       'hidden',
  },
  bannerBg: {
    position:        'absolute',
    right:           -30,
    top:             -30,
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: 'rgba(155,115,248,0.1)',
  },
  bannerEmoji: { fontSize: 28 },
  bannerBody:  { flex: 1 },
  bannerTitle: {
    fontSize:   Typography.size.base,
    fontFamily: Typography.family.bold,
    color:      Colors.purple,
  },
  bannerSub: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.regular,
    color:      Colors.muted,
    marginTop:  2,
  },
  bannerArrow: {
    width:          28,
    height:         28,
    borderRadius:   Radius.full,
    backgroundColor: Colors.purpleBg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  bannerArrowText: {
    fontSize:   18,
    color:      Colors.purple,
    lineHeight: 22,
  },

  // Skeleton
  skeletonCard: {
    flexDirection:   'row',
    gap:             Spacing[3],
    backgroundColor: Colors.surface,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.lg,
    padding:         Spacing[3],
    alignItems:      'center',
  },

  // Section header
  section: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing[3],
    marginTop:      Spacing[1],
  },
  sectionTitle: {
    fontSize:   Typography.size.base,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
  },
  sectionAction: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.semiBold,
    color:      Colors.cyan,
  },

  // Pill
  pill: {
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical:   3,
    alignSelf:       'flex-start',
  },
  pillMd: {
    paddingHorizontal: Spacing[3],
    paddingVertical:   Spacing[1],
  },
  pillText: {
    fontSize:      Typography.size.xs,
    fontFamily:    Typography.family.bold,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  pillTextMd: {
    fontSize:   Typography.size.sm,
    letterSpacing: 0,
    textTransform: 'none',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[3],
    marginVertical: Spacing[4],
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: Colors.border,
  },
  dividerLabel: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.medium,
    color:      Colors.muted,
  },

  // Empty state
  empty: {
    alignItems:  'center',
    paddingVertical: Spacing[12],
    paddingHorizontal: Spacing[6],
  },
  emptyIcon: {
    fontSize:     56,
    marginBottom: Spacing[4],
  },
  emptyTitle: {
    fontSize:   Typography.size.lg,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
    textAlign:  'center',
    marginBottom: Spacing[2],
  },
  emptyBody: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.regular,
    color:      Colors.muted,
    textAlign:  'center',
    lineHeight: Typography.size.sm * 1.6,
    marginBottom: Spacing[6],
  },
  emptyBtn: {
    borderRadius: Radius.md,
    overflow:     'hidden',
  },
  emptyBtnGrad: {
    paddingHorizontal: Spacing[6],
    paddingVertical:   Spacing[3],
  },
  emptyBtnText: {
    fontSize:   Typography.size.base,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
  },
});
