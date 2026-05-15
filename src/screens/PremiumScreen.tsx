import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { PrimaryButton, ScreenScaffold } from './ScreenScaffold';
import { Colors, Radius, Spacing, Typography } from '../theme';

const plans = [
  { name: 'Monthly', price: '$12.99', accent: Colors.cyan, items: ['All premium courses', 'Unlimited AI assistant', 'Premium templates'] },
  { name: 'Annual', price: '$95.88', accent: Colors.amber, items: ['Best value', 'Certificates', 'Priority resources'] },
];

export default function PremiumScreen() {
  return (
    <ScreenScaffold title="Premium" subtitle="Unlock the full GTC Academy learning toolkit.">
      {plans.map(plan => (
        <View key={plan.name} style={[styles.plan, { borderColor: plan.accent + '55' }]}>
          <Text style={[styles.planName, { color: plan.accent }]}>{plan.name}</Text>
          <Text style={styles.price}>{plan.price}</Text>
          {plan.items.map(item => <Text key={item} style={styles.item}>- {item}</Text>)}
          <PrimaryButton label={`Choose ${plan.name}`} onPress={() => Toast.show({ type: 'info', text1: 'Stripe checkout goes here' })} />
        </View>
      ))}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  plan: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    padding: Spacing[5],
    marginBottom: Spacing[4],
  },
  planName: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.black,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  price: {
    marginTop: Spacing[2],
    marginBottom: Spacing[4],
    fontSize: Typography.size['3xl'],
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
  item: {
    color: Colors.dim,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.medium,
    marginBottom: Spacing[2],
  },
});
