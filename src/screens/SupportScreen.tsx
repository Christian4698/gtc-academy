import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ActionCard, PrimaryButton, ScreenScaffold } from './ScreenScaffold';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { GTC_SUPPORT_WHATSAPP, GTC_SUPPORT_WHATSAPP_URL } from '../config/production';
import { SupportService } from '../services/production';
import { usePreferencesStore, useUserStore } from '../hooks/useStore';
import { t } from '../i18n';

export default function SupportScreen() {
  const { user } = useUserStore();
  const { language } = usePreferencesStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      Toast.show({ type: 'error', text1: t('common.error', language), text2: 'Subject and message are required.' });
      return;
    }
    if (!user?.id) return;
    setLoading(true);
    const { error } = await SupportService.createTicket(user.id, subject.trim(), message.trim());
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: t('common.error', language), text2: error });
      return;
    }
    setSubject('');
    setMessage('');
    Toast.show({ type: 'success', text1: 'Support request sent' });
  };

  return (
    <ScreenScaffold title={t('support.title', language)} subtitle={t('support.subtitle', language)}>
      <ActionCard
        title={t('support.whatsapp', language)}
        body={GTC_SUPPORT_WHATSAPP}
        meta="GTC"
        accent={Colors.green}
        onPress={() => Linking.openURL(GTC_SUPPORT_WHATSAPP_URL)}
      />

      <View style={styles.form}>
        <Text style={styles.label}>{t('support.subject', language)}</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder={t('support.subject', language)}
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>{t('support.message', language)}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t('support.message', language)}
          placeholderTextColor={Colors.muted}
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />

        <PrimaryButton label={loading ? t('common.loading', language) : t('support.submit', language)} onPress={submit} />
      </View>

      <TouchableOpacity style={styles.website} onPress={() => Linking.openURL('https://www.generaltechconsult.com')}>
        <Text style={styles.websiteText}>{t('common.visitWebsite', language)}</Text>
      </TouchableOpacity>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  label: {
    color: Colors.dim,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    textTransform: 'uppercase',
    marginBottom: Spacing[2],
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    color: Colors.white,
    fontSize: Typography.size.base,
    fontFamily: Typography.family.regular,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginBottom: Spacing[4],
  },
  textArea: {
    minHeight: 120,
  },
  website: {
    alignItems: 'center',
    padding: Spacing[4],
  },
  websiteText: {
    color: Colors.cyan,
    fontFamily: Typography.family.bold,
  },
});
