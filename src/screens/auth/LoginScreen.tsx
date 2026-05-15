// ============================================================
//  GTC ACADEMY — LoginScreen.tsx
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius } from '../../theme';
import { AuthService, isSupabaseConfigured } from '../../services/supabase';
import { AdminNotificationService, LegalService } from '../../services/production';
import { useUserStore }         from '../../hooks/useStore';
import { demoProfile }          from '../../services/mockData';
import { Divider }              from '../../components/SharedComponents';

// ── FIELD COMPONENT ───────────────────────────────────────────────────────────
interface FieldProps {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  secure?:      boolean;
  type?:        'email-address' | 'default';
  error?:       string;
  autoFocus?:   boolean;
  onSubmit?:    () => void;
  returnKey?:   'next' | 'done';
  inputRef?:    React.RefObject<TextInput>;
}

const Field = ({ label, value, onChange, placeholder, secure, type, error, autoFocus, onSubmit, returnKey, inputRef }: FieldProps) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <View style={[fStyles.inputWrap, focused && fStyles.inputFocused, !!error && fStyles.inputError]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.muted}
          secureTextEntry={secure && !show}
          keyboardType={type ?? 'default'}
          autoCapitalize={type === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          returnKeyType={returnKey ?? 'done'}
          style={fStyles.input}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow(s => !s)} style={fStyles.eyeBtn}>
            <Text style={fStyles.eye}>{show ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={fStyles.error}>{error}</Text> : null}
    </View>
  );
};

const fStyles = StyleSheet.create({
  wrap:       { marginBottom: Spacing[4] },
  label:      { fontSize: Typography.size.xs, fontFamily: Typography.family.semiBold, color: Colors.dim, marginBottom: Spacing[1.5], letterSpacing: Typography.letterSpacing.wide, textTransform: 'uppercase' },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing[4] },
  inputFocused: { borderColor: Colors.borderCyan, backgroundColor: Colors.cyanBg },
  inputError: { borderColor: Colors.borderRed },
  input:      { flex: 1, paddingVertical: Spacing[3], color: Colors.white, fontSize: Typography.size.base, fontFamily: Typography.family.regular },
  eyeBtn:     { paddingLeft: Spacing[2] },
  eye:        { fontSize: 16 },
  error:      { fontSize: Typography.size.xs, fontFamily: Typography.family.medium, color: Colors.red, marginTop: Spacing[1] },
});

// ── GOOGLE BUTTON ─────────────────────────────────────────────────────────────
const GoogleBtn = ({ onPress, loading }: { onPress: () => void; loading: boolean }) => (
  <TouchableOpacity style={gStyles.btn} onPress={onPress} activeOpacity={0.8} disabled={loading}>
    {loading
      ? <ActivityIndicator color={Colors.white} size="small" />
      : <Text style={gStyles.icon}>G</Text>
    }
    <Text style={gStyles.text}>{loading ? 'Connecting…' : 'Continue with Google'}</Text>
  </TouchableOpacity>
);

