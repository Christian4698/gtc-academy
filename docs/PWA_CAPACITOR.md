# GTC Academy PWA + Capacitor

This repository keeps the existing Expo mobile app intact and adds a separate
Next.js static PWA target for installable web and future Capacitor Android builds.

## What is included

- Next.js 14 static export, pinned for React 18 / Expo SDK 51 compatibility.
- `next-pwa` service worker with basic offline fallback.
- `public/manifest.json` with Android icons, maskable icon, standalone display and shortcuts.
- PWA splash assets in `public/splash.png` and `public/splash.svg`.
- Mobile-first premium PWA shell in `app/`.
- Capacitor config using `webDir: "out"`.
- Capacitor Android path set to `capacitor/android` so the existing Expo `android/`
  project is not overwritten.

## Local PWA

```powershell
npm run pwa:dev
```

Open:

```text
http://localhost:3000
```

## Production PWA export

```powershell
npm run pwa:build
npm run pwa:preview
```

The static production output is generated in:

```text
out/
```

## First Capacitor Android generation

Run this only when you are ready to create the Capacitor native project:

```powershell
npm run capacitor:add:android
```

Because `capacitor.config.ts` uses `android.path = "capacitor/android"`, this does
not replace the existing Expo Android project at `android/`.

## Sync web changes to Capacitor

```powershell
npm run capacitor:sync
```

## Open Android Studio

```powershell
npm run capacitor:open:android
```

## Future APK/AAB builds

Debug APK:

```powershell
npm run capacitor:build:apk
```

Release AAB:

```powershell
npm run capacitor:build:aab
```

For a Play Store release, configure signing in the generated Capacitor Android
project before running the release bundle.

## Lighthouse mobile targets

Use the production export for audits:

```powershell
npm run pwa:build
npm run pwa:preview
```

Then run Lighthouse mobile against the preview URL and check:

- Installable manifest.
- Registered service worker.
- Offline fallback loads after first visit.
- Tap targets remain at least 44px high.
- No viewport scaling issue.
- Static assets are cacheable.
