import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { Colors, Radius, Spacing, Typography } from '../../theme';
import { AuthService } from '../../services/supabase';
import { ScreenScaffold } from '../ScreenScaffold';

export default function ForgotPasswordScreen() {
  const nav = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Enter a valid email address' });
      return;
    }
    setLoading(true);
    const { error } = await AuthService.resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: error });
      return;
    }
    Toast.show({ type: 'success', text1: 'Reset email sent', text2: 'Check your inbox for the next step.' });
    nav.goBack();
  };

  return (
    <ScreenScaffold
      title="Reset password"
      subtitle="Enter your email and we will send a secure password reset link."
    >
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor={Colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={Colors.gradBlue} style={styles.buttonGrad}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Send reset link</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing[4],
  },
  label: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    color: Colors.dim,
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    color: Colors.white,
    fontSize: Typography.size.base,
    fontFamily: Typography.family.regular,
    marginBottom: Spacing[4],
  },
  button: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  buttonGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.family.black,
    color: Colors.white,
  },
});
