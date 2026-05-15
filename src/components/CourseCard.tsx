// ============================================================
//  GTC ACADEMY — CourseCard.tsx
// ============================================================
import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Course } from '../types';

const { width: W } = Dimensions.get('window');

interface Props {
  course:       Course;
  onPress:      () => void;
  showProgress?: boolean;
  compact?:      boolean;
  horizontal?:   boolean;  // for horizontal scroll carousels
}

// ── LEVEL BADGE ───────────────────────────────────────────────────────────────
const LevelBadge = ({ level }: { level: string }) => {
  const cfg = {
    beginner:     { color: Colors.green,  bg: Colors.greenBg  },
    intermediate: { color: Colors.amber,  bg: Colors.amberBg  },
    advanced:     { color: Colors.purple, bg: Colors.purpleBg },
  }[level] ?? { color: Colors.dim, bg: Colors.surface };

  return (
    <View style={[styles.levelBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.levelText, { color: cfg.color }]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Text>
    </View>
  );
};

// ── CATEGORY ICON BOX ─────────────────────────────────────────────────────────
const CategoryBox = ({ icon, accent, size = 48 }: { icon: string; accent: string; size?: number }) => (
  <View style={[styles.catBox, {
    width:           size,
    height:          size,
    borderRadius:    Math.round(size * 0.27),
    backgroundColor: accent + '18',
    borderColor:     accent + '30',
  }]}>
    <Text style={{ fontSize: size * 0.44 }}>{icon}</Text>
  </View>
);

// ── COURSE ICON MAP ───────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  excel:      '📊',
  data:       '📈',
  bi:         '🎯',
  sheets:     '⚡',
  dashboards: '💡',
  consulting: '🤝',
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CourseCard({ course, onPress, showProgress = false, compact = false, horizontal = false }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const accent = course.category?.color ?? Colors.cyan;
  const icon   = ICONS[course.category?.slug ?? ''] ?? '📚';

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  if (horizontal) {
    return (
      <Animated.View style={[styles.hCard, { transform: [{ scale }] }]}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
          <LinearGradient
            colors={[accent + '30', accent + '08']}
            style={styles.hCardGrad}
          >
            <CategoryBox icon={icon} accent={accent} size={44} />
            <View style={styles.hCardBody}>
              <LevelBadge level={course.level} />
              <Text style={styles.hTitle} numberOfLines={2}>{course.title}</Text>
              <Text style={styles.hMeta}>{course.lessons_count ?? 0} lessons · {course.enrolled_count.toLocaleString()} enrolled</Text>
              {showProgress && (course.progress ?? 0) > 0 && (
                <View style={styles.progressWrap}>
                  <View style={[styles.progressFill, { width: `${course.progress}%`, backgroundColor: accent }]} />
                </View>
              )}
            </View>
            {course.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>PRO</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <View style={styles.cardInner}>
          {/* Thumbnail or gradient box */}
          {course.thumbnail_url ? (
            <Image
              source={{ uri: course.thumbnail_url }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: accent + '18' }]}>
              <Text style={styles.thumbIcon}>{icon}</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.topRow}>
              <LevelBadge level={course.level} />
              {course.is_premium && (
                <View style={styles.premiumChip}>
                  <Text style={styles.premiumChipText}>💎 PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={2}>{course.title}</Text>

            {!compact && (
              <View style={styles.metaRow}>
                <Text style={styles.meta}>📚 {course.lessons_count ?? 0} lessons</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.meta}>👥 {course.enrolled_count.toLocaleString()}</Text>
                {course.rating > 0 && <>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.meta}>⭐ {course.rating.toFixed(1)}</Text>
                </>}
              </View>
            )}

            {/* Progress bar */}
            {showProgress && (course.progress ?? 0) > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={[styles.progressPct, { color: accent }]}>{course.progress}%</Text>
                </View>
                <View style={styles.progressWrap}>
                  <View style={[styles.progressFill, { width: `${course.progress}%`, backgroundColor: accent }]} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Category accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: accent }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
export const CourseCardSkeleton = () => (
  <View style={[styles.card, styles.skeleton]}>
    <View style={styles.cardInner}>
      <View style={[styles.thumbnail, styles.skeletonBlock]} />
      <View style={styles.content}>
        <View style={[styles.skeletonLine, { width: 60, height: 18 }]} />
        <View style={[styles.skeletonLine, { width: '90%', height: 16, marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: '70%', height: 14, marginTop: 4 }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 12, marginTop: 6 }]} />
      </View>
    </View>
  </View>
);

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Vertical card
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    Spacing[3],
    overflow:        'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    padding:       Spacing[3],
    gap:           Spacing[3],
  },
  thumbnail: {
    width:        72,
    height:       72,
    borderRadius: Radius.md,
    flexShrink:   0,
  },
  thumbPlaceholder: {
    width:          72,
    height:         72,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  thumbIcon: {
    fontSize: 30,
  },
  content: {
    flex:    1,
    minWidth: 0,
    gap:     Spacing[1.5],
  },
  topRow: {
    flexDirection: 'row',
    gap:           Spacing[1.5],
    alignItems:    'center',
  },
  title: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
    lineHeight: Typography.size.sm * 1.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[1],
    flexWrap:      'wrap',
  },
  meta: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.regular,
    color:      Colors.muted,
  },
  metaDot: {
    fontSize:   Typography.size.xs,
    color:      Colors.muted,
  },
  accentStrip: {
    height: 2,
  },

  // Level badge
  levelBadge: {
    borderRadius:    Radius.full,
    paddingHorizontal: 8,
    paddingVertical:   2,
  },
  levelText: {
    fontSize:      Typography.size.xs,
    fontFamily:    Typography.family.bold,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },

  // Premium chip
  premiumChip: {
    backgroundColor: Colors.amberBg,
    borderRadius:    Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  premiumChipText: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.bold,
    color:      Colors.amber,
  },

  // Progress
  progressSection: {
    marginTop: Spacing[1],
  },
  progressHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   4,
  },
  progressLabel: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.medium,
    color:      Colors.muted,
  },
  progressPct: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.bold,
  },
  progressWrap: {
    height:          4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    Radius.full,
    overflow:        'hidden',
  },
  progressFill: {
    height:       '100%',
    borderRadius: Radius.full,
  },

  // Horizontal card
  hCard: {
    width:        W * 0.72,
    marginRight:  Spacing[3],
    borderRadius: Radius.lg,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  Colors.border,
  },
  hCardGrad: {
    padding:    Spacing[4],
    gap:        Spacing[3],
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hCardBody: {
    flex: 1,
    gap:  Spacing[1.5],
  },
  hTitle: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
  },
  hMeta: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.regular,
    color:      Colors.muted,
  },

  // Category box
  catBox: {
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  // Premium badge overlay
  premiumBadge: {
    position:        'absolute',
    top:             Spacing[2],
    right:           Spacing[2],
    backgroundColor: Colors.amberBg,
    borderWidth:     1,
    borderColor:     Colors.borderAmber,
    borderRadius:    Radius.full,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  premiumBadgeText: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.black,
    color:      Colors.amber,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // Skeleton
  skeleton: {
    borderColor: 'transparent',
  },
  skeletonBlock: {
    backgroundColor: Colors.surface2,
  },
  skeletonLine: {
    backgroundColor: Colors.surface2,
    borderRadius:    Radius.sm,
  },
});
