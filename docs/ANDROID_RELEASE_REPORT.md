# Android Release Report

Date: 2026-05-15

## Scope

Prepared the Capacitor Android release path for GTC Academy while keeping the
existing Expo/React Native project and the Next.js PWA target functional.

## Signing

- Release keystore created locally.
- Keystore type: `PKCS12`
- Alias: `gtc-academy-release`
- Local signing properties created locally.
- Secret files are ignored by root `.gitignore` and `capacitor/android/.gitignore`.
- Release signing is configured through `capacitor/android/app/build.gradle`.
- CI/CD variables are documented in `docs/ANDROID_RELEASE.md`.

No passwords or keystore contents are stored in documentation.

## Build Verification

Commands run successfully:

```powershell
npm run type-check
npm run pwa:build
npx cap sync android
npm run capacitor:build:apk
npm run capacitor:build:aab
```

Generated artifacts:

```text
capacitor/android/app/build/outputs/apk/debug/app-debug.apk
capacitor/android/app/build/outputs/bundle/release/app-release.aab
```

Current artifact sizes:

```text
app-debug.apk    5.09 MB
app-release.aab  3.80 MB
```

## Android Metadata

From APK badging:

```text
package: com.generaltech.gtcacademy
versionCode: 1
versionName: 1.0
minSdkVersion: 24
targetSdkVersion: 36
application-label: GTC Academy
permission: android.permission.INTERNET
```

## Signature Verification

Debug APK:

```text
apksigner verify: OK
v2 APK Signature Scheme: true
signer: Android Debug
```

Release AAB:

```text
jarsigner verify: jar verified
META-INF/GTC-ACAD.SF present
META-INF/GTC-ACAD.RSA present
certificate owner: CN=GTC Academy, OU=Mobile, O=General Tech Consult, L=Kinshasa, ST=Kinshasa, C=CD
signature algorithm: SHA384withRSA
key: 4096-bit RSA
SHA256: 79:1D:83:95:86:03:7E:45:C8:AB:7B:B6:A6:F5:3D:68:6D:38:10:F5:E3:15:12:4F:F8:D9:9B:59:A7:3B:C4:D2
```

`jarsigner` warns that the certificate is self-signed and lacks a timestamp.
That is expected for Android upload signing keys; Play App Signing validates and
manages distribution signing after upload.

## Device Runtime Status

`adb devices -l` returned no connected devices. The APK was built and signature
verified, but runtime install testing still needs a connected Android device or
emulator.

## npm Audit

Current result:

```text
32 total vulnerabilities
1 low
9 moderate
22 high
0 critical
```

No `npm audit fix --force` was used.

The safe remediation plan is documented in:

```text
docs/NPM_AUDIT_RELEASE_PLAN.md
```

## Non-Blocking Notes

- `npm run lint` currently fails because the repository has no ESLint config file.
- Gradle reports deprecated features that may be incompatible with Gradle 9.0.
- `npx expo config --type public` exits successfully but prints no config in this environment.

## Release Readiness

Ready for Play Console internal testing after:

1. Backing up the keystore and local signing properties in a secure vault.
2. Running APK install smoke test on a real Android device or emulator.
3. Preparing Play Store listing assets and legal URLs.
4. Completing Play Console Data Safety and Content Rating forms.
