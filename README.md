# 🎓 GTC Academy — Mobile Learning Platform

**"Data Speaks. Experts Decide."**

A premium mobile learning app for Excel, Data Analysis & Business Intelligence — built with React Native (Expo), Supabase, and Claude AI.

---

## ✨ Features

| Category | Features |
|---|---|
| **Auth** | Email/password · Google OAuth · Secure session persistence |
| **Courses** | Video lessons · Progress tracking · Completion badges |
| **Quizzes** | Auto-graded · Score history · AI hints |
| **Certificates** | Auto-generated PDF · QR verification · Public verify endpoint |
| **AI Assistant** | Streaming Claude AI · Excel/Data specialist · Session history |
| **Podcasts** | Audio player · Background playback · Premium locking |
| **Templates** | Excel & Sheets downloads · Premium/free tiers |
| **Subscriptions** | Free · Premium Monthly · Premium Annual · Stripe |
| **Admin** | User management · Content upload · Notifications · Analytics |
| **Notifications** | Push (Expo) · In-app · Broadcasts |

---

## 🛠 Tech Stack

```
Frontend:   React Native + Expo SDK 51
Navigation: React Navigation v6 (Stack + Bottom Tabs)
State:      Zustand + React Query (TanStack)
Backend:    Supabase (PostgreSQL + Auth + Storage + Edge Functions)
AI:         Anthropic Claude claude-sonnet-4-20250514 (streaming)
Payments:   Stripe + react-native-stripe (Mobile Money ready)
Audio:      react-native-track-player
PDF:        expo-print + expo-sharing
Push:       Expo Notifications
Build:      EAS Build (Expo Application Services)
```

---

## 📂 Project Structure

```
gtc-academy/
├── App.tsx                          # Navigation root + auth bootstrap
├── app.json                         # Expo config
├── eas.json                         # EAS build profiles
├── package.json
├── tsconfig.json
├── .env.example                     # Environment variable template
│
├── database/
│   └── schema.sql                   # Full PostgreSQL schema + RLS
│
├── supabase/
│   ├── functions/                   # Edge Functions
│   │   ├── generate-certificate/    # PDF cert generation
│   │   ├── stripe-webhook/          # Stripe event handler
│   │   └── send-notification/       # Push notification sender
│   └── storage/                     # Storage bucket policies
│
└── src/
    ├── types/index.ts               # All TypeScript types
    ├── theme/index.ts               # Colors, typography, spacing
    │
    ├── services/
    │   ├── supabase.ts              # All DB service functions
    │   ├── ai.ts                    # Anthropic streaming service
    │   └── stripe.ts                # Payment service
    │
    ├── hooks/
    │   ├── useStore.ts              # Zustand global stores
    │   ├── useAuth.ts               # Auth hook
    │   └── useCourseProgress.ts     # Progress calculation hook
    │
    ├── components/
    │   ├── CourseCard.tsx
    │   ├── PodcastCard.tsx
    │   ├── StatCard.tsx
    │   ├── ProgressRing.tsx
    │   ├── PremiumBanner.tsx
    │   ├── SkeletonLoader.tsx
    │   ├── CertificateView.tsx      # Styled certificate renderer
    │   └── icons/                   # Tab bar icons
    │
    ├── screens/
    │   ├── OnboardingScreen.tsx     # 3-slide carousel
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── HomeScreen.tsx           # Main dashboard
    │   ├── CoursesScreen.tsx        # Course catalog + search
    │   ├── courses/
    │   │   ├── CourseDetailScreen.tsx
    │   │   ├── LessonScreen.tsx     # Video + PDF player
    │   │   └── QuizScreen.tsx       # Interactive quiz
    │   ├── AIScreen.tsx             # Streaming AI chat
    │   ├── PodcastScreen.tsx        # Audio player
    │   ├── ProfileScreen.tsx
    │   ├── PremiumScreen.tsx        # Subscription paywall
    │   ├── TemplatesScreen.tsx      # Downloadable files
    │   ├── CertificateScreen.tsx    # Certificate viewer + QR
    │   ├── NotificationsScreen.tsx
    │   └── AdminScreen.tsx          # Admin dashboard
    │
    └── navigation/
        └── AppNavigator.tsx         # (referenced from App.tsx)
```

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
node >= 18
npm >= 9
expo-cli: npm install -g expo-cli
eas-cli:  npm install -g eas-cli
```

### 2. Clone & Install

```bash
git clone https://github.com/your-org/gtc-academy.git
cd gtc-academy
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Anthropic
EXPO_PUBLIC_ANTHROPIC_KEY=sk-ant-...

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...          # server-side only (Edge Functions)

# Admin
EXPO_PUBLIC_ADMIN_EMAILS=admin@gtc.com,cto@gtc.com

# EAS
EXPO_PUBLIC_EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 4. Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the schema
supabase db push database/schema.sql

# Enable Google OAuth in Supabase Dashboard:
# Authentication → Providers → Google → Enable
# Add your Google Client ID + Secret

# Create storage buckets:
# Storage → New bucket → "avatars" (public)
# Storage → New bucket → "videos" (private, signed URLs)
# Storage → New bucket → "pdfs" (private)
# Storage → New bucket → "certificates" (private)
```

### 5. Deploy Supabase Edge Functions

```bash
# Certificate generation (uses puppeteer)
supabase functions deploy generate-certificate

