# npm Audit Release Plan

Audit command:

```powershell
npm audit --json
```

Current result:

```text
32 total vulnerabilities
1 low
9 moderate
22 high
0 critical
```

No `npm audit fix --force` was used.

## Main Findings

### Expo SDK 51 family

Affected direct packages:

- `expo`
- `expo-constants`
- `expo-linking`
- `expo-notifications`
- `expo-router`
- `expo-splash-screen`
- `react-native`

Transitive packages include `@expo/cli`, `@expo/config`, `@expo/config-plugins`,
`@expo/metro-config`, `@expo/plist`, `@xmldom/xmldom`, `tar`, `send`,
`fast-xml-parser`, and React Native CLI packages.

`npm audit` proposes major upgrades such as `expo@55.0.24` and
`react-native@0.85.3`. That is not a safe in-place release fix for this app
because the current native app is on Expo SDK 51, React Native 0.74.5, and React
18.2.0.

Safe recommendation:

1. Keep Expo SDK 51 for this immediate release candidate.
2. Create a separate upgrade branch.
3. Upgrade Expo with the official SDK migration path, one SDK at a time.
4. Run `npx expo install --fix` after each SDK jump.
5. Rebuild Android and retest auth, notifications, splash, secure storage, and offline cache.

### Next.js PWA target

Affected direct package:

- `next@14.2.35`

`npm audit` reports multiple advisories fixed only in newer major versions
according to the current audit database. The PWA is a static export with image
optimization disabled, no custom rewrites, no middleware, and no server runtime
in the Capacitor build, which reduces exposure for several server-side findings.

Safe recommendation:

1. Keep `next@14.2.35` for this release if APK/AAB readiness is the priority.
2. Test a branch with `next@15.5.16` or newer because Next 15 still accepts React 18 peer dependencies.
3. Re-run `npm run pwa:build`, `npx cap sync android`, APK build, and AAB build.
4. Move to Next 16 only after testing React 19 implications for the wider repo.

### next-pwa / Workbox

Affected direct package:

- `next-pwa@5.6.0`

Transitive packages include:

- `workbox-webpack-plugin`
- `workbox-build`
- `rollup-plugin-terser`
- `serialize-javascript`

`npm audit` suggests a downgrade-like major change to `next-pwa@2.0.2`, which is
not a safe or useful correction. The safer route is to replace `next-pwa` with a
maintained fork or a first-party service worker strategy after a dedicated PWA
test pass.

Safe recommendation:

1. Test `@ducanh2912/next-pwa` on a branch.
2. Confirm generated `sw.js`, offline fallback, installability, and static export.
3. Keep the current `next-pwa` setup for this release only if the generated PWA is not exposed as a public self-hosted website.

### Capacitor

Current packages:

- `@capacitor/core@8.3.4`
- `@capacitor/android@8.3.4`
- `@capacitor/cli@8.3.4`
- `@capacitor/splash-screen@8.0.1`
- `@capacitor/status-bar@8.0.1`

No audit vulnerability is currently attributed to Capacitor packages.

Safe recommendation:

1. Patch `@capacitor/status-bar` from `8.0.1` to `8.0.2` in a small branch.
2. Keep core/android/cli aligned on the same Capacitor major.
3. Re-run `npx cap sync android` and both Android builds.

## Package-by-Package Correction Plan

| Package | Safe action | Release risk |
|---|---|---|
| `expo` | Defer to a full SDK upgrade branch, target SDK 55 path | High if done in-place |
| `expo-constants` | Upgrade only through matching Expo SDK | High if done alone |
| `expo-linking` | Upgrade only through matching Expo SDK | High if done alone |
| `expo-notifications` | Upgrade only through matching Expo SDK and retest push | High |
| `expo-router` | Upgrade only through matching Expo SDK | High |
| `expo-splash-screen` | Upgrade only through matching Expo SDK and retest splash | High |
| `react-native` | Do not jump to 0.85 in this release; upgrade through Expo | High |
| `next` | Test Next 15 branch before adoption | Medium |
| `next-pwa` | Test maintained fork or custom SW branch | Medium |
| `postcss` | Comes through Next/Expo; do not override blindly | Medium |
| `tar` | Comes through Expo CLI; resolve through Expo SDK upgrade | Medium |
| `send` | Comes through Expo CLI; resolve through Expo SDK upgrade | Low |
| `fast-xml-parser` | Comes through RN CLI; resolve through RN/Expo upgrade | Medium |
| `serialize-javascript` | Comes through Workbox chain; resolve by replacing PWA plugin | Medium |
| `workbox-*` | Replace/update PWA plugin after verification | Medium |

## Commands for Future Safe Fix Branches

Next/PWA branch:

```powershell
npm install next@15.5.16 @ducanh2912/next-pwa@latest
npm run pwa:build
npx cap sync android
npm run capacitor:build:apk
npm run capacitor:build:aab
npm audit
```

Expo branch:

```powershell
npx expo install expo@latest
npx expo install --fix
npm run type-check
npm run android
npm audit
```

Do not merge either branch until device testing passes.
