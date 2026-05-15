import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';

import { AdminService } from '../services/supabase';
import { AdminProductionService } from '../services/production';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { ActionCard, PrimaryButton, ScreenScaffold } from './ScreenScaffold';

const adminSections = [
  ['Users', 'All users, profile photos, roles, and account status.', Colors.cyan],
  ['Students', 'Progress, purchases, certificates, and learning analytics.', Colors.green],
  ['Trainers', 'Trainer approvals, profiles, ratings, and course KPIs.', Colors.purple],
  ['Courses', 'Create, edit, approve, publish, archive, and secure content.', Colors.amber],
  ['Purchases', 'Payment status, receipts, refunds, coupons, and manual access.', Colors.green],
  ['Exams', 'Attempts, pass rates, timers, audit logs, and proctoring flags.', Colors.red],
  ['Certificates', 'Records, public verification, QR links, and revocation controls.', Colors.purple],
  ['Promotions', 'Discounts, promo codes, campaign windows, and active status.', Colors.amber],
  ['Notifications', 'Email, push, and in-app notification delivery.', Colors.cyan],
  ['Analytics/KPIs', 'Revenue, completion, pass rate, trainers, and monthly sales.', Colors.green],
] as const;

export default function AdminScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => AdminService.getStats(),
  });
  const { data: kpiResult } = useQuery({
    queryKey: ['admin-production-kpis'],
    queryFn: () => AdminProductionService.getKpis(),
  });

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      Toast.show({ type: 'error', text1: 'Add a title and message' });
      return;
    }
    await AdminService.sendBroadcastNotification(title.trim(), body.trim(), 'system');
    setTitle('');
    setBody('');
    Toast.show({ type: 'success', text1: 'Broadcast queued' });
  };

  return (
    <ScreenScaffold title="Admin" subtitle="A compact operational view for the academy team.">
      {isLoading ? <ActivityIndicator color={Colors.cyan} /> : (
        <View style={styles.statsRow}>
          <Stat label="Users" value={data?.totalUsers ?? 0} color={Colors.cyan} />
          <Stat label="Certificates" value={data?.certificates ?? 0} color={Colors.purple} />
          <Stat label="Subs" value={data?.activeSubs ?? 0} color={Colors.green} />
        </View>
      )}

      <View style={styles.statsGrid}>
        <Stat label="Paid" value={kpiResult?.data?.paid_students ?? 0} color={Colors.green} />
        <Stat label="Revenue" value={Math.round(kpiResult?.data?.revenue ?? 0)} color={Colors.amber} />
        <Stat label="Passed" value={kpiResult?.data?.passed_exams ?? 0} color={Colors.purple} />
      </View>

      <Text style={styles.sectionTitle}>Operational sections</Text>
      {adminSections.map(([titleText, bodyText, color]) => (
        <ActionCard
          key={titleText}
          title={titleText}
          body={bodyText}
          meta="Phase 1"
          accent={color}
        />
      ))}

      <View style={styles.form}>
        <Text style={styles.formTitle}>Broadcast notification</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={Colors.muted} style={styles.input} />
        <TextInput value={body} onChangeText={setBody} placeholder="Message" placeholderTextColor={Colors.muted} style={[styles.input, styles.message]} multiline />
        <PrimaryButton label="Send broadcast" onPress={send} />
      </View>
    </ScreenScaffold>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  stat: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing[3],
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.family.black,
  },
  statLabel: {
    marginTop: Spacing[1],
    color: Colors.muted,
    fontFamily: Typography.family.bold,
    fontSize: Typography.size.xs,
  },
  form: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing[4],
    marginTop: Spacing[4],
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: Typography.size.md,
    fontFamily: Typography.family.black,
    marginBottom: Spacing[3],
  },
  formTitle: {
    color: Colors.white,
    fontFamily: Typography.family.black,
    fontSize: Typography.size.base,
    marginBottom: Spacing[3],
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    padding: Spacing[3],
    color: Colors.white,
    fontFamily: Typography.family.regular,
    marginBottom: Spacing[3],
  },
  message: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
});
