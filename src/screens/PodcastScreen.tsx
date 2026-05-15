import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import PodcastCard from '../components/PodcastCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { PodcastService } from '../services/supabase';
import { usePlayerStore, useUserStore } from '../hooks/useStore';
import { ScreenScaffold } from './ScreenScaffold';

export default function PodcastScreen() {
  const isPremium = useUserStore(state => state.isPremium);
  const { currentPodcast, isPlaying, setCurrentPodcast, setPlaying } = usePlayerStore();
  const { data, isLoading } = useQuery({
    queryKey: ['podcasts'],
    queryFn: () => PodcastService.getAll(),
    select: res => res.data ?? [],
  });

  return (
    <ScreenScaffold title="Podcasts" subtitle="Short audio lessons for reporting, analytics, and business data habits.">
      {isLoading ? <SkeletonLoader count={3} height={76} /> : null}
      {(data ?? []).map(podcast => (
        <PodcastCard
          key={podcast.id}
          podcast={podcast}
          isPremium={!isPremium() && podcast.is_premium}
          onPress={() => {
            setCurrentPodcast(podcast);
            setPlaying(true);
          }}
        />
      ))}

      {currentPodcast ? (
        <TouchableOpacity style={styles.player} onPress={() => setPlaying(!isPlaying)} activeOpacity={0.85}>
          <Text style={styles.playerLabel}>{isPlaying ? 'Playing now' : 'Paused'}</Text>
          <Text style={styles.playerTitle} numberOfLines={1}>{currentPodcast.title}</Text>
        </TouchableOpacity>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  player: {
    marginTop: Spacing[4],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    backgroundColor: Colors.cyanBg,
  },
  playerLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    color: Colors.cyan,
    textTransform: 'uppercase',
    letterSpacing: Typography.letterSpacing.wide,
  },
  playerTitle: {
    marginTop: Spacing[1],
    fontSize: Typography.size.base,
    fontFamily: Typography.family.bold,
    color: Colors.white,
  },
});
