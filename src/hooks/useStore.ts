// ============================================================
//  GTC ACADEMY — Global State Stores (Zustand)
// ============================================================
import { create } from 'zustand';
import { Profile, AuthUser, Course, Notification, ChatMessage, LanguageCode, ThemePreference } from '../types';

// ── USER / AUTH STORE ─────────────────────────────────────────────────────────
interface UserState {
  user:        AuthUser | null;
  profile:     Profile | null;
  isLoading:   boolean;
  isHydrated:  boolean;

  setUser:     (user: AuthUser | null) => void;
  setProfile:  (profile: Profile | null) => void;
  setLoading:  (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  clear:       () => void;

  // Computed
  isPremium:   () => boolean;
  isAdmin:     () => boolean;
  isSuperAdmin: () => boolean;
  isInstructor: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user:       null,
  profile:    null,
  isLoading:  true,
  isHydrated: false,

  setUser:     (user)     => set({ user }),
  setProfile:  (profile)  => set({ profile }),
  setLoading:  (isLoading)  => set({ isLoading }),
  setHydrated: (isHydrated) => set({ isHydrated }),

  clear: () => set({ user: null, profile: null }),

  isPremium: () => {
    const { profile } = get();
    return profile?.plan === 'premium_monthly' || profile?.plan === 'premium_annual';
  },

  isAdmin: () => {
    const { user, profile } = get();
    if (profile?.role === 'super_admin' || profile?.role === 'admin') return true;
    const adminEmails = process.env.EXPO_PUBLIC_ADMIN_EMAILS?.split(',') ?? [];
    return user?.email ? adminEmails.includes(user.email) : false;
  },

  isSuperAdmin: () => get().profile?.role === 'super_admin',

  isInstructor: () => get().profile?.role === 'instructor',
}));

// â”€â”€ PREFERENCES STORE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface PreferencesState {
  language: LanguageCode;
  theme: ThemePreference;
  lowDataMode: boolean;
  offlineMode: boolean;
  setLanguage: (language: LanguageCode) => void;
  setTheme: (theme: ThemePreference) => void;
  setLowDataMode: (enabled: boolean) => void;
  setOfflineMode: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  language: 'fr',
  theme: 'system',
  lowDataMode: false,
  offlineMode: false,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setLowDataMode: (lowDataMode) => set({ lowDataMode }),
  setOfflineMode: (offlineMode) => set({ offlineMode }),
}));

// ── COURSE STORE ──────────────────────────────────────────────────────────────
interface CourseState {
  allCourses:      Course[];
  enrolledCourses: Course[];
  activeCategory:  string;
  searchQuery:     string;

  setAll:           (courses: Course[]) => void;
  setEnrolled:      (courses: Course[]) => void;
  setCategory:      (cat: string) => void;
  setSearchQuery:   (q: string) => void;
  updateProgress:   (courseId: string, progress: number) => void;

  // Computed
  getFiltered: () => Course[];
  getInProgress: () => Course[];
}

export const useCourseStore = create<CourseState>((set, get) => ({
  allCourses:      [],
  enrolledCourses: [],
  activeCategory:  'All',
  searchQuery:     '',

  setAll:         (allCourses)      => set({ allCourses }),
  setEnrolled:    (enrolledCourses) => set({ enrolledCourses }),
  setCategory:    (activeCategory)  => set({ activeCategory }),
  setSearchQuery: (searchQuery)     => set({ searchQuery }),

  updateProgress: (courseId, progress) =>
    set(state => ({
      allCourses: state.allCourses.map(c =>
        c.id === courseId ? { ...c, progress } : c
      ),
      enrolledCourses: state.enrolledCourses.map(c =>
        c.id === courseId ? { ...c, progress } : c
      ),
    })),

  getFiltered: () => {
    const { allCourses, activeCategory, searchQuery } = get();
    return allCourses.filter(c => {
      const matchesCat = activeCategory === 'All' || c.category?.name === activeCategory;
      const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  },

  getInProgress: () => {
    const { enrolledCourses } = get();
    return enrolledCourses.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
  },
}));

// ── NOTIFICATION STORE ────────────────────────────────────────────────────────
interface NotifState {
  notifications: Notification[];
  unreadCount:   number;

  setNotifications: (notifs: Notification[]) => void;
  setUnreadCount:   (count: number) => void;
  markRead:         (id: string) => void;
  markAllRead:      () => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  notifications: [],
  unreadCount:   0,

  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount:   (unreadCount)   => set({ unreadCount }),

  markRead: (id) =>
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    })),
}));

// ── AI CHAT STORE ─────────────────────────────────────────────────────────────
interface AIState {
  messages:     ChatMessage[];
  sessionId:    string | null;
  isStreaming:  boolean;

  setMessages:    (msgs: ChatMessage[]) => void;
  appendMessage:  (msg: ChatMessage) => void;
  updateLast:     (content: string) => void;   // for streaming
  setSessionId:   (id: string | null) => void;
  setStreaming:   (streaming: boolean) => void;
  clearSession:   () => void;
}

export const useAIStore = create<AIState>((set) => ({
  messages:    [],
  sessionId:   null,
  isStreaming: false,

  setMessages:   (messages)   => set({ messages }),
  setSessionId:  (sessionId)  => set({ sessionId }),
  setStreaming:  (isStreaming) => set({ isStreaming }),

  appendMessage: (msg) =>
    set(state => ({ messages: [...state.messages, msg] })),

  updateLast: (content) =>
    set(state => {
      const msgs = [...state.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      }
      return { messages: msgs };
    }),

  clearSession: () =>
    set({ messages: [], sessionId: null, isStreaming: false }),
}));

// ── PLAYER STORE (Podcast) ────────────────────────────────────────────────────
import type { Podcast } from '../types';

interface PlayerState {
  currentPodcast: Podcast | null;
  isPlaying:      boolean;
  position:       number;   // seconds
  duration:       number;   // seconds

  setCurrentPodcast: (podcast: Podcast | null) => void;
  setPlaying:        (playing: boolean) => void;
  setPosition:       (pos: number) => void;
  setDuration:       (dur: number) => void;
  stop:              () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentPodcast: null,
  isPlaying:      false,
  position:       0,
  duration:       0,

  setCurrentPodcast: (currentPodcast) => set({ currentPodcast }),
  setPlaying:        (isPlaying)      => set({ isPlaying }),
  setPosition:       (position)       => set({ position }),
  setDuration:       (duration)       => set({ duration }),

  stop: () => set({ currentPodcast: null, isPlaying: false, position: 0 }),
}));
