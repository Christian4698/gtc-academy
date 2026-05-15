-- ============================================================
--  GTC ACADEMY — Complete Database Schema
--  Database: PostgreSQL (Supabase)
--  Version: 1.0.0
-- ============================================================

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ─────────────────────────────────────────────────────────────────────
CREATE TYPE plan_type      AS ENUM ('free', 'premium_monthly', 'premium_annual');
CREATE TYPE lesson_type    AS ENUM ('video', 'article', 'pdf', 'quiz');
CREATE TYPE cert_status    AS ENUM ('issued', 'revoked');
CREATE TYPE sub_status     AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE notif_type     AS ENUM ('course', 'reminder', 'certificate', 'marketing', 'system');
CREATE TYPE course_level   AS ENUM ('beginner', 'intermediate', 'advanced');

-- ============================================================
--  PROFILES  (extends auth.users)
-- ============================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  bio             TEXT,
  plan            plan_type NOT NULL DEFAULT 'free',
  streak_days     INTEGER NOT NULL DEFAULT 0,
  last_active_at  TIMESTAMPTZ,
  country         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
--  CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  color       TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('Excel',               'excel',       '📊', '#0A6EFF', 1),
  ('Google Sheets',       'sheets',      '⚡', '#00C896', 2),
  ('Data Analysis',       'data',        '📈', '#FF6B35', 3),
  ('Business Intelligence','bi',         '🎯', '#7C3AED', 4),
  ('Dashboards',          'dashboards',  '💡', '#E91E8C', 5),
  ('Tech Consulting',     'consulting',  '🤝', '#00C8FF', 6);

-- ============================================================
--  COURSES
-- ============================================================
CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  thumbnail_url   TEXT,
  preview_video   TEXT,
  level           course_level NOT NULL DEFAULT 'beginner',
  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER DEFAULT 0,
  enrolled_count  INTEGER NOT NULL DEFAULT 0,
  rating          NUMERIC(3,2) DEFAULT 0.0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_category   ON courses(category_id);
CREATE INDEX idx_courses_published  ON courses(is_published);
CREATE INDEX idx_courses_premium    ON courses(is_premium);

-- ============================================================
--  LESSONS
-- ============================================================
CREATE TABLE lessons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  type            lesson_type NOT NULL DEFAULT 'video',
  video_url       TEXT,
  pdf_url         TEXT,
  content         TEXT,            -- for article lessons
  duration_secs   INTEGER,
  order_index     INTEGER NOT NULL DEFAULT 0,
  is_free         BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course  ON lessons(course_id);
CREATE INDEX idx_lessons_order   ON lessons(course_id, order_index);

-- ============================================================
--  ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user   ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Auto-increment enrolled_count on courses
CREATE OR REPLACE FUNCTION increment_course_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_enrollment_created
  AFTER INSERT ON enrollments
  FOR EACH ROW EXECUTE PROCEDURE increment_course_enrollment();

-- ============================================================
--  LESSON PROGRESS
-- ============================================================
CREATE TABLE lesson_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  watch_seconds   INTEGER NOT NULL DEFAULT 0,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_progress_user    ON lesson_progress(user_id);
CREATE INDEX idx_progress_course  ON lesson_progress(user_id, course_id);

-- ============================================================
--  QUIZZES & QUESTIONS
-- ============================================================
CREATE TABLE quizzes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  pass_score  INTEGER NOT NULL DEFAULT 80,   -- percentage
  is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL,             -- ["option A", "option B", ...]
  correct_index   INTEGER NOT NULL,           -- 0-based index
  explanation     TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id, order_index);

CREATE TABLE quiz_attempts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id     UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL,              -- percentage 0-100
  answers     JSONB,                         -- [{question_id, selected, correct}]
  passed      BOOLEAN NOT NULL DEFAULT FALSE,
  taken_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_user  ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_quiz  ON quiz_attempts(quiz_id);

-- ============================================================
--  CERTIFICATES
-- ============================================================
CREATE TABLE certificates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  cert_id     TEXT NOT NULL UNIQUE,          -- e.g. GTC-2025-XL-001
  pdf_url     TEXT,
  qr_url      TEXT,
  status      cert_status NOT NULL DEFAULT 'issued',
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_certs_user    ON certificates(user_id);
CREATE INDEX idx_certs_cert_id ON certificates(cert_id);

