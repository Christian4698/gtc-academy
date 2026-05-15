// ============================================================
//  GTC ACADEMY — App.tsx (Navigation Root)
// ============================================================
import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';

import { AuthService, ProfileService, NotificationService, isSupabaseConfigured } from './src/services/supabase';
import { OfflineCacheService } from './src/services/offline';
import { useUserStore, useNotifStore, usePreferencesStore } from './src/hooks/useStore';
import { Colors } from './src/theme';
import { RootStackParamList } from './src/types';

// ── SCREENS ───────────────────────────────────────────────────────────────────
import OnboardingScreen   from './src/screens/OnboardingScreen';
import LoginScreen        from './src/screens/auth/LoginScreen';
import RegisterScreen     from './src/screens/auth/RegisterScreen';
import ForgotPassword     from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen         from './src/screens/HomeScreen';
import CoursesScreen      from './src/screens/CoursesScreen';
import CourseDetailScreen from './src/screens/courses/CourseDetailScreen';
import LessonScreen       from './src/screens/courses/LessonScreen';
import QuizScreen         from './src/screens/courses/QuizScreen';
import AIScreen           from './src/screens/AIScreen';
import PodcastScreen      from './src/screens/PodcastScreen';
import ProfileScreen      from './src/screens/ProfileScreen';
import PremiumScreen      from './src/screens/PremiumScreen';
import TemplatesScreen    from './src/screens/TemplatesScreen';
import CertificateScreen  from './src/screens/CertificateScreen';
import AdminScreen        from './src/screens/AdminScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen     from './src/screens/SettingsScreen';
import SupportScreen      from './src/screens/SupportScreen';
import LegalScreen        from './src/screens/LegalScreen';

// ── TAB ICONS ─────────────────────────────────────────────────────────────────
import HomeIcon    from './src/components/icons/HomeIcon';
import CoursesIcon from './src/components/icons/CoursesIcon';
import AIIcon      from './src/components/icons/AIIcon';
import PodcastIcon from './src/components/icons/PodcastIcon';
import ProfileIcon from './src/components/icons/ProfileIcon';

// ── SETUP ─────────────────────────────────────────────────────────────────────
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        1000 * 60 * 5,  // 5 minutes
      retry:            2,
      refetchOnWindowFocus: false,
    },
  },
});

// ── NAVIGATORS ────────────────────────────────────────────────────────────────
const RootStack  = createNativeStackNavigator<RootStackParamList>();
const AuthStack  = createNativeStackNavigator();
const MainTab    = createBottomTabNavigator();
const CourseStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"          component={LoginScreen} />
      <AuthStack.Screen name="Register"       component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="Legal"          component={LegalScreen} />
    </AuthStack.Navigator>
  );
}

function CoursesNavigator() {
  return (
    <CourseStack.Navigator screenOptions={{ headerShown: false }}>
      <CourseStack.Screen name="CourseList"   component={CoursesScreen} />
      <CourseStack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <CourseStack.Screen name="Lesson"       component={LessonScreen} />
      <CourseStack.Screen name="Quiz"         component={QuizScreen} />
    </CourseStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain"   component={ProfileScreen} />
      <ProfileStack.Screen name="Premium"       component={PremiumScreen} />
      <ProfileStack.Screen name="Templates"     component={TemplatesScreen} />
      <ProfileStack.Screen name="Certificate"   component={CertificateScreen} />
      <ProfileStack.Screen name="Admin"         component={AdminScreen} />
      <ProfileStack.Screen name="Settings"      component={SettingsScreen} />
      <ProfileStack.Screen name="Support"       component={SupportScreen} />
      <ProfileStack.Screen name="Legal"         component={LegalScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  const unread = useNotifStore(s => s.unreadCount);

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   Colors.cyan,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle:        styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const size = 22;
          switch (route.name) {
            case 'Home':     return <HomeIcon    color={color} size={size} focused={focused} />;
            case 'Courses':  return <CoursesIcon color={color} size={size} focused={focused} />;
            case 'AI':       return <AIIcon      color={color} size={size} focused={focused} />;
            case 'Podcasts': return <PodcastIcon color={color} size={size} focused={focused} />;
            case 'Profile':  return <ProfileIcon color={color} size={size} focused={focused} />;
            default: return null;
          }
        },
        tabBarBadge: route.name === 'Profile' && unread > 0 ? unread : undefined,
      })}
    >
      <MainTab.Screen name="Home"     component={HomeScreen} />
      <MainTab.Screen name="Courses"  component={CoursesNavigator} />
      <MainTab.Screen name="AI"       component={AIScreen} />
      <MainTab.Screen name="Podcasts" component={PodcastScreen} />
      <MainTab.Screen name="Profile"  component={ProfileNavigator} />
    </MainTab.Navigator>
  );
}

