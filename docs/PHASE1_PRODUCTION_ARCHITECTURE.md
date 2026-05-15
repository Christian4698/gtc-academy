# GTC Academy Phase 1 Production Architecture

This phase continues the existing Expo React Native app. It does not rebuild or replace the current architecture.

## Scope Delivered

- Additive Supabase production migration: `database/production_phase1.sql`
- Role model: `super_admin`, `admin`, `instructor`, `student`
- Admin identity seed: `contact@generaltechconsult.com` becomes `super_admin` after the profile exists
- Legal/compliance foundations: terms, privacy, refund, certificate disclaimer, user consent, data deletion and account deletion requests
- Payments/access foundations: pending purchases, paid/refunded statuses, invoices, coupons, promotions, manual access grants
- Course quality metadata: level, duration, lessons, prerequisites, objectives, skills, trainer, certificate and final exam flags, reviews
- Trainer marketplace foundations: trainer profiles, approval status, course lifecycle and moderation comments
- Exam security foundations: timed attempts, randomized questions/answers, active-attempt constraint, audit events, cancel-on-background app behavior in the mobile screen
- Certificate verification foundations: certificate ID, learner photo, score, QR/public URL fields, valid/expired/revoked status, revocation fields
- Notification foundations: email/push/in-app delivery records and `notify-admin` Edge Function
- Support system: ticket tables, mobile support screen, WhatsApp CTA
- Offline-first foundation: local JSON cache and sync queue using Expo FileSystem; Supabase remains source of truth
- Website integration: GTC website CTA and future public verification URL support

## Source Of Truth

Supabase remains the master source for:

- users and roles
- payments and purchases
- certificates
- exams
- admin and trainer analytics
- progress master records
- subscriptions

Local storage is only for:

- cached profile data
- downloaded course metadata
- progress cache
- exam result cache
- offline access metadata
- temporary sync queue operations

## Database Migration Order

Run the existing schema first, then the Phase 1 extension.

```powershell
supabase db push
```

Or from SQL editor:

1. Run `database/schema.sql`
2. Run `database/production_phase1.sql`

## Edge Functions

New function:

```text
supabase/functions/notify-admin/index.ts
```

Required secrets:

```powershell
supabase secrets set EMAIL_PROVIDER=resend
supabase secrets set EMAIL_API_KEY=your_key
supabase secrets set EMAIL_FROM="GTC Academy <contact@generaltechconsult.com>"
supabase secrets set ADMIN_EMAIL=contact@generaltechconsult.com
```

Deploy:

```powershell
supabase functions deploy notify-admin
```

## Phase Boundaries

Phase 1 intentionally prepares the architecture and completes safe foundations. It does not yet finish:

- real payment provider checkout screens
- PDF watermark rendering
- full CDN streaming migration
- full React/Vite admin dashboard, because this project path currently contains the mobile app only
- full replacement of every hardcoded legacy UI string with i18n keys
- native screenshot blocking on Android exam screens

These are documented as next-phase work so the app stays stable.
