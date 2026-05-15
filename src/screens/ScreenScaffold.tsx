import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius, Spacing, Typography } from '../theme';

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}

interface ActionCardProps {
  title: string;
  body?: string;
  meta?: string;
  onPress?: () => void;
  accent?: string;
  right?: React.ReactNode;
}

export function ScreenScaffold({ title, subtitle, children, right }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>GTC Academy</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
      <View style={{ height: Spacing[8] }} />
    </ScrollView>
  );
}

export function ActionCard({ title, body, meta, onPress, accent = Colors.cyan, right }: ActionCardProps) {
  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.cardBody}>
        {meta ? <Text style={[styles.meta, { color: accent }]}>{meta}</Text> : null}
        <Text style={styles.cardTitle}>{title}</Text>
        {body ? <Text style={styles.cardBodyText}>{body}</Text> : null}
      </View>
      {right}
    </>
  );

  return onPress ? (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={styles.card}>
      {content}
    </View>
  );
}

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient colors={Colors.gradBlue} style={styles.buttonGrad}>
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function EmptyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[5],
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    color: Colors.cyan,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing[1],
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontFamily: Typography.family.black,
    color: Colors.white,
    lineHeight: Typography.size['2xl'] * 1.15,
  },
  subtitle: {
    marginTop: Spacing[2],
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    color: Colors.muted,
    lineHeight: Typography.size.sm * 1.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  accent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: Spacing[4],
    minWidth: 0,
  },
  meta: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing[1],
  },
  cardTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.family.bold,
    color: Colors.white,
    lineHeight: Typography.size.base * 1.35,
  },
  cardBodyText: {
    marginTop: Spacing[1],
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    color: Colors.muted,
    lineHeight: Typography.size.sm * 1.45,
  },
  button: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  buttonGrad: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  empty: {
    paddingVertical: Spacing[8],
    textAlign: 'center',
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.medium,
    color: Colors.muted,
  },
});

export const scaffoldStyles = styles;
