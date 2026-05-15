// ============================================================
//  GTC ACADEMY — Global TypeScript Types
// ============================================================

// ── ENUMS ─────────────────────────────────────────────────────────────────────
export type PlanType      = 'free' | 'premium_monthly' | 'premium_annual';
export type CourseLevel   = 'beginner' | 'intermediate' | 'advanced';
export type LessonType    = 'video' | 'article' | 'pdf' | 'quiz';
export type CertStatus    = 'issued' | 'revoked' | 'expired';
export type SubStatus     = 'active' | 'canceled' | 'past_due' | 'trialing';
export type NotifType     = 'course' | 'reminder' | 'certificate' | 'marketing' | 'system';
export type UserRole      = 'super_admin' | 'admin' | 'instructor' | 'student';
export type LanguageCode  = 'fr' | 'en';
export type ThemePreference = 'system' | 'light' | 'dark';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled';
export type CourseLifecycleStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'published' | 'archived';
export type ExamAttemptStatus = 'started' | 'completed' | 'cancelled' | 'failed' | 'passed';
export type CertificateVerificationStatus = 'valid' | 'expired' | 'revoked';
export type TicketStatus = 'open' | 'pending' | 'solved' | 'closed';
export type NotificationChannel = 'email' | 'push' | 'in_app';
export type DeliveryMode = 'online' | 'in_person';
export type CourseSort = 'popularity' | 'rating' | 'newest';

// ── USER ──────────────────────────────────────────────────────────────────────
export interface Profile {
  id:             string;
  full_name:      string;
  avatar_url:     string | null;
  bio:            string | null;
  plan:           PlanType;
  role?:          UserRole;
  preferred_language?: LanguageCode;
  theme_preference?: ThemePreference;
  physical_address?: string | null;
  phone_number?:  string | null;
  age?:           number | null;
  xp_points?:     number;
  learning_streak?: number;
  badges?:        string[];
  achievements?:  string[];
  consented_at?:  string | null;
  marketing_consent?: boolean;
  low_data_mode?: boolean;
  deleted_at?:    string | null;
  streak_days:    number;
  last_active_at: string | null;
  country:        string | null;
  created_at:     string;
  updated_at:     string;
}

export interface AuthUser {
  id:    string;
  email: string | undefined;
}

// ── CATEGORY ──────────────────────────────────────────────────────────────────
export interface Category {
  id:         string;
  name:       string;
  slug:       string;
  icon:       string | null;
  color:      string | null;
  sort_order: number;
}

// ── COURSE ────────────────────────────────────────────────────────────────────
export interface Course {
  id:             string;
  category_id:    string | null;
  title:          string;
  slug:           string;
  description:    string | null;
  thumbnail_url:  string | null;
  preview_video:  string | null;
  level:          CourseLevel;
  is_premium:     boolean;
  is_published:   boolean;
  enrolled_count: number;
  rating:         number;
  rating_count:   number;
  price?:          number;
  currency?:       string;
  duration_minutes?: number;
  prerequisites?: string[];
  learning_objectives?: string[];
  skills_acquired?: string[];
  delivery_modes?: DeliveryMode[];
  certificate_available?: boolean;
  final_exam_available?: boolean;
  lifecycle_status?: CourseLifecycleStatus;
  trainer_id?:     string | null;
  popularity_score?: number;
  review_count?:   number;
  downloadable_resources?: CourseResource[];
  lessons_count?: number;
  sort_order?:     number;
  created_at:     string;
  // joined
  category?:      Category;
  progress?:      number;         // 0-100 — for the current user
  is_enrolled?:   boolean;
}

export interface CourseResource {
  id?: string;
  title: string;
  type: 'pdf' | 'template' | 'dataset' | 'exercise' | 'link';
  storage_path?: string;
  public_url?: string;
  is_premium?: boolean;
  watermark_required?: boolean;
}

export interface TrainerProfile {
  id: string;
  user_id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  expertise: string | null;
  experience_years: number;
  skills: string[];
  rating: number;
  courses_created: number;
  earnings_placeholder: number;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at: string;
}

