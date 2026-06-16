# Connecting Street Stumps to Supabase

Street Stumps now has real accounts: every user signs up, logs in, and gets
their own private matches, tournaments, and roster — synced to the cloud and
available on any device. This takes about 5 minutes to switch on.

## 1. Create a free Supabase project
1. Go to <https://supabase.com> → **Start your project** → sign in.
2. **New project**. Pick a name and a strong database password, choose the
   region nearest you, and wait ~2 min for it to provision.

## 2. Create the tables
1. In your project: **SQL Editor → New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy all of
   it, paste it in, and click **Run**.
3. You should see two tables under **Table Editor**: `games` and `players`.
   Row-Level Security is already enabled, so each user only ever sees their own
   rows.

## 3. Add your keys to the app
1. In Supabase: **Project Settings → Data API** (older UIs: **API**). Copy:
   - **Project URL**
   - the **anon / public** key (NOT the `service_role` key)
2. In the repo, open `.env.local` and paste them in:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
   ```
3. **Restart the dev server** (`npm run dev`) — Vite only reads env files at
   startup. The login screen is now live.

> The anon key is meant to live in the browser; it's safe to commit to a deploy.
> Privacy is enforced by Row-Level Security in the database, not by hiding the key.

## 4. (Optional) Turn email confirmation on/off
By default Supabase emails a confirmation link on sign-up. For quick testing you
can disable it: **Authentication → Providers → Email → turn off "Confirm email"**.
With it on, new users must click the emailed link before their first login (the
app shows a "check your email" message).

## 5. Deploy
The app is still a static site. `npm run build`, then drag `dist/` to
<https://app.netlify.com/drop> (or any static host). Add the same two
`VITE_SUPABASE_*` values as environment variables in your host's settings so the
production build can reach Supabase. One Supabase project serves every visitor,
each with their own login.
