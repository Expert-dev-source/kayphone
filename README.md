# KayPhone OS

**KayPhone is a polished, iOS-inspired phone experience that runs in the browser.** It combines a realistic mobile shell with Kay ID accounts, live Supabase-backed apps, Kay Social, Kay Arcade, Kay AI, a custom app ecosystem, and responsive phone/laptop interaction.

> **Try it locally in under five minutes:** clone the repository, open `index.html`, and optionally connect Supabase for accounts and cloud features.

## Why KayPhone?

KayPhone is useful as a:

- Browser-based phone OS prototype
- Portfolio project for front-end, UX, and Supabase work
- Starting point for a personal mobile-web operating system
- Demonstration of touch, mouse, responsive layout, auth, storage, Realtime, and app architecture
- Community project that can grow through custom Kay apps and social features

## Highlights

- **Kay ID:** users create a unique `name.kay` identity and sign in with a password.
- **Live cloud apps:** Notes, Reminders, Calendar, Messages, Photos, Voice Memos, and Files use Supabase when configured.
- **Kay Social:** KayBook, KayTok, KayTube, and KayGram share live posts, likes, comments, follows, and public Kay profiles.
- **Kay Arcade:** Neon Snake, Stack Rush, and Memory Flip are playable and touch-friendly.
- **Kay AI:** local assistant commands, chat history, voice input when supported, and speech output.
- **Kay Store:** searchable app ecosystem with custom HTML apps running in sandboxed views.
- **KayWidget:** external widget loaded as an isolated first-class app.
- **Responsive interaction:** phone touch gestures, mouse/trackpad page swipes, scrolling, app views, Control Center, lock screen, and desktop pointer feedback.

## Quick start: local preview

### Requirements

- A modern browser
- Python 3, Node.js, or any static-file server
- Supabase is optional for the visual/local preview

### Run it

```bash
git clone YOUR_REPOSITORY_URL
cd kayphone/kayphone
python3 -m http.server 4173
```

Open <http://localhost:4173>.

If you do not have Python, open `index.html` directly, although a local server is recommended because some browser APIs work better over HTTP.

## Enable accounts and cloud features

KayPhone uses **one Supabase project owned by the deployment owner**. Users do not bring their own Supabase URL or key; they create Kay IDs inside your project.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. If you already ran the base schema, run [`supabase/kay-social-migration.sql`](supabase/kay-social-migration.sql) for Kay Social.
4. Go to **Authentication → Providers → Email** and enable password sign-ins.
5. For the current no-domain setup, disable **Confirm email**.
6. Copy `js/config.example.js` to `js/config.js`:

   ```bash
   cp js/config.example.js js/config.js
   ```

7. Edit `js/config.js` with your Supabase **Project URL** and **anon public key**.
8. Refresh KayPhone and create a Kay ID such as `alex.kay`.

The anon key is intended to be present in browser code. **Never put a Supabase `service_role` key in this project.** Row Level Security is the protection boundary.

### What is shared and what is private?

Shared with authenticated KayPhone users:

- KayBook, KayTok, KayTube, and KayGram posts
- Likes, comments, follows, and public Kay IDs
- KayChat rooms and messages, according to the room design

Private to the owning Kay account:

- Password and recovery email
- Notes, Reminders, Calendar events
- Private files, photos, and voice memos
- Account settings and local device data

## Deploy to Vercel

KayPhone is a static site with no build step.

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project**.
3. Import the GitHub repository.
4. Set the project root to the folder containing `index.html` (usually `kayphone`).
5. Leave the framework preset as **Other** or **Static HTML**.
6. Deploy.
7. Configure `js/config.js` in the repository with your Supabase URL and anon public key, then push a new commit when you change it.

Every push to the connected GitHub branch triggers a new Vercel deployment.

> Vercel environment variables named `SUPABASE_URL` and `SUPABASE_ANON_KEY` do not automatically appear in this plain static browser app. The current implementation reads `window.KAYPHONE_CONFIG` from `js/config.js`. A future build step can inject environment variables if you want to keep configuration out of source files.

## Home screen map

