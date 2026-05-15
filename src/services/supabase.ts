// ============================================================
//  GTC ACADEMY — Supabase Client & Data Services
// ============================================================
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import {
  Profile, Course, Lesson, Quiz, QuizQuestion, QuizAttempt,
  Certificate, Podcast, Template, Subscription, Notification,
  AISession, ChatMessage, CertVerifyResult, ApiResponse,
} from '../types';
import {
  demoCertificates,
  demoCourses,
  demoLessonsByCourse,
  demoNotifications,
  demoPodcasts,
  demoProfile,
  demoQuestionsByQuiz,
  demoQuizzesByCourse,
  demoStats,
  demoTemplates,
  findDemoCourse,
} from './mockData';

// ── CLIENT SETUP ──────────────────────────────────────────────────────────────
const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const configuredAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  configuredUrl &&
  configuredAnon &&
  !configuredUrl.includes('xxxxxxxx') &&
  !configuredAnon.includes('...')
);

const supabaseUrl  = isSupabaseConfigured ? configuredUrl! : 'https://demo.supabase.co';
const supabaseAnon = isSupabaseConfigured ? configuredAnon! : 'demo-anon-key';

// SecureStore adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage:           ExpoSecureStoreAdapter,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});

// ── AUTH SERVICES ──────────────────────────────────────────────────────────────
export const AuthService = {
  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      return { data: { user: { id: demoProfile.id, email } }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error: error?.message ?? null };
  },

  async signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured) {
      return { data: { user: { id: demoProfile.id, email, user_metadata: { full_name: fullName } } }, error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    return { data, error: error?.message ?? null };
  },

  async signInWithGoogle() {
    if (!isSupabaseConfigured) {
      return { data: { provider: 'google', url: null }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    return { data, error: error?.message ?? null };
  },

  async signOut() {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
  },

  async resetPassword(email: string) {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gtcacademy://reset-password',
    });
    return { error: error?.message ?? null };
  },

  async getSession() {
    if (!isSupabaseConfigured) {
      return { user: { id: demoProfile.id, email: 'demo@gtcacademy.local' } } as any;
    }
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => undefined } } } as any;
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ── PROFILE SERVICE ───────────────────────────────────────────────────────────
export const ProfileService = {
  async getProfile(userId: string): Promise<ApiResponse<Profile>> {
    if (!isSupabaseConfigured) {
      return { data: { ...demoProfile, id: userId }, error: null };
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error: error?.message ?? null };
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    if (!isSupabaseConfigured) {
      return { data: { ...demoProfile, ...updates, id: userId, updated_at: new Date().toISOString() }, error: null };
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data, error: error?.message ?? null };
  },

  async updateAvatar(userId: string, uri: string): Promise<ApiResponse<string>> {
    if (!isSupabaseConfigured) {
      return { data: uri, error: null };
    }
    const fileName  = `avatar-${userId}-${Date.now()}.jpg`;
    const response  = await fetch(uri);
    const blob      = await response.blob();
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) return { data: null, error: uploadError.message };
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await ProfileService.updateProfile(userId, { avatar_url: publicUrl });
    return { data: publicUrl, error: null };
  },
};

