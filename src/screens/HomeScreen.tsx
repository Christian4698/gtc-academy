// ============================================================
//  GTC ACADEMY — HomeScreen.tsx
// ============================================================
import React, { useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, RefreshControl, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { Colors, Typography, Spacing, Radius } from '../theme';
import { useUserStore, useCourseStore } from '../hooks/useStore';
import { CourseService, PodcastService } from '../services/supabase';
import { Course, Podcast } from '../types';
import ProgressRing    from '../components/ProgressRing';
import CourseCard      from '../components/CourseCard';
import PodcastCard     from '../components/PodcastCard';
import StatCard        from '../components/StatCard';
import SkeletonLoader  from '../components/SkeletonLoader';
import PremiumBanner   from '../components/PremiumBanner';
import { GTC_WEBSITE_URL } from '../config/production';

const { width: W } = Dimensions.get('window');

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets    = useSafeAreaInsets();
  const nav       = useNavigation<any>();
  const { profile, isPremium } = useUserStore();
  const { enrolledCourses, setEnrolled } = useCourseStore();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  // ── DATA FETCHING ──────────────────────────────────────────────────────────
  const { data: featuredCourses, isLoading: coursesLoading, refetch: refetchCourses } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn:  () => CourseService.getAll(),
    select:   (res) => res.data?.slice(0, 5) ?? [],
  });

  const { data: podcasts, isLoading: podcastsLoading, refetch: refetchPodcasts } = useQuery({
    queryKey: ['podcasts', 'preview'],
    queryFn:  () => PodcastService.getAll(),
    select:   (res) => res.data?.slice(0, 3) ?? [],
  });

  const { data: enrolled, refetch: refetchEnrolled } = useQuery({
    queryKey: ['enrollments', profile?.id],
    queryFn:  () => profile ? CourseService.getEnrolled(profile.id) : Promise.resolve({ data: [], error: null }),
    select:   (res) => res.data ?? [],
    enabled:  !!profile,
  });

  useEffect(() => {
    if (enrolled) setEnrolled(enrolled);
  }, [enrolled, setEnrolled]);

  const inProgress  = (enrolled ?? []).filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
  const totalHours  = (enrolled ?? []).reduce((acc, c) => acc + ((c.progress ?? 0) * 0.24), 0);
  const weeklyScore = 89; // would come from quiz_attempts aggregation
  const streak      = profile?.streak_days ?? 0;

  const isRefreshing = false;
  const onRefresh = useCallback(async () => {
    await Promise.all([refetchCourses(), refetchPodcasts(), refetchEnrolled()]);
  }, []);

  // ── GREETING ──────────────────────────────────────────────────────────────
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />
      }
    >

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => nav.navigate('Profile')}
          activeOpacity={0.8}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <LinearGradient colors={Colors.gradBlue} style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? 'GK'}
              </Text>
            </LinearGradient>
          )}
          {isPremium() && <View style={styles.premiumDot} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.websiteCta} onPress={() => Linking.openURL(GTC_WEBSITE_URL)} activeOpacity={0.85}>
        <View>
          <Text style={styles.websiteTitle}>General Tech Consult</Text>
          <Text style={styles.websiteSub}>Visit the GTC website</Text>
        </View>
        <Text style={styles.websiteArrow}>Open</Text>
      </TouchableOpacity>

      {/* ── HERO PROGRESS CARD ── */}
      <LinearGradient
        colors={['#081832', '#0A1F42']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroBg} />
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>WEEKLY PROGRESS</Text>
          <Text style={styles.heroPct}>{weeklyScore}%</Text>
          <View style={[styles.pill, { marginTop: 6 }]}>
            <Text style={styles.pillText}>📈 +12% this week</Text>
          </View>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${weeklyScore}%` }]} />
          </View>
          {inProgress[0] && (
            <Text style={styles.heroSub} numberOfLines={1}>
              Continue: <Text style={{ color: Colors.cyan }}>{inProgress[0].title}</Text>
            </Text>
          )}
        </View>
        <ProgressRing value={weeklyScore} size={90} strokeWidth={7} color={Colors.cyan} />
      </LinearGradient>

      {/* ── STATS ROW ── */}
      <View style={styles.statsRow}>
        <StatCard label="COURSES"  value={String(enrolled?.length ?? 0)} color={Colors.cyan}   />
        <StatCard label="HOURS"    value={totalHours.toFixed(0)+'h'}     color={Colors.green}  />
        <StatCard label="STREAK"   value={streak+'d'}                    color={Colors.amber}  />
        <StatCard label="SCORE"    value={weeklyScore+'%'}               color={Colors.purple} />
      </View>

      {/* ── CONTINUE LEARNING ── */}
      {inProgress.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <TouchableOpacity onPress={() => nav.navigate('Courses')}>
              <Text style={styles.seeAll}>All courses →</Text>
            </TouchableOpacity>
          </View>
          {inProgress.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={() => nav.navigate('Courses', {
                screen: 'CourseDetail',
                params: { course },
              })}
              showProgress
            />
          ))}
        </>
      )}

      {/* ── FEATURED COURSES ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Courses</Text>
        <TouchableOpacity onPress={() => nav.navigate('Courses')}>
          <Text style={styles.seeAll}>Browse →</Text>
        </TouchableOpacity>
      </View>

      {coursesLoading ? (
        <SkeletonLoader count={3} height={80} />
      ) : (
        featuredCourses?.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onPress={() => nav.navigate('Courses', {
              screen: 'CourseDetail',
              params: { course },
            })}
          />
        ))
      )}

      {/* ── PREMIUM BANNER (free users only) ── */}
      {!isPremium() && (
        <PremiumBanner onPress={() => nav.navigate('Profile', { screen: 'Premium' })} />
      )}

      {/* ── PODCASTS ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest Podcasts</Text>
        <TouchableOpacity onPress={() => nav.navigate('Podcasts')}>
          <Text style={styles.seeAll}>All →</Text>
        </TouchableOpacity>
      </View>

      {podcastsLoading ? (
        <SkeletonLoader count={2} height={70} />
      ) : (
        podcasts?.map(pod => (
          <PodcastCard
            key={pod.id}
            podcast={pod}
            onPress={() => nav.navigate('Podcasts')}
            isPremium={!isPremium() && pod.is_premium}
          />
        ))
      )}

      {/* Bottom padding */}
      <View style={{ height: Spacing[8] }} />
    </ScrollView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      Spacing[4],
    marginBottom:   Spacing[5],
  },
  greeting: {
    fontSize:      Typography.size.sm,
    fontFamily:    Typography.family.semiBold,
    color:         Colors.muted,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  name: {
    fontSize:      Typography.size.xl,
    fontFamily:    Typography.family.black,
    color:         Colors.white,
    letterSpacing: Typography.letterSpacing.tight,
    marginTop:     2,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width:        44,
    height:       44,
    borderRadius: 22,
    alignItems:   'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize:   15,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
  },
  premiumDot: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           12,
    height:          12,
    borderRadius:    6,
    backgroundColor: Colors.amber,
    borderWidth:     2,
    borderColor:     Colors.bg,
  },

  websiteCta: {
    borderWidth: 1,
    borderColor: Colors.borderGreen,
    borderRadius: Radius.lg,
    backgroundColor: Colors.greenBg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginBottom: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  websiteTitle: {
    color: Colors.white,
    fontSize: Typography.size.base,
    fontFamily: Typography.family.black,
  },
  websiteSub: {
    color: Colors.dim,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.medium,
    marginTop: 2,
  },
  websiteArrow: {
    color: Colors.green,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.black,
  },

  // Hero card
  heroCard: {
    borderRadius:   Radius.xl,
    padding:        Spacing[5],
    marginBottom:   Spacing[4],
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1,
    borderColor:    Colors.borderCyan,
    overflow:       'hidden',
  },
  heroBg: {
    position:        'absolute',
    right:           -30,
    top:             -30,
    width:           130,
    height:          130,
    borderRadius:    65,
    backgroundColor: 'rgba(0,200,255,0.05)',
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize:      Typography.size.xs,
    fontFamily:    Typography.family.bold,
    color:         Colors.muted,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom:  Spacing[1.5],
  },
  heroPct: {
    fontSize:      Typography.size['4xl'],
    fontFamily:    Typography.family.black,
    color:         Colors.white,
    letterSpacing: 0,
    lineHeight:    40,
  },
  pill: {
    alignSelf:       'flex-start',
    backgroundColor: Colors.cyanBg,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical:   3,
    borderWidth:     1,
    borderColor:     Colors.borderCyan,
  },
  pillText: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.bold,
    color:      Colors.cyan,
  },
  progressBarWrap: {
    height:          5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    Radius.full,
    marginTop:       Spacing[2],
    marginBottom:    Spacing[1.5],
    overflow:        'hidden',
  },
  progressBarFill: {
    height:          '100%',
    backgroundColor: Colors.cyan,
    borderRadius:    Radius.full,
  },
  heroSub: {
    fontSize:   Typography.size.xs,
    fontFamily: Typography.family.regular,
    color:      Colors.muted,
  },

  // Stats
  statsRow: {
    flexDirection:  'row',
    gap:            Spacing[2],
    marginBottom:   Spacing[5],
  },

  // Section headers
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing[3],
    marginTop:      Spacing[2],
  },
  sectionTitle: {
    fontSize:   Typography.size.md,
    fontFamily: Typography.family.bold,
    color:      Colors.white,
  },
  seeAll: {
    fontSize:   Typography.size.sm,
    fontFamily: Typography.family.semiBold,
    color:      Colors.cyan,
  },
});