// ── LESSON ────────────────────────────────────────────────────────────────────
export interface Lesson {
  id:            string;
  course_id:     string;
  title:         string;
  description:   string | null;
  type:          LessonType;
  video_url:     string | null;
  pdf_url:       string | null;
  content:       string | null;
  duration_secs: number | null;
  order_index:   number;
  is_free:       boolean;
  is_published:  boolean;
  // joined
  completed?:    boolean;
  watch_secs?:   number;
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
export interface Quiz {
  id:          string;
  course_id:   string;
  title:       string;
  description: string | null;
  pass_score:  number;
  is_premium:  boolean;
  time_limit_seconds?: number;
  attempt_limit?: number;
  passing_score?: number;
  randomize_questions?: boolean;
  randomize_answers?: boolean;
  requires_completion_percentage?: number;
  difficulty?: string;
}

export interface QuizQuestion {
  id:            string;
  quiz_id:       string;
  question:      string;
  options:       string[];
  correct_index: number;
  explanation:   string | null;
  order_index:   number;
}

export interface QuizAttempt {
  id:        string;
  user_id:   string;
  quiz_id:   string;
  course_id: string;
  score:     number;
  answers:   QuizAnswer[];
  passed:    boolean;
  status?:   ExamAttemptStatus;
  started_at?: string;
  submitted_at?: string | null;
  cancelled_at?: string | null;
  cancelled_reason?: string | null;
  remaining_seconds?: number | null;
  taken_at:  string;
}

export interface QuizAnswer {
  question_id: string;
  selected:    number;
  correct:     boolean;
}

// ── CERTIFICATE ───────────────────────────────────────────────────────────────
export interface Certificate {
  id:        string;
  user_id:   string;
  course_id: string;
  cert_id:   string;
  certificate_id?: string;
  pdf_url:   string | null;
  qr_url:    string | null;
  verification_url?: string | null;
  qr_code_url?: string | null;
  learner_photo_url?: string | null;
  score_obtained?: number | null;
  verification_status?: CertificateVerificationStatus;
  public_token?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  certificate_wording?: string;
  status:    CertStatus;
  issued_at: string;
  // joined
  course?:   Course;
  profile?:  Profile;
}

// ── PODCAST ───────────────────────────────────────────────────────────────────
export interface Podcast {
  id:             string;
  title:          string;
  host:           string;
  description:    string | null;
  audio_url:      string | null;
  thumbnail_url:  string | null;
  duration_secs:  number | null;
  episode_number: number | null;
  is_premium:     boolean;
  is_published:   boolean;
  published_at:   string | null;
}

// ── TEMPLATE ──────────────────────────────────────────────────────────────────
export interface Template {
  id:          string;
  title:       string;
  description: string | null;
  type:        string;
  file_url:    string | null;
  thumbnail:   string | null;
  file_size:   string | null;
  is_premium:  boolean;
  downloads:   number;
  category_id: string | null;
  category?:   Category;
}

// ── SUBSCRIPTION ──────────────────────────────────────────────────────────────
export interface Subscription {
  id:                   string;
  user_id:              string;
  plan:                 PlanType;
  stripe_customer_id:   string | null;
  stripe_sub_id:        string | null;
  status:               SubStatus;
  trial_ends_at:        string | null;
  current_period_start: string | null;
  current_period_end:   string | null;
  cancel_at_period_end: boolean;
}

// ── NOTIFICATION ──────────────────────────────────────────────────────────────
export interface Notification {
  id:        string;
  user_id:   string | null;
  type:      NotifType;
  title:     string;
  body:      string;
  image_url: string | null;
  deep_link: string | null;
  read:      boolean;
  sent_at:   string;
}

// ── AI CHAT ───────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

export interface AISession {
  id:         string;
  user_id:    string;
  title:      string | null;
  messages:   ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding:     undefined;
  Auth:           undefined;
  Main:           undefined;
};

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Legal: { document?: LegalDocument['slug'] } | undefined;
};

export type MainTabParamList = {
  Home:     undefined;
  Courses:  undefined;
  AI:       undefined;
  Podcasts: undefined;
  Profile:  undefined;
};

export type CourseStackParamList = {
  CourseList:   undefined;
  CourseDetail: { course: Course };
  Lesson:       { lesson: Lesson; course: Course };
  Quiz:         { quiz: Quiz; course: Course };
  Certificate:  { certificate: Certificate };
};

export type ProfileStackParamList = {
  ProfileMain:  undefined;
  Premium:      undefined;
  Templates:    undefined;
  Admin:        undefined;
  Certificate:  { certificate?: Certificate } | undefined;
  Settings:     undefined;
  Support:      undefined;
  Legal:        { document?: LegalDocument['slug'] } | undefined;
  Notifications: undefined;
};

// ── API RESPONSES ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data:  T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data:  T[];
  count: number;
  page:  number;
  limit: number;
}

// ── STORE ─────────────────────────────────────────────────────────────────────
export interface UserStore {
  user:        AuthUser | null;
  profile:     Profile | null;
  isLoading:   boolean;
  setUser:     (user: AuthUser | null) => void;
  setProfile:  (profile: Profile | null) => void;
  setLoading:  (loading: boolean) => void;
  clear:       () => void;
}

export interface CourseStore {
  courses:        Course[];
  enrolledCourses: Course[];
  setCourses:     (courses: Course[]) => void;
  setEnrolled:    (courses: Course[]) => void;
}

// ── MISC ──────────────────────────────────────────────────────────────────────
export interface CertVerifyResult {
  valid:        boolean;
  holder_name:  string;
  course_name:  string;
  issued_at:    string;
}

export interface PricingPlan {
  id:       PlanType;
  name:     string;
  price:    number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  course_id: string | null;
  provider: 'stripe' | 'mobile_money' | 'mpesa' | 'orange_money' | 'airtel_money' | 'paypal' | 'manual';
  provider_reference: string | null;
  currency: string;
  amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  training_option: DeliveryMode;
  coupon_id: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  purchase_id: string;
  invoice_number: string;
  user_id: string;
  issued_at: string;
  currency: string;
  subtotal: number;
  discount_total: number;
  total: number;
  receipt_url: string | null;
}

export interface LegalDocument {
  id?: string;
  slug: 'terms' | 'privacy' | 'refund' | 'certificate_disclaimer';
  title: string;
  language: LanguageCode;
  version: string;
  body: string;
  active?: boolean;
  published_at?: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminKpis {
  total_users: number;
  active_students: number;
  paid_students: number;
  revenue: number;
  valid_certificates: number;
  passed_exams: number;
  submitted_exams: number;
}

export interface SyncQueueItem {
  id: string;
  operation: 'insert' | 'update' | 'delete' | 'event';
  entityType: string;
  entityId?: string;
  payload: Record<string, unknown>;
  retryCount: number;
  createdAt: string;
}
