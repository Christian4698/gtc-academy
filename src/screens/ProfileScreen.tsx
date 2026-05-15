import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { ActionCard, ScreenScaffold } from './ScreenScaffold';
import { AuthService } from '../services/supabase';
import { usePreferencesStore, useUserStore } from '../hooks/useStore';
import { GTC_WEBSITE_URL } from '../config/production';
import { t } from '../i18n';
import { Colors, Radius, Spacing, Typography } from '../theme';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { user, profile, clear, isAdmin } = useUserStore();
  const { language } = usePreferencesStore();

  const signOut = async () => {
    await AuthService.signOut();
    clear();
  };

  return (
    <ScreenScaffold title={t('profile.title', language)} subtitle={t('profile.subtitle', language)}>
      <LinearGradient colors={Colors.gradCard} style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.full_name?.slice(0, 2).toUpperCase() ?? 'GT'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profile?.full_name ?? 'GTC Learner'}</Text>
          <Text style={styles.email}>{user?.email ?? 'demo@gtcacademy.local'}</Text>
          <Text style={styles.plan}>{profile?.role ?? 'student'} / {profile?.plan?.replace('_', ' ') ?? 'free'}</Text>
        </View>
      </LinearGradient>

      <ActionCard title={t('common.visitWebsite', language)} body={GTC_WEBSITE_URL} meta="GTC" accent={Colors.green} onPress={() => Linking.openURL(GTC_WEBSITE_URL)} />
      <ActionCard title="Premium plan" body="Manage your subscription and unlock premium courses." meta="Account" accent={Colors.amber} onPress={() => nav.navigate('Premium')} />
      <ActionCard title="Templates" body="Download Excel and Google Sheets files." meta="Resources" accent={Colors.green} onPress={() => nav.navigate('Templates')} />
      <ActionCard title="Certificates" body="View certificates earned from completed courses." meta="Achievements" accent={Colors.purple} onPress={() => nav.navigate('Certificate')} />
      <ActionCard title="Notifications" body="Review course updates and announcements." meta="Inbox" accent={Colors.cyan} onPress={() => nav.navigate('Notifications')} />
      <ActionCard title={t('settings.title', language)} body={t('settings.subtitle', language)} meta="System" accent={Colors.cyan} onPress={() => nav.navigate('Settings')} />
      <ActionCard title={t('support.title', language)} body={t('support.subtitle', language)} meta="GTC" accent={Colors.green} onPress={() => nav.navigate('Support')} />
      <ActionCard title={t('settings.legal', language)} body={t('legal.subtitle', language)} meta="Compliance" accent={Colors.amber} onPress={() => nav.navigate('Legal')} />
      {isAdmin() ? (
        <ActionCard title="Admin dashboard" body="Quick platform stats and broadcast tools." meta="Team" accent={Colors.red} onPress={() => nav.navigate('Admin')} />
      ) : null}

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    padding: Spacing[5],
    marginBottom: Spacing[5],
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cyanBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.cyan,
    fontSize: Typography.size.lg,
    fontFamily: Typography.family.black,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  email: {
    marginTop: 2,
    color: Colors.muted,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
  },
  plan: {
    marginTop: Spacing[2],
    alignSelf: 'flex-start',
    color: Colors.amber,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    textTransform: 'uppercase',
  },
  signOut: {
    marginTop: Spacing[4],
    alignItems: 'center',
    padding: Spacing[4],
  },
  signOutText: {
    color: Colors.red,
    fontFamily: Typography.family.bold,
  },
});