const gStyles = StyleSheet.create({
  btn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.md, paddingVertical: Spacing[3] + 2 },
  icon: { fontSize: 18, fontWeight: '900', color: Colors.white },
  text: { fontSize: Typography.size.base, fontFamily: Typography.family.bold, color: Colors.white },
});

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const nav    = useNavigation<any>();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { setUser, setProfile, setHydrated } = useUserStore();

  const passRef = useRef<TextInput>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())         e.email    = 'Email is required';
    else if (!email.includes('@')) e.email = 'Enter a valid email';
    if (!password)             e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be 6+ characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    const { error } = await AuthService.signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Sign In Failed', text2: error });
    } else {
      await AdminNotificationService.notifyAdmin('new_login', `User logged in: ${email.trim().toLowerCase()}`);
      if (!isSupabaseConfigured) {
        setUser({ id: demoProfile.id, email: email.trim().toLowerCase() });
        setProfile(demoProfile);
        setHydrated(true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation handled by onAuthChange listener in App.tsx
    }
  };

  const handleGoogle = async () => {
    setGLoading(true);
    const { error } = await AuthService.signInWithGoogle();
    setGLoading(false);
    if (error) Toast.show({ type: 'error', text1: 'Google Sign-In Failed', text2: error });
    if (!error && !isSupabaseConfigured) {
      setUser({ id: demoProfile.id, email: 'demo@gtcacademy.local' });
      setProfile(demoProfile);
      setHydrated(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient colors={Colors.gradBlue} style={styles.logo}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </LinearGradient>
          <Text style={styles.appName}>GTC Academy</Text>
          <Text style={styles.tagline}>Welcome back — sign in to continue</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <GoogleBtn onPress={handleGoogle} loading={gLoading} />
          <Divider label="or" />

          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            type="email-address"
            error={errors.email}
            autoFocus
            onSubmit={() => passRef.current?.focus()}
            returnKey="next"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Your password"
            secure
            error={errors.password}
            onSubmit={handleLogin}
            returnKey="done"
            inputRef={passRef}
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={() => nav.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradBlue} style={styles.submitGrad}>
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitText}>Sign In →</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>New to GTC Academy? </Text>
            <TouchableOpacity onPress={() => nav.navigate('Register')}>
              <Text style={styles.switchLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing[6], paddingBottom: Spacing[8] },

  logoWrap: { alignItems: 'center', paddingTop: Spacing[10], paddingBottom: Spacing[8] },
  logo:     { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
  logoEmoji: { fontSize: 30 },
  appName:  { fontSize: Typography.size['2xl'], fontFamily: Typography.family.black, color: Colors.white, letterSpacing: Typography.letterSpacing.tight, marginBottom: Spacing[1] },
  tagline:  { fontSize: Typography.size.sm, fontFamily: Typography.family.regular, color: Colors.muted },

  form:       { flex: 1 },
  forgotBtn:  { alignSelf: 'flex-end', marginTop: -Spacing[3], marginBottom: Spacing[5] },
  forgotText: { fontSize: Typography.size.sm, fontFamily: Typography.family.semiBold, color: Colors.cyan },

  submitBtn:  { borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing[6] },
  submitGrad: { paddingVertical: Spacing[4], alignItems: 'center', justifyContent: 'center' },
  submitText: { fontSize: Typography.size.base, fontFamily: Typography.family.black, color: Colors.white, letterSpacing: Typography.letterSpacing.wide },

  switchRow:   { flexDirection: 'row', justifyContent: 'center' },
  switchLabel: { fontSize: Typography.size.sm, fontFamily: Typography.family.regular, color: Colors.muted },
  switchLink:  { fontSize: Typography.size.sm, fontFamily: Typography.family.bold, color: Colors.cyan },
});


// ============================================================
//  REGISTER SCREEN (separate file in real project)
// ============================================================
export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const nav    = useNavigation<any>();

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [gLoad,   setGLoad]   = useState(false);
  const [agree,   setAgree]   = useState(false);

  const emailRef   = useRef<TextInput>(null);
  const passRef    = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())        e.name    = 'Full name is required';
    if (!email.includes('@')) e.email  = 'Enter a valid email';
    if (pass.length < 6)     e.pass   = 'Password must be 6+ characters';
    if (pass !== confirm)    e.confirm = 'Passwords do not match';
    if (!agree)              e.agree  = 'Please accept the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    const { data, error } = await AuthService.signUp(email.trim().toLowerCase(), pass, name.trim());
    if (!error && data?.user?.id) {
      await Promise.all([
        LegalService.recordConsent(data.user.id, 'terms'),
        LegalService.recordConsent(data.user.id, 'privacy'),
        LegalService.recordConsent(data.user.id, 'refund'),
        LegalService.recordConsent(data.user.id, 'certificate_disclaimer'),
      ]);
    }
    setLoading(false);
    if (error) {
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: error });
    } else {
      await AdminNotificationService.notifyAdmin('new_registration', `New user registered: ${email.trim().toLowerCase()}`, { fullName: name.trim() });
      Toast.show({ type: 'success', text1: 'Account Created! 🎉', text2: 'Check your email to verify your account.' });
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <LinearGradient colors={Colors.gradBlue} style={styles.logo}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </LinearGradient>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>Join 4,000+ learners on GTC Academy</Text>
        </View>

        <View style={styles.form}>
          <GoogleBtn onPress={async () => { setGLoad(true); await AuthService.signInWithGoogle(); setGLoad(false); }} loading={gLoad} />
          <Divider label="or" />

          <Field label="Full Name"        value={name}    onChange={setName}    placeholder="Grace Kofi"        error={errors.name}    autoFocus onSubmit={() => emailRef.current?.focus()} returnKey="next" />
          <Field label="Email"            value={email}   onChange={setEmail}   placeholder="you@email.com"     error={errors.email}   type="email-address" onSubmit={() => passRef.current?.focus()} returnKey="next" inputRef={emailRef} />
          <Field label="Password"         value={pass}    onChange={setPass}    placeholder="Min 6 characters"  error={errors.pass}    secure onSubmit={() => confirmRef.current?.focus()} returnKey="next" inputRef={passRef} />
          <Field label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Repeat password"   error={errors.confirm} secure onSubmit={handleRegister} returnKey="done" inputRef={confirmRef} />

          {/* Terms */}
          <TouchableOpacity style={rStyles.termsRow} onPress={() => setAgree(a => !a)} activeOpacity={0.8}>
            <View style={[rStyles.checkbox, agree && rStyles.checkboxOn]}>
              {agree && <Text style={rStyles.checkmark}>✓</Text>}
            </View>
            <Text style={rStyles.termsText}>
              I agree to the{' '}
              <Text style={rStyles.termsLink} onPress={() => nav.navigate('Legal', { document: 'terms' })}>Terms of Service</Text>
              {', '}
              <Text style={rStyles.termsLink} onPress={() => nav.navigate('Legal', { document: 'privacy' })}>Privacy Policy</Text>
              {', '}
              <Text style={rStyles.termsLink} onPress={() => nav.navigate('Legal', { document: 'refund' })}>Refund Policy</Text>
              {' and '}
              <Text style={rStyles.termsLink} onPress={() => nav.navigate('Legal', { document: 'certificate_disclaimer' })}>Certificate Disclaimer</Text>
            </Text>
          </TouchableOpacity>
          {errors.agree && <Text style={fStyles.error}>{errors.agree}</Text>}

          <TouchableOpacity style={[styles.submitBtn, { marginTop: Spacing[4] }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradBlue} style={styles.submitGrad}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Create Account →</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Text style={styles.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const rStyles = StyleSheet.create({
  termsRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginBottom: Spacing[1] },
  checkbox:    { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  checkboxOn:  { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  checkmark:   { fontSize: 12, fontWeight: '900', color: '#000' },
  termsText:   { flex: 1, fontSize: Typography.size.sm, fontFamily: Typography.family.regular, color: Colors.dim, lineHeight: Typography.size.sm * 1.5 },
  termsLink:   { color: Colors.cyan, fontFamily: Typography.family.semiBold },
});