-- Auto-generate cert_id
CREATE OR REPLACE FUNCTION generate_cert_id(course_title TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  seq    TEXT;
BEGIN
  prefix := CASE
    WHEN course_title ILIKE '%excel%'       THEN 'XL'
    WHEN course_title ILIKE '%data%'        THEN 'DA'
    WHEN course_title ILIKE '%dashboard%'   THEN 'DB'
    WHEN course_title ILIKE '%sheets%'      THEN 'GS'
    ELSE 'TC'
  END;
  seq := LPAD((FLOOR(RANDOM() * 999) + 1)::TEXT, 3, '0');
  RETURN 'GTC-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || prefix || '-' || seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
--  PODCASTS
-- ============================================================
CREATE TABLE podcasts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  host            TEXT NOT NULL,
  description     TEXT,
  audio_url       TEXT,
  thumbnail_url   TEXT,
  duration_secs   INTEGER,
  episode_number  INTEGER,
  is_premium      BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_podcasts_premium   ON podcasts(is_premium);
CREATE INDEX idx_podcasts_published ON podcasts(is_published, published_at DESC);

-- ============================================================
--  TEMPLATES
-- ============================================================
CREATE TABLE templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL,                 -- 'excel', 'sheets', 'pdf'
  file_url    TEXT,
  thumbnail   TEXT,
  file_size   TEXT,
  is_premium  BOOLEAN NOT NULL DEFAULT FALSE,
  downloads   INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                  plan_type NOT NULL,
  stripe_customer_id    TEXT,
  stripe_sub_id         TEXT UNIQUE,
  status                sub_status NOT NULL DEFAULT 'trialing',
  trial_ends_at         TIMESTAMPTZ,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  cancel_at_period_end  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Sync plan to profile when subscription updates
CREATE OR REPLACE FUNCTION sync_profile_plan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' OR NEW.status = 'trialing' THEN
    UPDATE profiles SET plan = NEW.plan WHERE id = NEW.user_id;
  ELSE
    UPDATE profiles SET plan = 'free' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE sync_profile_plan();

-- ============================================================
--  NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = broadcast
  type        notif_type NOT NULL DEFAULT 'system',
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  image_url   TEXT,
  deep_link   TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user ON notifications(user_id, sent_at DESC);
CREATE INDEX idx_notifs_read ON notifications(user_id, read);

-- ============================================================
--  PUSH TOKENS
-- ============================================================
CREATE TABLE push_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT,                          -- 'ios' | 'android'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  DOWNLOADS (template tracking)
-- ============================================================
CREATE TABLE downloads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id   UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- ============================================================
--  AI CHAT HISTORY
-- ============================================================
CREATE TABLE ai_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,
  messages    JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_sessions_user ON ai_sessions(user_id, updated_at DESC);

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions      ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Enrollments: users see/manage their own
CREATE POLICY "enrollments_own" ON enrollments
  FOR ALL USING (auth.uid() = user_id);

-- Progress: own data only
CREATE POLICY "progress_own" ON lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts: own data only
CREATE POLICY "attempts_own" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Certificates: own data; public can verify by cert_id (via function)
CREATE POLICY "certs_own" ON certificates
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions: own data only
CREATE POLICY "subscriptions_own" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Notifications: own or broadcast (user_id IS NULL)
CREATE POLICY "notifs_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "notifs_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Push tokens: own only
CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Downloads: own only
CREATE POLICY "downloads_own" ON downloads
  FOR ALL USING (auth.uid() = user_id);

-- AI sessions: own only
CREATE POLICY "ai_sessions_own" ON ai_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for course catalog, lessons (preview), podcasts, templates
CREATE POLICY "courses_public_read" ON courses
  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "lessons_public_read" ON lessons
  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "podcasts_public_read" ON podcasts
  FOR SELECT USING (is_published = TRUE);
CREATE POLICY "templates_public_read" ON templates
  FOR SELECT USING (TRUE);
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (TRUE);

-- ============================================================
--  HELPER FUNCTIONS
-- ============================================================

-- Get course completion percentage for a user
CREATE OR REPLACE FUNCTION get_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_lessons   INTEGER;
  done_lessons    INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lessons FROM lessons
    WHERE course_id = p_course_id AND is_published = TRUE;

  SELECT COUNT(*) INTO done_lessons FROM lesson_progress
    WHERE user_id = p_user_id AND course_id = p_course_id AND completed = TRUE;

  IF total_lessons = 0 THEN RETURN 0; END IF;
  RETURN ROUND((done_lessons::NUMERIC / total_lessons) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify a certificate by cert_id (public endpoint)
CREATE OR REPLACE FUNCTION verify_certificate(p_cert_id TEXT)
RETURNS TABLE(
  valid       BOOLEAN,
  holder_name TEXT,
  course_name TEXT,
  issued_at   TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      TRUE,
      p.full_name,
      c.title,
      cert.issued_at
    FROM certificates cert
    JOIN profiles p ON p.id = cert.user_id
    JOIN courses c ON c.id = cert.course_id
    WHERE cert.cert_id = p_cert_id AND cert.status = 'issued';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
--  SEED DATA (development)
-- ============================================================
INSERT INTO courses (title, slug, description, level, is_premium, is_published, sort_order) VALUES
  ('Excel Mastery Pro', 'excel-mastery-pro',
   'Master advanced Excel formulas, pivot tables, VLOOKUP, macros and charts.',
   'intermediate', FALSE, TRUE, 1),

  ('Data Analysis Fundamentals', 'data-analysis-fundamentals',
   'Learn data cleaning, statistical analysis, visualization and storytelling.',
   'beginner', FALSE, TRUE, 2),

  ('Dashboard Creation Masterclass', 'dashboard-creation',
   'Build executive-level dashboards with KPIs, charts and visual storytelling.',
   'advanced', TRUE, TRUE, 3),

  ('Google Sheets Automation', 'google-sheets-automation',
   'Automate repetitive tasks with Apps Script, formulas and integrations.',
   'beginner', FALSE, TRUE, 4),

  ('Business Intelligence Basics', 'business-intelligence',
   'Understand BI tools, data warehousing and reporting best practices.',
   'intermediate', TRUE, TRUE, 5);