// ── ROOT NAVIGATOR ────────────────────────────────────────────────────────────
function RootNavigator() {
  const { user, isHydrated } = useUserStore();

  if (!isHydrated) return null;  // splash still showing

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        <>
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          <RootStack.Screen name="Auth"        component={AuthNavigator} />
        </>
      ) : (
        <RootStack.Screen name="Main" component={MainTabs} />
      )}
    </RootStack.Navigator>
  );
}

// ── APP BOOTSTRAP ─────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  const { setUser, setProfile, setLoading, setHydrated } = useUserStore();
  const { setUnreadCount } = useNotifStore();
  const { setLanguage, setTheme, setLowDataMode } = usePreferencesStore();

  // Hydrate auth state on mount
  useEffect(() => {
    const init = async () => {
      try {
        const session = await AuthService.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          const { data: profile } = await ProfileService.getProfile(session.user.id);
          if (profile) {
            setProfile(profile);
            setLanguage(profile.preferred_language ?? 'fr');
            setTheme(profile.theme_preference ?? 'system');
            setLowDataMode(Boolean(profile.low_data_mode));
            await OfflineCacheService.cacheProfile(profile);
          } else {
            const cachedProfile = await OfflineCacheService.getCachedProfile();
            if (cachedProfile?.preferred_language) setLanguage(cachedProfile.preferred_language);
            if (cachedProfile?.theme_preference) setTheme(cachedProfile.theme_preference);
            setLowDataMode(Boolean(cachedProfile?.low_data_mode));
          }
          const count = await NotificationService.getUnreadCount(session.user.id);
          setUnreadCount(count);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    };
    init();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        const { data: profile } = await ProfileService.getProfile(session.user.id);
        if (profile) {
          setProfile(profile);
          setLanguage(profile.preferred_language ?? 'fr');
          setTheme(profile.theme_preference ?? 'system');
          setLowDataMode(Boolean(profile.low_data_mode));
          await OfflineCacheService.cacheProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register for push notifications
  useEffect(() => {
    const registerPush = async () => {
      try {
        if (!isSupabaseConfigured || !process.env.EXPO_PUBLIC_EAS_PROJECT_ID) return;
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        const { data: token } = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        });
        const { user } = useUserStore.getState();
        if (token && user) {
          const platform = require('react-native').Platform.OS as 'ios' | 'android';
          await NotificationService.registerPushToken(user.id, token, platform);
        }
      } catch (e) {
        console.warn('Push registration skipped:', e);
      }
    };
    registerPush();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={Colors.bg} />
            <View style={styles.root} onLayout={onLayoutRootView}>
              <RootNavigator />
            </View>
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  tabBar: {
    backgroundColor:  Colors.bg,
    borderTopColor:   Colors.border,
    borderTopWidth:   1,
    height:           62,
    paddingTop:       6,
    paddingBottom:    10,
  },
  tabLabel: {
    fontSize:     10,
    fontWeight:   '700',
    marginTop:    2,
    letterSpacing: 0.3,
  },
});