| Home page | Apps |
|---|---|
| Page 1 | Phone, Messages, Safari, Music, KayBook, KayChat, KayTok, KayTube, KayGram, KayPay |
| Page 2 | Photos, Camera, Maps, Weather, Calendar, Clock, Notes, Reminders |
| Page 3 | Calculator, Voice Memos, Files, Settings, Kay Store, Health, Stocks, Kay Arcade, Kay AI, KayWidget |

Swipe horizontally or use the page dots to navigate.

## Feature truth

### Backed by Supabase or a real browser API

- Kay ID authentication and persistent sessions
- Messages and Realtime room updates
- Kay Social posts, likes, comments, follows, and public profiles
- Photos and Camera capture
- Voice Memo recording
- Notes, Reminders, and Calendar persistence
- Files storage and signed downloads
- Weather via Open-Meteo and browser/IP location fallback
- Maps via Leaflet and OpenStreetMap
- Kay Arcade gameplay
- Browser speech recognition/speech synthesis where supported

### Intentionally local or simulated

- Phone calls: the dialer and recent-call log work, but real calls require a telephony provider such as Twilio.
- KayPay: the UI is a prototype; real payments require a payment provider, server-side controls, fraud protection, and compliance work.
- Stocks: the screen is a prototype until a rate-limited server-side market-data source is selected.
- Some device controls: flashlight, hardware buttons, Face ID, and similar features are browser-safe simulations.

The project aims to be honest about what is functional instead of presenting scripted demo data as a real backend.

## Project structure

```text
kayphone/
├── index.html
├── README.md
├── CONTRIBUTING.md
├── css/style.css
├── supabase/
│   ├── schema.sql
│   └── kay-social-migration.sql
└── js/
    ├── config.js              local Supabase URL + anon key
    ├── config.example.js      safe configuration template
    ├── security.js             escaping helpers
    ├── supabase-client.js     auth, storage, Realtime, and social helpers
    ├── data.js                 app catalog and local state
    ├── home-screen.js          home pages and launcher
    ├── apps-core.js            Phone, Messages, Safari, Music, Photos
    ├── apps-media-utility.js   Camera, Maps, Weather, Calendar
    ├── apps-productivity.js    Notes, Reminders, Calculator, Files
    ├── store-social.js         Kay Store, Kay Arcade, Kay Social apps
    ├── app-view.js             generic app views and Kay AI
    └── settings.js              Settings and Kay ID controls
```

## Roadmap

Good next contributions include:

- Kay Social media upload and image/video previews
- Direct-message conversations separate from public rooms
- Server-side environment-variable injection for Vercel
- Automated browser tests in GitHub Actions
- More Kay Arcade games and saved leaderboards
- Accessible keyboard navigation audit
- Offline-first sync and installable PWA support
- Real payment and telephony integrations behind secure server APIs

## Stability pass — October 2026

The static deployment was audited by launching all 28 built-in app IDs in a phone-sized browser viewport. The pass restored missing module files that were returning 404s (`apps-media-utility.js`, `apps-productivity.js`, `gestures.js`, `status-bar.js`, `ui-extras.js`, and `focus-recording.js`), restored the Camera, Maps, Weather, Calendar, Clock, Notes, Reminders, Calculator, Voice Memos, and Files surfaces, and fixed a Clock timer cleanup error that could update a removed DOM node. JavaScript syntax checks and the full app launch audit now pass without page errors. Safari’s external Google navigation is the only expected external request in the audit.

## Suggested GitHub topics

Add these from the repository page under **About → Settings → Topics**:

`javascript` `html` `css` `supabase` `vercel` `web-app` `mobile-web` `ios-ui` `browser-os` `progressive-web-app` `open-source` `kayphone`

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Bug reports and focused feature proposals are welcome.

## Security

- Never commit a Supabase `service_role` key.
- Keep Row Level Security enabled for every user-data table.
- Escape user-generated content before inserting it into HTML.
- Treat third-party widgets and custom apps as untrusted content; keep them sandboxed.
- Report a security issue privately to the repository owner rather than opening a public issue with exploit details.

## License

No license has been selected yet. Until the repository owner adds a license file, default copyright rules apply and reuse is not automatically permitted.
