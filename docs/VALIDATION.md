# Validation in the cloud workspace

Executed on 19 October 2026:

- TypeScript and Expo ESLint: passing.
- Mobile logic: 7 tests passing (fields/dates/colors, free export policy, format sizes, background-removal fallback and result handling).
- Playwright: 2 tests passing at a 390×844 viewport. Exercised Home → sport → system file chooser → consent → details validation → template selection → live preview, both format controls and all three styles, plus privacy navigation. Browser tests do not export native files.
- Laravel: 7 tests / 26 assertions passing. Includes health, malformed uploads, no-key fallback without network access, success/failure/invalid provider response, temporary-file deletion and throttling.
- MySQL 8.4 container healthy; all three Laravel migrations applied and migration status checked.
- Real local HTTP requests: `/api/health` returns `status: ok`; posting a PNG to `/api/background/remove` without a configured provider returns `status: fallback`.
- Expo JavaScript bundles for iOS, Android and web built successfully. These are not signed IPA/APK builds.
- Installation repeated with `npm ci` and locked `composer install`.

Still requiring external/device verification: physical iPhone and Android export PNGs and font rendering, Photos permissions, share sheet, actual provider cutouts with a paid key, EAS signing/store acceptance and the under-60-second usability target. See DEVICE_TESTS.md.

The cloud machine has a local PHP 8.4 runtime and Composer under `/workspace/tooling/php` because system package installation was unavailable. Composer's official GitHub release was downloaded over TLS and its PHAR signature validated. GitHub API archive URLs were blocked here; locked dependency archives were obtained from GitHub's official codeload endpoint at the exact locked commit, integrity-checked and cached under `/workspace/tooling/composer-cache`. Normal developer installations use standard Composer. Expo metadata/docs hosts were also blocked; SDK-matched installs used Expo's bundled version map and installed API sources were inspected. No TLS, package-signature or checksum verification was disabled.

## Expo Go SDK 57 compatibility

The iPhone reports Expo Go 57.0.9 / Supported SDK 57.0.0. The app and all Expo-matched runtime dependencies are now pinned to the SDK 57 line. `npm start` explicitly selects Expo Go; development builds use `npm run start:dev`. The served iOS manifest reports `sdkVersion: 57.0.0`. The dynamic route uses `[page]`, avoiding the React Navigation reserved `screen` parameter. TypeScript, lint, seven logic tests, both UI flows and all three platform bundles pass after this migration. Actual iPhone execution still requires testing on the user device.
