/**
 * supabase.js — the single Supabase client for the whole app.
 *
 * Configuration comes from Vite env vars (set in `.env.local`):
 *   VITE_SUPABASE_URL       — your project URL
 *   VITE_SUPABASE_ANON_KEY  — the public anon key (safe to ship in the client;
 *                             Row-Level Security keeps each user's data private)
 *
 * If the keys aren't set yet, `supabase` is null and `isSupabaseConfigured` is
 * false — the app then shows a friendly "connect Supabase" screen instead of
 * crashing, so it still builds and runs before you've wired your project.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
