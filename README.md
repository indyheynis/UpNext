# PlayerHype

**Your game. Your moment. Your hype.** A local-first sports poster app for adult US athletes, built with React Native, Expo and TypeScript, with an optional Laravel API and MySQL development database.

## Implemented MVP

- Home, Choose Sport, Upload Photo, Player Details, Choose Template, live Editor, Export & Share, My Creations, Settings / Privacy.
- Football and basketball; original Cinematic, Dark and Neon vector templates, sport markings, team colors, player and game information.
- System photo picker, local JPEG normalization, photo-rights acknowledgement, optional consent-based background removal. No generative changes to people.
- A shared SVG composition for preview and native PNG rendering at **1080×1920** and **1080×1350**. App-private storage of PNGs, editable data and source images.
- Native Photos saving and share sheet; local library with editing, repeat exports and deletion.
- First poster free, including edits and repeated exports. Other new poster exports are blocked with an explanation. No fictional purchases or subscription flow.
- Laravel upload validation, rate limits, replaceable remove.bg adapter, private temporary processing and original-photo fallback.

The mobile workflow needs no account, database or paid API key. There is no bundled AI segmentation model: the fallback preserves the whole original photo in a designed frame. The under-60-second goal still needs usability measurement on phones with athletes.

## Run the mobile app

Use Node 24, npm and Expo Go compatible with the pinned SDK 57, or an Expo preview build.

```sh
cd mobile
npm ci
npm start
```

`npm start` explicitly targets Expo Go. Use `npm run start:dev` only with an installed development build.

Scan the QR code on an iPhone/Android on the same network. `npm run ios` requires macOS/Xcode; `npm run android` requires an Android emulator/device and SDK. `npm run web` supports UI development; native PNG rendering, photo permissions and sharing require devices.

For an installable preview, configure your own Expo project and app identifiers in `app.json`, then run `npx eas-cli build --profile preview --platform android` (or `ios`). Apple signing/registered devices may be needed for iOS internal distribution. Nothing has been submitted or published. The development profile includes `expo-dev-client`; use it when developing with native modules outside Expo Go.

To enable the optional API, copy `mobile/.env.example` to `mobile/.env`, set `EXPO_PUBLIC_API_URL`, and restart Metro. Physical devices need the server's LAN address, not `localhost`. Deployed builds must use HTTPS. **Never put provider secrets in `EXPO_PUBLIC_*`.**

## Laravel and MySQL

Use PHP **8.4+**, Composer 2, PDO/MySQL, mbstring, fileinfo, curl, DOM/XML extensions, and MySQL 8.4 (or Docker Compose). Isolated API tests use the Laravel test configuration without requiring MySQL.

```sh
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Create a MySQL database and dedicated user and fill `DB_*` in `backend/.env`. For Docker, create a root `.env` with your own `DB_PASSWORD` and `DB_ROOT_PASSWORD` (both ignored), and use the same user password in `backend/.env`. Then:

```sh
# Repository root
docker compose up -d --wait mysql
cd backend
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

The included database/user are both named `playerhype`. MySQL is only exposed on loopback and uses a persistent Docker volume. The mobile MVP does not send player data to MySQL; standard Laravel migrations prepare future account infrastructure. The cutout API uses file-based cache and does not require the database.

### Background removal

In `backend/.env`, set `CUTOUTS_ENABLED=true` and securely supply `REMOVE_BG_API_KEY`, then run `php artisan config:clear`. The fixed destination is `https://api.remove.bg/v1.0/removebg`. Users must enable upload consent and tap Remove background. Provider charges and retention terms apply. Provider responses were tested with HTTP fakes, not a paid live key.

Uploads must be actual JPG/PNG, ≤10 MB, dimensions ≤6000×6000. Set PHP `upload_max_filesize=12M`, `post_max_size=13M`. Laravel returns a base64 PNG with `Cache-Control: no-store, private`, deletes its temporary upload, and does not create public photo URLs or database records. It does not log photos, credentials or upstream response bodies. Missing keys, timeouts and provider failures return `{"status":"fallback"}`; the phone retains its original photo.

The anonymous endpoint is for local MVP development. Before enabling a paid provider publicly, add authenticated/app-attested requests, per-user quotas, a shared rate-limit cache and operational spend limits. Current limits: 5/minute/IP and `CUTOUTS_DAILY_LIMIT`/day globally. A shared secret embedded in the app is not a substitute for authentication.

## Validation

```sh
cd mobile
npm run typecheck
npm run lint
npm test
npm run test:ui
npx expo export --platform all
cd ../backend
php artisan test
```

Playwright uses system Chromium when present; otherwise run `npx playwright install chromium`. Override with `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when needed. The UI suite starts Expo web automatically.

See [docs/DEVICE_TESTS.md](docs/DEVICE_TESTS.md) for required physical-device checks. Successful JavaScript bundles do not prove capture resolution, photo permission behavior, sharing or store acceptance.

## Structure

- `mobile/src/components/PosterCanvas.tsx`: vector renderer, original templates and illustration.
- `mobile/src/domain`: document, dimensions, validation and free-poster policy.
- `mobile/src/services`: private library, replaceable removal provider and future purchase adapter.
- `mobile/src/app`, `mobile/src/screens`: presentation and creation flow.
- `backend/app/Services/Background`: provider contract and remove.bg adapter.
- `backend/tests/Feature`: API validation, fallback, response and cleanup tests.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Accounts/cloud storage, verified Apple/Google purchases, credits, premium templates, youth/parental consent, team profiles, matchup graphics, Senior Night, new sports and animated exports remain future work. They are not represented by pretend working buttons.
