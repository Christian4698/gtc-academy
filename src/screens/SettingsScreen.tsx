import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { ActionCard, ScreenScaffold } from './ScreenScaffold';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { GTC_WEBSITE_URL } from '../config/production';
import { LegalService } from '../services/production';
import { OfflineCacheService } from '../services/offline';
import { ProfileService } from '../services/supabase';
import { usePreferencesStore, useUserStore } from '../hooks/useStore';
import { languageLabel, t } from '../i18n';
import { LanguageCode, ThemePreference } from '../types';

const themes: ThemePreference[] = ['system', 'light', 'dark'];
const languages: LanguageCode[] = ['fr', 'en'];

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const { user, profile, setProfile } = useUserStore();
  const preferences = usePreferencesStore();
  const [syncItems, setSyncItems] = useState(0);

  useEffect(() => {
    OfflineCacheService.getSyncQueue().then(queue => setSyncItems(queue.length));
  }, []);

  const updateLanguage = async (language: LanguageCode) => {
    preferences.setLanguage(language);
    if (user?.id) {
      const { data, error } = await ProfileService.updateProfile(user.id, { preferred_language: language } as any);
      if (data) {
        setProfile({ ...profile, ...data });
        await OfflineCacheService.cacheProfile(data);
      }
      if (error) Toast.show({ type: 'error', text1: t('common.error', language), text2: error });
    }
  };

  const updateTheme = async (theme: ThemePreference) => {
    preferences.setTheme(theme);
    if (user?.id) {
      const { data } = await ProfileService.updateProfile(user.id, { theme_preference: theme } as any);
      if (data) setProfile({ ...profile, ...data });
    }
  };

  const requestDeletion = async (type: 'data' | 'account') => {
    if (!user?.id) return;
    const result = type === 'data'
      ? await LegalService.requestDataDeletion(user.id)
      : await LegalService.requestAccountDeletion(user.id);
    Toast.show({
      type: result.error ? 'error' : 'success',
      text1: result.error ? t('common.error', preferences.language) : 'Request submitted',
      text2: result.error ?? undefined,
    });
  };

  return (
    <ScreenScaffold title={t('settings.title', preferences.language)} subtitle={t('settings.subtitle', preferences.language)}>
      <ActionCard
        title={t('settings.language', preferences.language)}
        body={t('settings.languageBody', preferences.language)}
        meta="Profile"
        accent={Colors.cyan}
        right={<Segmented values={languages} active={preferences.language} label={languageLabel} onChange={updateLanguage} />}
      />

      <ActionCard
        title={t('settings.theme', preferences.language)}
        body={t('settings.themeBody', preferences.language)}
        meta="UI"
        accent={Colors.purple}
        right={<Segmented values={themes} active={preferences.theme} label={value => value} onChange={updateTheme} />}
      />

      <ActionCard
        title={t('settings.lowData', preferences.language)}
        body={t('settings.lowDataBody', preferences.language)}
        meta="Africa"
        accent={Colors.green}
        right={<SwitchButton active={preferences.lowDataMode} onPress={() => preferences.setLowDataMode(!preferences.lowDataMode)} />}
      />

      <ActionCard
        title={t('settings.offline', preferences.language)}
        body={`${t('settings.offlineBody', preferences.language)} Pending sync: ${syncItems}`}
        meta="Hybrid"
        accent={Colors.amber}
        right={<SwitchButton active={preferences.offlineMode} onPress={() => preferences.setOfflineMode(!preferences.offlineMode)} />}
      />

      <ActionCard title={t('settings.legal', preferences.language)} body={t('legal.subtitle', preferences.language)} meta="Compliance" accent={Colors.cyan} onPress={() => nav.navigate('Legal')} />

      <ActionCard
        title={t('settings.website', preferences.language)}
        body={GTC_WEBSITE_URL}
        meta="GTC"
        accent={Colors.green}
        onPress={() => Linking.openURL(GTC_WEBSITE_URL)}
      />

      <ActionCard
        title={t('settings.dataDeletion', preferences.language)}
        body="Create a data deletion request for admin processing."
        meta="Privacy"
        accent={Colors.amber}
        onPress={() => requestDeletion('data')}
      />

      <ActionCard
        title={t('settings.accountDeletion', preferences.language)}
        body="Request account deletion. Critical business records remain protected by legal retention rules."
        meta="Account"
        accent={Colors.red}
        onPress={() => requestDeletion('account')}
      />
    </ScreenScaffold>
  );
}

function Segmented<T extends string>({
  values,
  active,
  label,
  onChange,
}: {
  values: T[];
  active: T;
  label: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {values.map(value => (
        <TouchableOpacity key={value} style={[styles.segment, active === value && styles.segmentActive]} onPress={() => onChange(value)}>
          <Text style={[styles.segmentText, active === value && styles.segmentTextActive]}>{label(value)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SwitchButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.switch, active && styles.switchActive]} onPress={onPress}>
      <View style={[styles.knob, active && styles.knobActive]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingRight: Spacing[3],
  },
  segment: {
    minWidth: 46,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1.5],
    alignItems: 'center',
  },
  segmentActive: {
    borderColor: Colors.borderCyan,
    backgroundColor: Colors.cyanBg,
  },
  segmentText: {
    color: Colors.muted,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    textTransform: 'capitalize',
  },
  segmentTextActive: {
    color: Colors.cyan,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    padding: 3,
    marginRight: Spacing[3],
  },
  switchActive: {
    borderColor: Colors.borderGreen,
    backgroundColor: Colors.greenBg,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.muted,
  },
  knobActive: {
    transform: [{ translateX: 18 }],
    backgroundColor: Colors.green,
  },
});
