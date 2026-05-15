-- GTC Academy - Production Phase 1 extension
-- Run after database/schema.sql.
-- Supabase remains the source of truth. Device storage is cache/offline only.

-- ---------------------------------------------------------------------------
-- Enum helpers
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('super_admin', 'admin', 'instructor', 'student');
  end if;

  if not exists (select 1 from pg_type where typname = 'theme_preference') then
    create type theme_preference as enum ('system', 'light', 'dark');
  end if;

  if not exists (select 1 from pg_type where typname = 'language_code') then
    create type language_code as enum ('fr', 'en');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'enrollment_status') then
    create type enrollment_status as enum ('active', 'expired', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'course_lifecycle_status') then
    create type course_lifecycle_status as enum (
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'published',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'certificate_verification_status') then
    create type certificate_verification_status as enum ('valid', 'expired', 'revoked');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type ticket_status as enum ('open', 'pending', 'solved', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'exam_attempt_status') then
    create type exam_attempt_status as enum ('started', 'completed', 'cancelled', 'failed', 'passed');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type notification_channel as enum ('email', 'push', 'in_app');
  end if;

  if not exists (select 1 from pg_type where typname = 'trainer_approval_status') then
    create type trainer_approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Role and permission helpers
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role user_role not null default 'student',
  add column if not exists preferred_language language_code not null default 'fr',
  add column if not exists theme_preference theme_preference not null default 'system',
  add column if not exists physical_address text,
  add column if not exists phone_number text,
  add column if not exists age int check (age is null or age between 6 and 120),
  add column if not exists xp_points int not null default 0,
  add column if not exists learning_streak int not null default 0,
  add column if not exists badges jsonb not null default '[]'::jsonb,
  add column if not exists achievements jsonb not null default '[]'::jsonb,
  add column if not exists consented_at timestamptz,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists low_data_mode boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_language on public.profiles(preferred_language);

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and deleted_at is null),
    'student'::user_role
  );
$$;

