import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { Colors, Radius, Spacing, Typography } from '../theme';
import { PrimaryButton, ScreenScaffold } from './ScreenScaffold';

const highlights = [
  'Learn Technology Skills',
  'Get Certified',
  'Track Your Progress',
  'Learn Online or In-Person',
  'Join GTC Academy',
];

export default function OnboardingScreen() {
  const nav = useNavigation<any>();

  return (
    <ScreenScaffold
      title="Build technology skills with GTC Academy"
      subtitle="A mobile-first academy for Excel, BI, CAD, programming, AI, cloud, cybersecurity, design, and future technology training."
      right={
        <LinearGradient colors={Colors.gradBlue} style={styles.mark}>
          <Text style={styles.markText}>GTC</Text>
        </LinearGradient>
      }
    >
      <LinearGradient colors={Colors.gradCard} style={styles.panel}>
        <Text style={styles.panelTitle}>Premium learning for African technology careers</Text>
        <Text style={styles.panelBody}>
          Learn with practical lessons, offline access, quizzes, progress tracking, templates, AI help, and GTC Verifiable Certificates.
        </Text>
      </LinearGradient>

      <View style={styles.list}>
        {highlights.map((item, index) => (
          <View key={item} style={styles.item}>
            <View style={styles.step}>
              <Text style={styles.stepText}>{index + 1}</Text>
            </View>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton label="Get started" onPress={() => nav.navigate('Auth')} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  panel: {
    borderRadius: Radius.xl,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    marginBottom: Spacing[5],
  },
  panelTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  panelBody: {
    marginTop: Spacing[3],
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    color: Colors.dim,
    lineHeight: Typography.size.sm * 1.6,
  },
  list: {
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.cyanBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.black,
    color: Colors.cyan,
  },
  itemText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.medium,
    color: Colors.dim,
    lineHeight: Typography.size.sm * 1.45,
  },
});