// ── COURSE SERVICE ────────────────────────────────────────────────────────────
export const CourseService = {
  async getAll(opts?: { categorySlug?: string; level?: string }): Promise<ApiResponse<Course[]>> {
    if (!isSupabaseConfigured) {
      const courses = demoCourses.filter(course => {
        const matchesCategory = !opts?.categorySlug || course.category?.slug === opts.categorySlug;
        const matchesLevel = !opts?.level || course.level === opts.level;
        return matchesCategory && matchesLevel;
      });
      return { data: courses, error: null };
    }
    let query = supabase
      .from('courses')
      .select('*, category:categories(id,name,slug,icon,color)')
      .eq('is_published', true)
      .order('sort_order');

    if (opts?.categorySlug) {
      query = query.eq('categories.slug', opts.categorySlug);
    }
    if (opts?.level) {
      query = query.eq('level', opts.level);
    }
    const { data, error } = await query;
    return { data, error: error?.message ?? null };
  },

  async getById(courseId: string): Promise<ApiResponse<Course>> {
    if (!isSupabaseConfigured) {
      return { data: findDemoCourse(courseId), error: findDemoCourse(courseId) ? null : 'Course not found' };
    }
    const { data, error } = await supabase
      .from('courses')
      .select('*, category:categories(*)')
      .eq('id', courseId)
      .single();
    return { data, error: error?.message ?? null };
  },

  async getUserProgress(userId: string, courseId: string): Promise<number> {
    if (!isSupabaseConfigured) {
      return findDemoCourse(courseId)?.progress ?? 0;
    }
    const { data } = await supabase.rpc('get_course_progress', {
      p_user_id: userId,
      p_course_id: courseId,
    });
    return data ?? 0;
  },

  async getEnrolled(userId: string): Promise<ApiResponse<Course[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoCourses.filter(course => course.is_enrolled), error: null };
    }
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        course:courses(
          *,
          category:categories(id,name,slug,icon,color)
        )
      `)
      .eq('user_id', userId)
      .is('completed_at', null);
    const courses = data?.map((e: any) => e.course).filter(Boolean) ?? [];
    return { data: courses, error: error?.message ?? null };
  },

  async enroll(userId: string, courseId: string): Promise<ApiResponse<boolean>> {
    if (!isSupabaseConfigured) {
      return { data: true, error: null };
    }
    const { error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId });
    if (error?.code === '23505') return { data: true, error: null }; // already enrolled
    return { data: !error, error: error?.message ?? null };
  },

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return Boolean(findDemoCourse(courseId)?.is_enrolled);
    }
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    return !!data;
  },
};

// ── LESSON SERVICE ────────────────────────────────────────────────────────────
export const LessonService = {
  async getByCourse(courseId: string): Promise<ApiResponse<Lesson[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoLessonsByCourse[courseId] ?? [], error: null };
    }
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index');
    return { data, error: error?.message ?? null };
  },

  async getUserProgress(userId: string, courseId: string) {
    if (!isSupabaseConfigured) {
      return (demoLessonsByCourse[courseId] ?? []).map(lesson => ({
        lesson_id: lesson.id,
        completed: Boolean(lesson.completed),
        watch_seconds: lesson.watch_secs ?? 0,
      }));
    }
    const { data } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, watch_seconds')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    return data ?? [];
  },

  async markCompleted(userId: string, lessonId: string, courseId: string) {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id:      userId,
        lesson_id:    lessonId,
        course_id:    courseId,
        completed:    true,
        completed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });
    return { error: error?.message ?? null };
  },

  async updateWatchTime(userId: string, lessonId: string, courseId: string, seconds: number) {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id:       userId,
        lesson_id:     lessonId,
        course_id:     courseId,
        watch_seconds: seconds,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });
    return { error: error?.message ?? null };
  },

  async checkAndIssueCertificate(userId: string, courseId: string, fullName: string, courseTitle: string) {
    const progress = await CourseService.getUserProgress(userId, courseId);
    if (progress < 100) return null;
    return CertificateService.issue(userId, courseId, fullName, courseTitle);
  },
};

// ── QUIZ SERVICE ──────────────────────────────────────────────────────────────
export const QuizService = {
  async getByCourse(courseId: string): Promise<ApiResponse<Quiz[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoQuizzesByCourse[courseId] ?? [], error: null };
    }
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId);
    return { data, error: error?.message ?? null };
  },

  async getQuestions(quizId: string): Promise<ApiResponse<QuizQuestion[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoQuestionsByQuiz[quizId] ?? [], error: null };
    }
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');
    return { data, error: error?.message ?? null };
  },

  async submitAttempt(
    userId: string,
    quizId: string,
    courseId: string,
    score: number,
    answers: { question_id: string; selected: number; correct: boolean }[],
  ): Promise<ApiResponse<QuizAttempt>> {
    if (!isSupabaseConfigured) {
      const attempt: QuizAttempt = {
        id: `demo-attempt-${Date.now()}`,
        user_id: userId,
        quiz_id: quizId,
        course_id: courseId,
        score,
        answers,
        passed: score >= 80,
        status: score >= 80 ? 'passed' : 'failed',
        submitted_at: new Date().toISOString(),
        taken_at: new Date().toISOString(),
      };
      return { data: attempt, error: null };
    }
    const quiz = await supabase
      .from('quizzes').select('pass_score').eq('id', quizId).single();
    const passScore = quiz.data?.pass_score ?? 80;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id:   userId,
        quiz_id:   quizId,
        course_id: courseId,
        score,
        answers,
        passed:    score >= passScore,
        status:    score >= passScore ? 'passed' : 'failed',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error: error?.message ?? null };
  },

  async getBestScore(userId: string, quizId: string): Promise<number> {
    if (!isSupabaseConfigured) {
      return 86;
    }
    const { data } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('score', { ascending: false })
      .limit(1)
      .single();
    return data?.score ?? 0;
  },
};

// ── CERTIFICATE SERVICE ───────────────────────────────────────────────────────
export const CertificateService = {
  async getByUser(userId: string): Promise<ApiResponse<Certificate[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoCertificates.filter(cert => cert.user_id === userId), error: null };
    }
    const { data, error } = await supabase
      .from('certificates')
      .select('*, course:courses(title,thumbnail_url)')
      .eq('user_id', userId)
      .eq('status', 'issued')
      .order('issued_at', { ascending: false });
    return { data, error: error?.message ?? null };
  },

  async issue(userId: string, courseId: string, fullName: string, courseTitle: string): Promise<ApiResponse<Certificate>> {
    if (!isSupabaseConfigured) {
      const cert: Certificate = {
        id: `demo-cert-${Date.now()}`,
        user_id: userId,
        course_id: courseId,
        cert_id: `GTC-${new Date().getFullYear()}-DEMO`,
        pdf_url: null,
        qr_url: null,
        status: 'issued',
        issued_at: new Date().toISOString(),
        course: findDemoCourse(courseId) ?? undefined,
        profile: { ...demoProfile, full_name: fullName },
      };
      return { data: cert, error: null };
    }
    // Generate unique cert ID
    const year   = new Date().getFullYear();
    const prefix = courseTitle.toLowerCase().includes('excel')  ? 'XL' :
                   courseTitle.toLowerCase().includes('data')   ? 'DA' :
                   courseTitle.toLowerCase().includes('dashboard') ? 'DB' :
                   courseTitle.toLowerCase().includes('sheets') ? 'GS' : 'TC';
    const seq    = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const certId = `GTC-${year}-${prefix}-${seq}`;

    const { data, error } = await supabase
      .from('certificates')
      .upsert({
        user_id:   userId,
        course_id: courseId,
        cert_id:   certId,
      }, { onConflict: 'user_id,course_id' })
      .select()
      .single();
    return { data, error: error?.message ?? null };
  },

  async verify(certId: string): Promise<ApiResponse<CertVerifyResult>> {
    if (!isSupabaseConfigured) {
      const cert = demoCertificates.find(item => item.cert_id === certId);
      return {
        data: cert ? {
          valid: true,
          holder_name: cert.profile?.full_name ?? demoProfile.full_name,
          course_name: cert.course?.title ?? 'GTC Academy Course',
          issued_at: cert.issued_at,
        } : null,
        error: cert ? null : 'Certificate not found',
      };
    }
    const { data, error } = await supabase.rpc('verify_certificate', { p_cert_id: certId });
    const result = data?.[0] ?? null;
    return { data: result, error: error?.message ?? null };
  },
};

// ── PODCAST SERVICE ───────────────────────────────────────────────────────────
export const PodcastService = {
  async getAll(): Promise<ApiResponse<Podcast[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoPodcasts, error: null };
    }
    const { data, error } = await supabase
      .from('podcasts')
      .select('*')
      .eq('is_published', true)
      .order('episode_number', { ascending: false });
    return { data, error: error?.message ?? null };
  },
};

// ── TEMPLATE SERVICE ──────────────────────────────────────────────────────────
export const TemplateService = {
  async getAll(): Promise<ApiResponse<Template[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoTemplates, error: null };
    }
    const { data, error } = await supabase
      .from('templates')
      .select('*, category:categories(name,slug,color)')
      .order('created_at', { ascending: false });
    return { data, error: error?.message ?? null };
  },

  async recordDownload(userId: string, templateId: string) {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.from('downloads').upsert(
      { user_id: userId, template_id: templateId },
      { onConflict: 'user_id,template_id' }
    );
    await supabase.rpc('increment_template_downloads', { p_template_id: templateId });
  },
};

// ── SUBSCRIPTION SERVICE ──────────────────────────────────────────────────────
export const SubscriptionService = {
  async getByUser(userId: string): Promise<ApiResponse<Subscription>> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: 'demo-subscription',
          user_id: userId,
          plan: demoProfile.plan,
          stripe_customer_id: null,
          stripe_sub_id: null,
          status: 'active',
          trial_ends_at: null,
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          cancel_at_period_end: false,
        },
        error: null,
      };
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error: error?.message ?? null };
  },

  async isPremium(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }
    const { data } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();
    return data?.plan !== 'free';
  },
};

// ── NOTIFICATION SERVICE ──────────────────────────────────────────────────────
export const NotificationService = {
  async getAll(userId: string): Promise<ApiResponse<Notification[]>> {
    if (!isSupabaseConfigured) {
      return { data: demoNotifications, error: null };
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('sent_at', { ascending: false })
      .limit(50);
    return { data, error: error?.message ?? null };
  },

  async markRead(notifId: string) {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.from('notifications').update({ read: true }).eq('id', notifId);
  },

  async markAllRead(userId: string) {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (!isSupabaseConfigured) {
      return demoNotifications.filter(item => !item.read).length;
    }
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('read', false);
    return count ?? 0;
  },

  async registerPushToken(userId: string, token: string, platform: 'ios' | 'android') {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform },
      { onConflict: 'token' }
    );
  },
};

// ── AI SESSION SERVICE ────────────────────────────────────────────────────────
export const AISessionService = {
  async getSessions(userId: string): Promise<ApiResponse<AISession[]>> {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20);
    return { data, error: error?.message ?? null };
  },

  async createSession(userId: string, firstMessage: string): Promise<ApiResponse<AISession>> {
    if (!isSupabaseConfigured) {
      return {
        data: {
          id: `demo-ai-session-${Date.now()}`,
          user_id: userId,
          title: firstMessage.slice(0, 60),
          messages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }
    const { data, error } = await supabase
      .from('ai_sessions')
      .insert({
        user_id:  userId,
        title:    firstMessage.slice(0, 60),
        messages: [],
      })
      .select()
      .single();
    return { data, error: error?.message ?? null };
  },

  async appendMessage(sessionId: string, messages: ChatMessage[]) {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const { error } = await supabase
      .from('ai_sessions')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return { error: error?.message ?? null };
  },
};

// ── ADMIN SERVICE (protected — RLS + server-side check) ───────────────────────
export const AdminService = {
  async getStats() {
    if (!isSupabaseConfigured) {
      return demoStats;
    }
    const [users, certs, subs] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('status', 'issued'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);
    return {
      totalUsers:    users.count ?? 0,
      certificates:  certs.count ?? 0,
      activeSubs:    subs.count ?? 0,
    };
  },

  async getRecentUsers(limit = 20) {
    if (!isSupabaseConfigured) {
      return [{ id: demoProfile.id, full_name: demoProfile.full_name, plan: demoProfile.plan, created_at: demoProfile.created_at, avatar_url: null }];
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, plan, created_at, avatar_url')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  },

  async toggleCoursePublish(courseId: string, published: boolean) {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.from('courses').update({ is_published: published }).eq('id', courseId);
  },

  async sendBroadcastNotification(title: string, body: string, type: string) {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.from('notifications').insert({ title, body, type, user_id: null });
  },
};
