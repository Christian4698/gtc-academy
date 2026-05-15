import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Podcast } from '../types';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  podcast: Podcast;
  onPress: () => void;
  isPremium?: boolean;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return 'Short episode';
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
};

export default function PodcastCard({ podcast, onPress, isPremium = false }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <LinearGradient colors={Colors.gradDark} style={styles.art}>
        <Text style={styles.artText}>{isPremium ? 'PRO' : 'PLAY'}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.meta}>
            Episode {podcast.episode_number ?? '-'} · {formatDuration(podcast.duration_secs)}
          </Text>
          {isPremium && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Premium</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>{podcast.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{podcast.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  art: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    color: Colors.white,
    letterSpacing: Typography.letterSpacing.wide,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  meta: {
    flex: 1,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.semiBold,
    color: Colors.cyan,
  },
  title: {
    marginTop: Spacing[1],
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.bold,
    color: Colors.white,
    lineHeight: Typography.size.sm * 1.35,
  },
  description: {
    marginTop: Spacing[1],
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.regular,
    color: Colors.muted,
    lineHeight: Typography.size.xs * 1.45,
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    backgroundColor: Colors.amberBg,
  },
  badgeText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    color: Colors.amber,
  },
});
