// ===================== PROJECT CONFIG =====================
// Paste your own Supabase project's URL and anon (public) key here.
// Find both under: Supabase Dashboard → Project Settings → API.
//
// The anon key is DESIGNED to be public — it goes in client-side
// JS in every Supabase app. It is not a secret. What actually keeps
// your data safe is Row Level Security (enabled by schema.sql for
// every table), which the anon key cannot bypass. Never put your
// `service_role` key here or in any file that ships to the browser.

window.KAYPHONE_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR-ANON-PUBLIC-KEY',
};
