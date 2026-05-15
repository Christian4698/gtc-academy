# Production Checklist

## Android Release

```powershell
npm run type-check
npx expo-doctor
eas build --platform android --profile preview
eas build --platform android --profile production
```

Deliverables:

- APK for direct testing
- AAB for Google Play
- adaptive app icon
- splash screen
- production version number
- minimized permissions

## Supabase

- Apply `database/schema.sql`
- Apply `database/production_phase1.sql`
- Verify RLS is enabled
- Verify `contact@generaltechconsult.com` profile is `super_admin`
- Create private storage buckets
- Deploy `notify-admin`
- Configure email secrets
- Configure Stripe webhook secrets when payments go live

## Compliance

- Terms and Conditions visible
- Privacy Policy visible
- Refund Policy visible
- Certificate disclaimer visible
- Registration consent required
- Data deletion request available
- Account deletion request available
- Certificate wording stays `GTC Verifiable Certificate`
- No international accreditation claim unless legally validated and manually enabled by admin

## Payment And Access

- Purchases start as `pending`
- Course access unlocks only after `paid` or manual admin grant
- Refunded purchases revoke access when configured
- Coupons and promotions are admin controlled
- Receipts/invoices are generated server-side

## Exam Security

- User must be logged in
- Timer visible
- Questions and answers randomized
- One active attempt enforced by database index
- Attempt limits and passing score stored in Supabase
- Background/minimized app cancels the attempt
- Exam audit events recorded
- Native screenshot blocking remains a next native module task

## Monitoring

- Configure Sentry or Firebase Crashlytics
- Configure PostHog or Google Analytics
- Track critical events: registration, login, purchase, course completed, exam started, exam submitted, certificate issued
- Keep API errors logged server-side

## Low-End Android

- Test Android 8+
- Test 2GB RAM emulator or device
- Test slow network profile
- Confirm offline cache works for profile, courses, progress and exam result cache
- Keep images compressed and avoid heavy animations
