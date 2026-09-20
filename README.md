# KayPhone OS — Pro Max

An iOS-style phone UI built for a portfolio: real accounts, real
2-way chat, real file/photo/voice storage, real weather — backed by
Supabase. No FiveM dependency, no fake demo data standing in for
features that don't work yet.

## Quick start

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste in the entire contents of
   `supabase/schema.sql` → Run. This creates every table, storage
   bucket, and security policy the app needs.
3. Go to **Authentication → Providers → Email** → enable password
   sign-ins. Because this Kay-only setup does not use Resend or a custom
   domain, disable **Confirm email** for now. KayPhone maps a public ID
   such as `goold.kay` to a hidden internal Supabase Auth identifier; users
   never log in with that internal value.
4. Go to **Project Settings → API** → copy your **Project URL** and
   **anon public key** into `js/config.js`.
5. Open `index.html` in a browser (or deploy it — see below). Done.

Until step 4 is done, KayPhone remains usable as a local UI preview. Once
Supabase is configured, the phone requires a Kay ID and password and every
real-data app (Messages, Photos, Notes, Reminders, Calendar, Voice Memos,
Files) uses the signed-in account instead of an anonymous session.

## What's actually real vs. what's a UI demo

**Real, backed by Supabase:**
| App | What's real |
|---|---|
| Messages | Live 2-way chat over Supabase Realtime. Join a room name, open the site in a second tab/device, join the same room — messages sync instantly. Public rooms by design (like a Slack channel), so it works for any visitor without you setting up contacts. |
| Photos | Real upload to Storage, real gallery, real delete. Camera captures save here too. |
| Camera | Real `getUserMedia` webcam feed and capture — was already real, untouched. |
| Voice Memos | Real mic recording (`MediaRecorder`), real measured duration, uploaded to Storage. |
| Notes | Real per-visitor CRUD, autosaves as you type, persists across visits on the same browser. |
| Reminders | Real per-visitor CRUD. |
| Calendar | Real per-visitor events, persisted. |
| Files | Real listing of whatever's actually in your Storage bucket — real names, real byte sizes, real download links. |
| Weather | Real live data from Open-Meteo, using your browser's geolocation with an IP-location fallback if you deny it. Already real before this pass — just removed the fake "72°" fallback that showed when both failed. |
| Maps | Real Leaflet map — untouched, already real. |

**Intentionally left as a UI showcase, not wired to a backend:**
| App | Why |
|---|---|
| Phone (dialer/calls) | An actual phone call needs a telephony provider (Twilio, etc.) — a paid service with its own account and a server component, which doesn't fit a static portfolio site. The dialer UI and a "recent calls" *log* are real interactions; the call itself is simulated. If you want this real, Twilio Voice's JS SDK is the standard path — ask and I can wire it in. |
| Stocks | Free real-time stock APIs need a server-side proxy to keep API keys out of client JS and to survive rate limits from every visitor sharing one key. Doable, just a separate small serverless function — flag if you want it. |
| KayBook / KayChat / KayTok / KayTube / KayGram / KayPay | Stylized visual mockups of well-known apps, in the spirit of Apple's own demo content. Not functional networks — turning any one of these into a real product is its own multi-week build, not a "wire it to a table" job. Left as-is; happy to build one out for real if you pick a specific one. |

## Security

- **The anon key in `js/config.js` is meant to be public.** Every
  Supabase client app ships it in browser JS — it's not a secret.
  What actually protects your data is **Row Level Security**, which
  `schema.sql` enables on every table: each visitor's Notes,
  Reminders, Calendar, and Storage files are readable and writable
  only by that visitor's own account (`auth.uid()`), enforced by
  Postgres itself, not by the client code. Never put your
  `service_role` key in this app.
