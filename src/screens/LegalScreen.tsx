import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ActionCard, PrimaryButton, ScreenScaffold } from './ScreenScaffold';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { LegalService } from '../services/production';
import { LegalDocument } from '../types';
import { t } from '../i18n';
import { usePreferencesStore } from '../hooks/useStore';

const documentOrder: LegalDocument['slug'][] = ['terms', 'privacy', 'refund', 'certificate_disclaimer'];

export default function LegalScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { language } = usePreferencesStore();
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [active, setActive] = useState<LegalDocument['slug']>(route.params?.document ?? 'terms');

  useEffect(() => {
    LegalService.list(language).then(result => {
      setDocs(result.data ?? LegalService.fallbackDocuments(language));
    });
  }, [language]);

  const orderedDocs = useMemo(() => {
    const source = docs.length ? docs : LegalService.fallbackDocuments(language);
    return documentOrder
      .map(slug => source.find(doc => doc.slug === slug))
      .filter(Boolean) as LegalDocument[];
  }, [docs, language]);

  const activeDoc = orderedDocs.find(doc => doc.slug === active) ?? orderedDocs[0];

  return (
    <ScreenScaffold
      title={t('legal.title', language)}
      subtitle={t('legal.subtitle', language)}
      right={<TouchableOpacity style={styles.close} onPress={() => nav.goBack()}><Text style={styles.closeText}>X</Text></TouchableOpacity>}
    >
      <View style={styles.tabs}>
        {orderedDocs.map(doc => (
          <TouchableOpacity
            key={doc.slug}
            style={[styles.tab, active === doc.slug && styles.tabActive]}
            onPress={() => setActive(doc.slug)}
          >
            <Text style={[styles.tabText, active === doc.slug && styles.tabTextActive]}>
              {doc.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.document}>
        <Text style={styles.version}>Version {activeDoc?.version ?? '1.0'}</Text>
        <Text style={styles.docTitle}>{activeDoc?.title}</Text>
        <Text style={styles.body}>{activeDoc?.body}</Text>
      </View>

      <ActionCard
        title={t('legal.certificateWording', language)}
        meta="Compliance"
        accent={Colors.amber}
        body="Certificate issued by General Tech Consult. International accreditation can be enabled later only after legal validation by an administrator."
      />

      <PrimaryButton label={t('common.save', language)} onPress={() => nav.goBack()} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  close: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  closeText: {
    color: Colors.white,
    fontFamily: Typography.family.black,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  tab: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
  },
  tabActive: {
    borderColor: Colors.borderCyan,
    backgroundColor: Colors.cyanBg,
  },
  tabText: {
    color: Colors.muted,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
  },
  tabTextActive: {
    color: Colors.cyan,
  },
  document: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  version: {
    color: Colors.cyan,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    textTransform: 'uppercase',
    marginBottom: Spacing[2],
  },
  docTitle: {
    color: Colors.white,
    fontSize: Typography.size.lg,
    fontFamily: Typography.family.black,
    marginBottom: Spacing[3],
  },
  body: {
    color: Colors.dim,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    lineHeight: Typography.size.sm * 1.6,
  },
});