# Stripe webhook handler
supabase functions deploy stripe-webhook

# Push notification sender
supabase functions deploy send-notification

# Set secrets for Edge Functions
supabase secrets set ANTHROPIC_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Stripe Setup

```bash
# In Stripe Dashboard, create products:
# - GTC Academy Premium Monthly: $12.99/month
# - GTC Academy Premium Annual:   $7.99/month ($95.88/year)

# Add webhook endpoint:
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
# Events to listen: customer.subscription.updated, customer.subscription.deleted, invoice.paid
```

### 7. Run Locally

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

---

## 📱 Building for Production

### EAS Build Setup

```bash
# Configure EAS
eas build:configure

# Build for both platforms
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### `eas.json` Config

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "ios":     { "buildConfiguration": "Release" },
      "android": { "buildType": "apk" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppId": "XXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## 🗄 Database Quick Reference

```sql
-- Get user's course progress
SELECT get_course_progress('user-uuid', 'course-uuid');

-- Verify a certificate
SELECT * FROM verify_certificate('GTC-2025-XL-001');

-- Get enrolled courses with progress
SELECT c.title, get_course_progress(e.user_id, e.course_id) AS progress
FROM enrollments e
JOIN courses c ON c.id = e.course_id
WHERE e.user_id = 'user-uuid';
```

---

## 🤖 AI Assistant Configuration

The AI assistant is configured to specialise in:
- Excel formulas and functions
- Google Sheets and Apps Script
- Data Analysis and visualisation
- Dashboard design and KPI selection
- Business Intelligence and reporting

To adjust the AI persona, edit `SYSTEM_PROMPT` in `src/services/ai.ts`.

---

## 🔒 Security Checklist

- [x] Row Level Security (RLS) on all tables
- [x] Secure session storage via `expo-secure-store`
- [x] API keys in environment variables only
- [x] Video URLs use signed tokens (never public)
- [x] Certificate verification via server-side function
- [x] Admin access gated by email allowlist + server validation
- [x] Stripe webhook signature verification
- [ ] Rate limiting on AI endpoint (add via Supabase Edge Function)
- [ ] Content moderation on user uploads

---

## 🗺 Roadmap

```
v1.0  MVP — Auth, Courses, Quizzes, AI, Certificates, Podcasts ✅
v1.1  Offline mode — Download lessons + PDFs
v1.2  Community — Discussion boards per course
v1.3  Live Classes — Zoom/Daily.co integration
v1.4  AI Dashboards — Generate Excel/Sheets from a prompt
v1.5  Team Plans — Company licensing + team progress tracking
v2.0  Marketplace — Sell courses (instructor dashboard)
```

---

## 📄 Licence

Proprietary — © 2025 General Tech Consult. All rights reserved.

---

## 🙋 Support

- Email: support@gtcacademy.com
- Website: https://gtcacademy.com
- Documentation: https://docs.gtcacademy.com
# GTC Academy - Production Phase 1 Notes

This repository is the existing GTC Academy Expo/React Native mobile app. The Phase 1 work continues the current architecture and does not rebuild the application from zero.

## What Was Added

- Supabase production extension: `database/production_phase1.sql`
- Mobile legal, support and settings screens
- French/English i18n foundation
- Role-aware profile/admin foundations
- Purchase/access architecture with pending payment flow
- Course quality metadata and broader technology categories
- Exam proctoring foundations: timer, randomization, app-background cancellation, audit events
- Certificate verification schema fields with `GTC Verifiable Certificate` wording
- Offline cache and sync queue service
- Admin notification Edge Function: `supabase/functions/notify-admin`
- GTC website buttons and future certificate verification URL support
- Production docs in `docs/`

## Windows Commands

```powershell
cd "C:\Users\PC\Downloads\gtc-academy-codebase\gtc-academy"
npm install
npm run type-check
npm start
npm run android
```

## PWA + Capacitor Android

The Expo mobile app remains unchanged. A separate Next.js static PWA target is
available for installable web and future Capacitor Android packaging.

```powershell
npm run pwa:dev
npm run pwa:build
npm run capacitor:add:android
npm run capacitor:sync
```

Capacitor is configured to generate Android under `capacitor/android`, leaving
the existing Expo `android/` project untouched. See `docs/PWA_CAPACITOR.md`.
Android release signing and Play Store preparation are documented in
`docs/ANDROID_RELEASE.md`. The npm security audit release plan is documented in
`docs/NPM_AUDIT_RELEASE_PLAN.md`. The latest local release verification report is
in `docs/ANDROID_RELEASE_REPORT.md`.

## Supabase Migration Order

```text
database/schema.sql
database/production_phase1.sql
```

Then deploy the admin notification function:

```powershell
supabase functions deploy notify-admin
```

## Documentation

- `docs/PHASE1_PRODUCTION_ARCHITECTURE.md`
- `docs/OFFLINE_SYNC.md`
- `docs/BACKUP_RECOVERY.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/VERIFICATION_CHECKLIST.md`

## Important Certificate Wording

Use:

- `GTC Verifiable Certificate`
- `Certificate issued by General Tech Consult`

Do not claim international accreditation by default. Accreditation text must be enabled manually only after legal validation.

---