- **XSS**: every chat message, note, reminder, and file name that
  comes from a user (yours or another visitor's) is HTML-escaped
  before it's inserted into the page (`js/security.js`). This
  matters most for Messages, since room content is genuinely shared
  between strangers.
- **Room names** are restricted to lowercase letters, numbers, `-`
  and `_` — enforced both client-side and with a Postgres check
  constraint, so it can't be bypassed by calling the API directly.
- **CSP**: `index.html` ships a Content-Security-Policy meta tag
  scoping script/style/connect sources to exactly what the app uses
  (Supabase, Open-Meteo, ipapi.co, OpenStreetMap tiles, Google's
  embed used by the Safari app). One known gap: it allows
  `'unsafe-inline'` for scripts, because the existing UI relies
  heavily on inline `onclick="..."` handlers throughout. Closing
  that gap means migrating those to `addEventListener` calls — a
  real but separate refactor; flag it if you want that hardened
  further before this goes live somewhere with real user data.
- Every Storage bucket is **private** (not public) — files are only
  reachable via short-lived signed URLs generated per request, not
  permanent public links.

## Deploying

This is a static site (HTML/CSS/JS, no build step) — any static
host works:
- **Netlify / Vercel**: drag-and-drop the `kayphone/` folder, or
  connect the repo. Zero config needed.
- **GitHub Pages**: push this folder to a repo, enable Pages on the
  branch.

`js/config.js` ships with your real Supabase URL and anon key in it
— that's fine to commit (see Security above), but if you'd rather
keep it out of git history, add `js/config.js` to `.gitignore` and
have your host inject it, or just leave a `config.example.js` in the
repo and keep the real one local/uploaded directly to your host.

## Folder structure

```
kayphone/
├── index.html
├── README.md
├── supabase/
│   └── schema.sql          run this once in the Supabase SQL Editor
├── css/
│   └── style.css
└── js/
    ├── config.js            YOUR Supabase URL + anon key go here
    ├── security.js          escapeHtml/escapeAttr — XSS-safe rendering
    ├── supabase-client.js   client, auth, and all data-access helpers (Supa.*)
    ├── storage.js           IndexedDB storage layer (custom-app HTML blobs)
    ├── gestures.js          swipe/gesture detection system
    ├── data.js              default app layout + local UI prefs (wallpaper etc.)
    ├── navigation.js        sub-page navigation / click delegation
    ├── status-bar.js        clock, battery, wallpaper, dynamic island
    ├── lock-screen.js       lock/unlock, Face ID
    ├── home-screen.js       home grid, app launcher, app switcher
    ├── system-ui.js         spotlight, control center, notifications, passcode, weather fetch
    ├── app-view.js          generic app window system + assistant
    ├── apps-core.js         Phone, Messages (real chat), Safari, Music, Photos (real)
    ├── apps-media-utility.js   Camera (real), Maps, Weather (real), Calendar (real)
    ├── apps-productivity.js   Notes (real), Reminders (real), Calculator, Voice Memos (real), Files (real)
    ├── settings.js          passcode change + full settings engine
    ├── store-social.js      App Store, Stocks (demo), Games, social apps (demo)
    ├── interactions.js      horizontal page swipe, file uploads (real), app mgmt
    ├── boot-hardware.js     boot sequence, volume/power/hardware buttons
    ├── ui-extras.js         notification banners, quick actions, app library
    └── focus-recording.js   Focus modes, screen recording, haptics
```

## What was fixed this pass

`showFocusSheet()` had an unterminated string and a dangling `+` in
a `sheet.innerHTML` assignment, and referenced two elements
(`#focusOptionsGrid`, `#focusTurnOff`) that were never written to
the DOM. Since the whole app lived in one `<script>` tag, that
syntax error broke everything defined after it — now split across
files (see above) so one broken function can't take down the app,
and the function itself is fixed and working.

## Premium polish pass — September 2026

This pass repaired a visible Control Center markup regression that was leaving a literal input fragment on screen instead of rendering the brightness control. It also adds a theme color and page description for installed/mobile contexts, accessible labels and focus states for key controls, a keyboard-focusable Dynamic Island, a styled volume slider, improved glass/depth treatment across the shell, and `prefers-reduced-motion` support. Notification titles, bodies, icons, timestamps, and ids are now escaped before rendering so shared notification content cannot inject markup.

## Ecosystem and Settings expansion — September 2026

Kay Store now behaves like an ecosystem rather than a file drop: it includes searchable, categorized discovery for Productivity, Creative, Games, Social, and Utilities; curated KayPhone Originals; one-tap Add to Home actions; Open/Preview/Install/Delete flows; result counts; and metadata for uploaded HTML apps, including inferred category, version, and file size. Custom apps still run in the existing sandboxed iframe and persist through IndexedDB.

Settings now includes a native search field that filters the live settings sections, plus working device-experience panels inspired by the strongest Apple and Samsung patterns: Modes & Routines, Link to Windows, Secure Folder, Digital Wellbeing, Edge Panels, and Smart Home. These are honest local simulations with persistent toggles and action feedback, ready for deeper integrations later.

## Kay AI assistant — September 2026

Kay AI now opens as a full assistant panel with conversation history, quick prompts, text input, microphone input through the browser SpeechRecognition API when supported, and spoken responses through SpeechSynthesis. Its local command engine can open installed apps, report time/date/weather/battery, toggle Focus, adjust volume, toggle the flashlight, lock the phone, answer capability questions, and provide safe fallback guidance. The assistant is marked **Private by design** because this static build does not ship a secret cloud API key; a hosted model can be connected later through a server-side proxy without changing the phone UI.

The desktop experience also supports visible pointer feedback on app tiles and mouse/trackpad drag gestures between Home pages. Touch gestures remain supported on phones.

## KayWidget app integration — September 2026

The supplied `mywidgetflow.vercel.app` widget is available as a first-class **KayWidget** app on Home page 3. It opens with a KayPhone app header and loads widget ID `1ff01cfdc900` inside a sandboxed iframe. The isolation prevents the third-party widget’s global DOM and CSS from covering the KayPhone shell or other apps. The widget host was added to the page Content-Security-Policy, and the app shows the widget’s own loading state before its external script renders.

## Kay ID accounts — September 2026

Configured deployments now show a Kay ID gate instead of silently creating anonymous users. A user signs up or signs in with a public ID such as `goold.kay` and a password; an optional recovery email can be saved privately on the profile, but it is not used as the login name. Supabase Auth owns the password and persistent session, while `profiles.kay_id` is protected by a unique database index and the private Auth UUID remains the owner key for Row Level Security.

Sessions persist through refreshes, browser restarts, and laptop restarts because Supabase Auth stores and refreshes the session locally. A new browser/device, cleared site data, manual sign-out, or the **Erase Local Device Data** action requires sign-in again. The reset action clears local preferences and custom-app IndexedDB but does not delete cloud data. Password reset email delivery is intentionally not claimed as functional until an email provider is configured; with the current no-domain/no-Resend setup, disable Supabase **Confirm email** and treat the optional recovery email as stored recovery metadata only.

## Adding a new real feature

1. Add a table to `supabase/schema.sql` (copy the `notes` table's
   RLS pattern for anything per-user) and re-run it.
2. Add a helper in `js/supabase-client.js` — for a simple per-user
   table, `userTable('your_table')` gives you `list/insert/update/remove`
   for free.
3. Build the UI in the matching `js/apps-*.js` file, calling
   `Supa.yourThing.list()` etc. Always run user-supplied text
   through `escapeHtml()` before it goes into `innerHTML`.
