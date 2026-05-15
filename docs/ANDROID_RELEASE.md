# GTC Academy Android Release

This document prepares the Capacitor Android release path without changing the
existing Expo/React Native Android project.

## Release Signing

Release signing is configured in:

```text
capacitor/android/app/build.gradle
```

The release build reads signing credentials from either:

1. `capacitor/android/keystore.properties` on the local build machine.
2. Environment variables in CI/CD.

The local files are intentionally ignored by Git:

```text
capacitor/android/keystore.properties
capacitor/android/keystores/
*.jks
*.keystore
*.p12
```

The generated local release keystore is:

```text
capacitor/android/keystores/gtc-academy-release.p12
```

Do not upload this file to Git, chat, email, or issue trackers. Back it up in a
password manager or secure vault with the generated `keystore.properties` values.

## CI/CD Variables

Use these variable names if building outside this workstation:

```text
GTC_ANDROID_KEYSTORE_FILE=keystores/gtc-academy-release.p12
GTC_ANDROID_KEYSTORE_TYPE=PKCS12
GTC_ANDROID_KEYSTORE_PASSWORD=<secret>
GTC_ANDROID_KEY_ALIAS=gtc-academy-release
GTC_ANDROID_KEY_PASSWORD=<secret>
```

For PKCS12 keystores, keep `GTC_ANDROID_KEY_PASSWORD` equal to
`GTC_ANDROID_KEYSTORE_PASSWORD`.

## Build Commands

From the repository root:

```powershell
npm run type-check
npm run pwa:build
npx cap sync android
npm run capacitor:build:apk
npm run capacitor:build:aab
```

Artifacts:

```text
capacitor/android/app/build/outputs/apk/debug/app-debug.apk
capacitor/android/app/build/outputs/bundle/release/app-release.aab
```

## Verification Commands

APK signature:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.1.0\apksigner.bat" verify --verbose --print-certs "capacitor/android/app/build/outputs/apk/debug/app-debug.apk"
```

AAB signature:

```powershell
& "C:\Program Files\Java\jdk-22\bin\jarsigner.exe" -verify -verbose -certs "capacitor/android/app/build/outputs/bundle/release/app-release.aab"
```

Android package metadata:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.1.0\aapt2.exe" dump badging "capacitor/android/app/build/outputs/apk/debug/app-debug.apk"
```

Install debug APK when a device or emulator is connected:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices -l
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "capacitor/android/app/build/outputs/apk/debug/app-debug.apk"
```

## Current Release Facts

- Application ID: `com.generaltech.gtcacademy`
- App label: `GTC Academy`
- Version code: `1`
- Version name: `1.0`
- Min SDK: `24`
- Target SDK: `36`
- Permission: `android.permission.INTERNET`
- Release certificate owner: `CN=GTC Academy, OU=Mobile, O=General Tech Consult, L=Kinshasa, ST=Kinshasa, C=CD`
- Release certificate algorithm: `SHA384withRSA`, 4096-bit RSA

## Play Store Checklist

- App name: `GTC Academy`
- Package name: `com.generaltech.gtcacademy`
- App category: Education
- Short description: prepare a concise 80-character value proposition.
- Full description: include Excel, data analysis, BI, certificates, offline/PWA support, and premium access.
- App icon: use the 1024x1024 GTC icon from `assets/icon.png`.
- Feature graphic: prepare a 1024x500 brand graphic.
- Phone screenshots: at least 2, recommended 6-8.
- Tablet screenshots: add if tablet support is enabled later.
- Privacy policy URL: required before production release.
- Terms of use URL: required for premium/subscription flows.
- Support email: confirm the production support mailbox.
- Data Safety form: document auth, profile, progress, certificates, payments, notifications, and analytics.
- Content rating questionnaire: complete in Play Console.
- Target audience: set according to final learning audience.
- App access instructions: provide demo credentials if login blocks review.
- Release notes: write clear notes for version `1.0`.
- Play App Signing: enable and keep the upload keystore backed up.
- Store listing localization: prepare French and English copy if both markets are targeted.
- Payment compliance: document Stripe/premium subscription behavior and any external account requirements.

## Known Notes

- The generated release AAB is signed locally and ready for Play Console testing.
- The release AAB still needs Play Console validation, Data Safety, signing enrollment, and store listing assets.
- No Android device was connected during this preparation, so APK install/runtime smoke test should be run on a real device or emulator before submission.
