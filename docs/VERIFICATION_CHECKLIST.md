# Verification Checklist

Run on Windows from the project root:

```powershell
cd "C:\Users\PC\Downloads\gtc-academy-codebase\gtc-academy"
npm install
npm run type-check
npm start
```

For Android emulator:

```powershell
npm run android
```

For EAS builds:

```powershell
eas build --platform android --profile preview
eas build --platform android --profile production
```

## Manual Mobile Checks

- Register requires legal consent.
- Legal pages open from registration and profile settings.
- Language setting switches French/English preference.
- Theme preference can be selected and saved to profile.
- GTC website opens from home/profile/settings.
- Course catalog search/filter/sort works.
- Paid course creates a pending purchase instead of unlocking access.
- Free course enrollment still works.
- Quiz randomizes questions/answers.
- Quiz result is stored remotely and cached locally.
- Minimizing the app during a quiz cancels the attempt.
- Support ticket form submits.
- WhatsApp support opens `+243 829 664 720`.
- Admin screen shows production sections and KPI placeholders.

## Supabase Checks

- `production_phase1.sql` runs after `schema.sql`.
- RLS policies exist for profiles, purchases, support, legal, exams, certificates and trainer profiles.
- Public certificate lookup uses `verify_certificate(lookup)` and returns only the requested certificate.
- `admin_kpis` is readable only for authenticated users and should be surfaced only to admins in UI.
- Storage buckets are private where required.

## Known Phase 2 Checks

- Native screenshot blocking on Android exam screens.
- Real payment provider success/failure webhooks.
- PDF certificate generation and watermarking.
- React/Vite admin dashboard if that codebase is present in the target project.
