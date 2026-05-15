import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';

import { ActionCard, EmptyText, ScreenScaffold } from './ScreenScaffold';
import { CertificateService } from '../services/supabase';
import { useUserStore } from '../hooks/useStore';
import { Certificate } from '../types';
import { Colors, Radius, Spacing, Typography } from '../theme';

export default function CertificateScreen() {
  const route = useRoute<any>();
  const selected = route.params?.certificate as Certificate | undefined;
  const { profile } = useUserStore();
  const { data } = useQuery({
    queryKey: ['certificates', profile?.id],
    queryFn: () => profile ? CertificateService.getByUser(profile.id) : Promise.resolve({ data: [], error: null }),
    select: res => res.data ?? [],
    enabled: Boolean(profile),
  });
  const active = selected ?? data?.[0];

  return (
    <ScreenScaffold title="Certificates" subtitle="Certificates earned from completed courses.">
      {active ? (
        <LinearGradient colors={['#07142D', '#0B2B45']} style={styles.certificate}>
          <Text style={styles.certLabel}>Certificate of Completion</Text>
          <Text style={styles.name}>{active.profile?.full_name ?? profile?.full_name ?? 'GTC Learner'}</Text>
          <Text style={styles.course}>{active.course?.title ?? 'GTC Academy Course'}</Text>
          <Text style={styles.certId}>{active.cert_id}</Text>
        </LinearGradient>
      ) : null}

      {(data ?? []).map(cert => (
        <ActionCard
          key={cert.id}
          title={cert.course?.title ?? cert.cert_id}
          body={`Issued ${new Date(cert.issued_at).toLocaleDateString()}`}
          meta={cert.cert_id}
          accent={Colors.purple}
        />
      ))}
      {(data ?? []).length === 0 ? <EmptyText>Complete a course to earn your first certificate.</EmptyText> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  certificate: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    padding: Spacing[6],
    minHeight: 220,
    justifyContent: 'center',
    marginBottom: Spacing[5],
  },
  certLabel: {
    color: Colors.cyan,
    fontFamily: Typography.family.black,
    fontSize: Typography.size.xs,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  name: {
    marginTop: Spacing[4],
    color: Colors.white,
    fontFamily: Typography.family.black,
    fontSize: Typography.size['2xl'],
    textAlign: 'center',
  },
  course: {
    marginTop: Spacing[2],
    color: Colors.dim,
    fontFamily: Typography.family.medium,
    textAlign: 'center',
  },
  certId: {
    marginTop: Spacing[5],
    color: Colors.amber,
    fontFamily: Typography.family.black,
    textAlign: 'center',
  },
});