create or replace function public.has_role(required_roles user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = any(required_roles);
$$;

create or replace function public.is_admin_like()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin'::user_role, 'admin'::user_role]);
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'super_admin'::user_role;
$$;

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and auth.uid() is not null and not public.is_super_admin() then
    raise exception 'Only super_admin can change user roles';
  end if;
  if old.deleted_at is distinct from new.deleted_at and auth.uid() is not null and not public.is_super_admin() then
    raise exception 'Only super_admin can permanently delete or restore users';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unauthorized_role_change on public.profiles;
create trigger trg_prevent_unauthorized_role_change
before update on public.profiles
for each row execute function public.prevent_unauthorized_role_change();

-- Initial protected admin identity. This only works after the auth user exists.
update public.profiles
set role = 'super_admin'
where email = 'contact@generaltechconsult.com';

-- ---------------------------------------------------------------------------
-- Trainer and course marketplace foundations
-- ---------------------------------------------------------------------------
create table if not exists public.trainer_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  photo_url text,
  bio text,
  expertise text,
  experience_years int not null default 0 check (experience_years >= 0),
  skills jsonb not null default '[]'::jsonb,
  rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  courses_created int not null default 0,
  earnings_placeholder numeric(12,2) not null default 0,
  approval_status trainer_approval_status not null default 'pending',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.courses
  add column if not exists trainer_id uuid references public.trainer_profiles(id),
  add column if not exists lifecycle_status course_lifecycle_status not null default 'draft',
  add column if not exists approval_notes text,
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists duration_minutes int not null default 0,
  add column if not exists lesson_count int not null default 0,
  add column if not exists prerequisites jsonb not null default '[]'::jsonb,
  add column if not exists learning_objectives jsonb not null default '[]'::jsonb,
  add column if not exists skills_acquired jsonb not null default '[]'::jsonb,
  add column if not exists delivery_modes jsonb not null default '["online"]'::jsonb,
  add column if not exists certificate_available boolean not null default true,
  add column if not exists final_exam_available boolean not null default false,
  add column if not exists secure_content_required boolean not null default true,
  add column if not exists downloadable_resources jsonb not null default '[]'::jsonb,
  add column if not exists popularity_score int not null default 0,
  add column if not exists review_count int not null default 0;

create index if not exists idx_courses_trainer_id on public.courses(trainer_id);
create index if not exists idx_courses_lifecycle on public.courses(lifecycle_status);
create index if not exists idx_courses_popularity on public.courses(popularity_score desc);

create table if not exists public.course_moderation_reviews (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  status course_lifecycle_status not null,
  comments text,
  created_at timestamptz not null default now()
);

create table if not exists public.course_reviews (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.trainer_profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Payment, coupons, invoices, and access control
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  discount_percentage int not null check (discount_percentage between 1 and 100),
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions int,
  redemption_count int not null default 0,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  discount_percentage int not null check (discount_percentage between 1 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id),
  trainer_id uuid references public.trainer_profiles(id),
  provider text not null default 'manual',
  provider_reference text,
  currency text not null default 'USD',
  amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_status payment_status not null default 'pending',
  training_option text not null default 'online',
  coupon_id uuid references public.coupons(id),
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  invoice_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  issued_at timestamptz not null default now(),
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  receipt_url text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.enrollments
  add column if not exists status enrollment_status not null default 'active',
  add column if not exists purchase_id uuid references public.purchases(id),
  add column if not exists expires_at timestamptz,
  add column if not exists granted_by uuid references public.profiles(id),
  add column if not exists revoked_by uuid references public.profiles(id),
  add column if not exists revoked_at timestamptz,
  add column if not exists access_source text not null default 'system';

create table if not exists public.access_grants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status enrollment_status not null default 'active',
  reason text,
  granted_by uuid references public.profiles(id),
  revoked_by uuid references public.profiles(id),
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

create or replace function public.can_access_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin_like()
    or exists (
      select 1
      from public.courses c
      where c.id = target_course_id
        and coalesce(c.is_premium, false) = false
        and coalesce(c.is_published, false) = true
    )
    or exists (
      select 1
      from public.enrollments e
      where e.user_id = auth.uid()
        and e.course_id = target_course_id
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
    or exists (
      select 1
      from public.access_grants g
      where g.user_id = auth.uid()
        and g.course_id = target_course_id
        and g.status = 'active'
        and (g.expires_at is null or g.expires_at > now())
    )
    or exists (
      select 1
      from public.purchases p
      where p.user_id = auth.uid()
        and p.course_id = target_course_id
        and p.payment_status = 'paid'
    );
$$;

-- ---------------------------------------------------------------------------
-- Exam proctoring, audit logs, and certificate verification
-- ---------------------------------------------------------------------------
alter table public.quizzes
  add column if not exists time_limit_seconds int not null default 900,
  add column if not exists attempt_limit int not null default 3,
  add column if not exists passing_score int not null default 70,
  add column if not exists randomize_questions boolean not null default true,
  add column if not exists randomize_answers boolean not null default true,
  add column if not exists requires_completion_percentage int not null default 100,
  add column if not exists difficulty text not null default 'progressive';

alter table public.quiz_attempts
  add column if not exists status exam_attempt_status not null default 'completed',
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists submitted_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_reason text,
  add column if not exists remaining_seconds int,
  add column if not exists audit_summary jsonb not null default '{}'::jsonb;

create unique index if not exists idx_one_active_quiz_attempt
  on public.quiz_attempts(user_id, quiz_id)
  where status = 'started';

create table if not exists public.exam_attempt_events (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid references public.quiz_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.certificates
  add column if not exists certificate_id text,
  add column if not exists learner_photo_url text,
  add column if not exists score_obtained int,
  add column if not exists verification_status certificate_verification_status not null default 'valid',
  add column if not exists public_token text unique,
  add column if not exists verification_url text,
  add column if not exists qr_code_url text,
  add column if not exists expires_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references public.profiles(id),
  add column if not exists revoke_reason text,
  add column if not exists accreditation_text text,
  add column if not exists certificate_wording text not null default 'GTC Verifiable Certificate';

update public.certificates
set certificate_id = coalesce(certificate_id, cert_id),
    certificate_wording = 'GTC Verifiable Certificate'
where certificate_id is null or certificate_wording is null;

create index if not exists idx_certificates_certificate_id on public.certificates(certificate_id);
create index if not exists idx_certificates_public_token on public.certificates(public_token);
create index if not exists idx_certificates_status on public.certificates(verification_status);

create or replace view public.public_certificate_verification as
select
  c.certificate_id,
  c.public_token,
  c.verification_status,
  c.learner_name,
  c.learner_photo_url,
  c.course_name,
  c.score_obtained,
  c.issued_at,
  c.verification_url,
  c.qr_code_url,
  c.certificate_wording,
  'Certificate issued by General Tech Consult'::text as issuer_wording
from public.certificates c
where c.verification_status in ('valid', 'expired', 'revoked');

create or replace function public.verify_certificate(p_lookup text)
returns table (
  certificate_id text,
  public_token text,
  verification_status certificate_verification_status,
  learner_name text,
  learner_photo_url text,
  course_name text,
  score_obtained int,
  issued_at timestamptz,
  verification_url text,
  qr_code_url text,
  certificate_wording text,
  issuer_wording text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.certificate_id,
    c.public_token,
    c.verification_status,
    c.learner_name,
    c.learner_photo_url,
    c.course_name,
    c.score_obtained,
    c.issued_at,
    c.verification_url,
    c.qr_code_url,
    c.certificate_wording,
    'Certificate issued by General Tech Consult'::text as issuer_wording
  from public.certificates c
  where c.verification_status in ('valid', 'expired', 'revoked')
    and (c.public_token = p_lookup or c.certificate_id = p_lookup or c.cert_id = p_lookup)
  limit 1;
$$;

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- Legal, consent, account deletion, and support
-- ---------------------------------------------------------------------------
create table if not exists public.legal_documents (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  language language_code not null default 'fr',
  version text not null default '1.0',
  body text not null,
  active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_consents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  legal_document_id uuid references public.legal_documents(id),
  document_slug text not null,
  version text not null,
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.data_deletion_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('data_export', 'data_deletion', 'account_deletion')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'rejected')),
  reason text,
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id),
  subject text not null,
  body text not null,
  status ticket_status not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications, video/content security, sync, analytics
-- ---------------------------------------------------------------------------
create table if not exists public.notification_deliveries (
  id uuid primary key default uuid_generate_v4(),
  notification_id uuid references public.notifications(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  channel notification_channel not null,
  provider text,
  provider_message_id text,
  status text not null default 'queued',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.content_access_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  storage_path text not null,
  signed_url text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_downloads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  resource_path text not null,
  watermark_applied boolean not null default false,
  downloaded_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.sync_queue_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  operation text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  retry_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_sales_reports (
  id uuid primary key default uuid_generate_v4(),
  month date not null unique,
  gross_revenue numeric(12,2) not null default 0,
  net_revenue numeric(12,2) not null default 0,
  paid_students int not null default 0,
  most_purchased_courses jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.admin_kpis as
select
  (select count(*) from public.profiles where deleted_at is null) as total_users,
  (select count(*) from public.profiles where role = 'student' and deleted_at is null) as active_students,
  (select count(distinct user_id) from public.purchases where payment_status = 'paid') as paid_students,
  (select coalesce(sum(total_amount), 0) from public.purchases where payment_status = 'paid') as revenue,
  (select count(*) from public.certificates where verification_status = 'valid') as valid_certificates,
  (select count(*) from public.quiz_attempts where status = 'passed') as passed_exams,
  (select count(*) from public.quiz_attempts where status in ('failed', 'passed', 'completed')) as submitted_exams
where public.is_admin_like();

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
alter table public.trainer_profiles enable row level security;
alter table public.course_moderation_reviews enable row level security;
alter table public.course_reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.promotions enable row level security;
alter table public.purchases enable row level security;
alter table public.invoices enable row level security;
alter table public.access_grants enable row level security;
alter table public.exam_attempt_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.legal_documents enable row level security;
alter table public.user_consents enable row level security;
alter table public.data_deletion_requests enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.content_access_tokens enable row level security;
alter table public.resource_downloads enable row level security;
alter table public.sync_queue_events enable row level security;
alter table public.analytics_events enable row level security;
alter table public.monthly_sales_reports enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles admin read all') then
    execute 'create policy "profiles admin read all" on public.profiles for select using (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles admin update all') then
    execute 'create policy "profiles admin update all" on public.profiles for update using (public.is_admin_like()) with check (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'enrollments' and policyname = 'enrollments admin manage') then
    execute 'create policy "enrollments admin manage" on public.enrollments for all using (public.is_admin_like()) with check (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lesson_progress' and policyname = 'lesson progress admin read') then
    execute 'create policy "lesson progress admin read" on public.lesson_progress for select using (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_attempts' and policyname = 'quiz attempts admin read') then
    execute 'create policy "quiz attempts admin read" on public.quiz_attempts for select using (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificates' and policyname = 'certificates admin manage') then
    execute 'create policy "certificates admin manage" on public.certificates for all using (public.is_admin_like()) with check (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trainer_profiles' and policyname = 'trainer profiles read published') then
    execute 'create policy "trainer profiles read published" on public.trainer_profiles for select using (approval_status = ''approved'' or user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trainer_profiles' and policyname = 'trainer profiles own write') then
    execute 'create policy "trainer profiles own write" on public.trainer_profiles for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'purchases' and policyname = 'purchases own or admin') then
    execute 'create policy "purchases own or admin" on public.purchases for select using (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'purchases' and policyname = 'purchases user create pending') then
    execute 'create policy "purchases user create pending" on public.purchases for insert with check (user_id = auth.uid() and payment_status = ''pending'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'purchases' and policyname = 'purchases admin update') then
    execute 'create policy "purchases admin update" on public.purchases for update using (public.is_admin_like()) with check (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'invoices' and policyname = 'invoices own or admin') then
    execute 'create policy "invoices own or admin" on public.invoices for select using (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'support_tickets' and policyname = 'support tickets own or admin') then
    execute 'create policy "support tickets own or admin" on public.support_tickets for select using (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'support_tickets' and policyname = 'support tickets create own') then
    execute 'create policy "support tickets create own" on public.support_tickets for insert with check (user_id = auth.uid())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'support_tickets' and policyname = 'support tickets update own or admin') then
    execute 'create policy "support tickets update own or admin" on public.support_tickets for update using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'legal_documents' and policyname = 'legal documents public read') then
    execute 'create policy "legal documents public read" on public.legal_documents for select using (active = true)';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'legal_documents' and policyname = 'legal documents admin write') then
    execute 'create policy "legal documents admin write" on public.legal_documents for all using (public.is_admin_like()) with check (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_consents' and policyname = 'user consents own or admin') then
    execute 'create policy "user consents own or admin" on public.user_consents for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'data_deletion_requests' and policyname = 'data deletion own or admin') then
    execute 'create policy "data deletion own or admin" on public.data_deletion_requests for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_reviews' and policyname = 'course reviews public read') then
    execute 'create policy "course reviews public read" on public.course_reviews for select using (true)';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'course_reviews' and policyname = 'course reviews own write') then
    execute 'create policy "course reviews own write" on public.course_reviews for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'exam_attempt_events' and policyname = 'exam events own or admin') then
    execute 'create policy "exam events own or admin" on public.exam_attempt_events for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_logs' and policyname = 'audit logs admin read') then
    execute 'create policy "audit logs admin read" on public.audit_logs for select using (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_logs' and policyname = 'audit logs authenticated insert') then
    execute 'create policy "audit logs authenticated insert" on public.audit_logs for insert with check (auth.uid() is not null)';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'content_access_tokens' and policyname = 'content tokens own or admin') then
    execute 'create policy "content tokens own or admin" on public.content_access_tokens for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resource_downloads' and policyname = 'resource downloads own or admin') then
    execute 'create policy "resource downloads own or admin" on public.resource_downloads for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sync_queue_events' and policyname = 'sync queue own or admin') then
    execute 'create policy "sync queue own or admin" on public.sync_queue_events for all using (user_id = auth.uid() or public.is_admin_like()) with check (user_id = auth.uid() or public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'analytics events own insert') then
    execute 'create policy "analytics events own insert" on public.analytics_events for insert with check (user_id = auth.uid() or user_id is null)';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'analytics events admin read') then
    execute 'create policy "analytics events admin read" on public.analytics_events for select using (public.is_admin_like())';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'monthly_sales_reports' and policyname = 'sales reports super admin read') then
    execute 'create policy "sales reports super admin read" on public.monthly_sales_reports for select using (public.is_super_admin())';
  end if;
end $$;

revoke all on public.public_certificate_verification from anon, authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;
grant select on public.admin_kpis to authenticated;

-- Required storage buckets/policies to configure in Supabase dashboard:
-- - course-videos: private, signed URL only.
-- - course-resources: private, signed URL only.
-- - profile-photos: authenticated uploads, owner-read plus admin-read.
-- - certificates: generated PDFs, owner-read plus public verification metadata only.
