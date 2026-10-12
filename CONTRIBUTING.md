# Contributing to KayPhone

Thanks for helping improve KayPhone. Small, focused pull requests are easiest to review and merge.

## Before you start

1. Fork the repository.
2. Clone your fork.
3. Create a branch:

   ```bash
   git checkout -b feature/short-description
   ```

4. Do not commit real Supabase credentials or a `service_role` key.
5. Keep user-facing behavior honest: do not label a local simulation as a real cloud feature.

## Local setup

```bash
cp js/config.example.js js/config.js
# Add your own Supabase URL and anon public key if testing cloud features.
python3 -m http.server 4173
```

Open <http://localhost:4173>.

Supabase is optional for visual work. Cloud features require a project with `supabase/schema.sql` applied.

## Test before opening a PR

Run JavaScript syntax checks:

```bash
for f in js/*.js; do node --check "$f"; done
```

Then manually check the affected flow at both a phone-sized viewport and a laptop-sized viewport:

- Home page swiping and app launch
- Back button and app closing
- Vertical scrolling and touch controls
- Keyboard focus where relevant
- Locked and signed-out states
- Supabase error and empty states

If you add a browser smoke test, keep it deterministic and do not commit screenshots or credentials.

## Code conventions

- Prefer the existing plain JavaScript architecture; do not add a framework for a small feature.
- Use the existing `Apps.<id>` pattern for built-in apps.
- Use `getOrCreateView()` for app surfaces where appropriate.
- Escape user-controlled content with `escapeHtml()` before inserting into `innerHTML`.
- Keep Supabase queries in `js/supabase-client.js` or a clearly scoped data helper.
- Use Row Level Security for every new user-data table.
- Use `localStorage` only for local preferences, not passwords or secrets.
- Keep touch targets large enough for phone use and test mouse/trackpad behavior too.
- Respect `prefers-reduced-motion` and avoid unnecessary animation.

## Database changes

For a new Supabase table:

1. Add an idempotent migration under `supabase/`.
2. Add indexes for the common query path.
3. Enable RLS.
4. Add explicit `select`, `insert`, `update`, and `delete` policies.
5. Use `auth.uid()` for ownership checks.
6. Add Realtime only when the UI actually subscribes to updates.
7. Document the migration in the README.

Never use the Supabase `service_role` key in browser code.

## Pull requests

A good PR includes:

- A short title describing the user-visible result
- Why the change is needed
- What changed
- How it was tested
- Screenshots or a short recording for visual changes
- Any required SQL migration or deployment setting
- Known limitations

Keep unrelated formatting changes out of the same PR.

## Issues

For a bug report, include:

- Browser and device
- Viewport type: phone or laptop
- Exact steps to reproduce
- Expected result
- Actual result
- Console error, if any
- Whether Supabase is configured

For a feature request, explain the user problem and how the feature should behave. A proposed implementation is helpful but optional.

## Security reports

Do not publish credentials, private user data, or an exploitable vulnerability in a public issue. Contact the repository owner privately first.
