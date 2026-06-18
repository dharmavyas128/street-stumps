import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle, CheckCircle2, UserCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Logo from './Logo';

/**
 * AuthScreen — the first thing a visitor sees. Log in or create an account;
 * each account's matches and roster live privately in the cloud. If Supabase
 * isn't wired up yet, shows a short setup note instead of a broken form.
 */
export default function AuthScreen() {
  const { signIn, signUp, configured, enterGuest, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const isLogin = mode === 'login';

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and a password.');
      return;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const fn = isLogin ? signIn : signUp;
      const { data, error: err } = await fn({ email: email.trim(), password });
      if (err) {
        setError(err.message);
      } else if (!isLogin && !data?.session) {
        // Email confirmation is on — no session yet.
        setNotice('Account created! Check your email to confirm, then log in.');
        setMode('login');
      }
      // On success with a session, the auth listener swaps the screen for us.
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="animate-pop-in space-y-6">
        {/* Brand */}
        <div className="relative text-center">
          {/* Soft spotlight + a faint cricket-seam arc curving behind the mark */}
          <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-44 w-60">
            <div className="absolute left-1/2 top-8 h-28 w-28 -translate-x-1/2 rounded-full bg-neon/15 blur-3xl animate-drift" />
            <svg viewBox="0 0 240 176" className="absolute inset-0 h-full w-full text-neon/10" fill="none" stroke="currentColor">
              <path d="M2 150 C 70 140, 170 132, 238 150" strokeWidth="1.5" />
              <g strokeWidth="1" opacity="0.7">
                <line x1="44" y1="143" x2="40" y2="135" /><line x1="84" y1="138" x2="81" y2="130" />
                <line x1="120" y1="136" x2="120" y2="128" /><line x1="156" y1="138" x2="159" y2="130" />
                <line x1="196" y1="143" x2="200" y2="135" />
              </g>
            </svg>
          </div>
          <span className="relative mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-neon/15 text-neon ring-1 ring-neon/30 shadow-glow-green">
            <Logo size={34} />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            STREET <span className="text-neon">STUMPS</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
            Sign in to score & save
          </p>
        </div>

        {!configured ? (
          <SetupNotice />
        ) : (
          <div className="card-hero glass-box p-6">

            {/* Tabs */}
            <div className="mb-5 flex gap-1 rounded-xl neu-inset p-1">
              <TabBtn active={isLogin} onClick={() => { setMode('login'); setError(null); }}>
                Log in
              </TabBtn>
              <TabBtn active={!isLogin} onClick={() => { setMode('signup'); setError(null); }}>
                Sign up
              </TabBtn>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <Field
                icon={Mail}
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                icon={Lock}
                type="password"
                placeholder={isLogin ? 'Password' : 'Create a password (6+ chars)'}
                value={password}
                onChange={setPassword}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-crimson/30 bg-crimson/10 px-3 py-2.5 text-xs text-crimson-soft">
                  <AlertCircle size={15} className="mt-px shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {notice && (
                <div className="flex items-start gap-2 rounded-xl border border-neon/30 bg-neon/10 px-3 py-2.5 text-xs text-neon">
                  <CheckCircle2 size={15} className="mt-px shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-press sheenable flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green ring-1 ring-neon-soft/40 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isLogin ? (
                  <LogIn size={18} strokeWidth={2.5} />
                ) : (
                  <UserPlus size={18} strokeWidth={2.5} />
                )}
                {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500">
              {isLogin ? "New here? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(null); }}
                className="font-semibold text-neon"
              >
                {isLogin ? 'Create an account' : 'Log in'}
              </button>
            </p>
          </div>
        )}

        {configured && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-600">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Google */}
            <button
              onClick={signInWithGoogle}
              className="btn-press flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-slate-200 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Guest */}
            <button
              onClick={enterGuest}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-slate-400 hover:border-white/20 hover:text-slate-200"
            >
              <UserCircle size={16} />
              Continue as Guest
            </button>
            <p className="text-center text-[11px] text-slate-600">
              Quick Match only · nothing is saved
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`neu-press flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
        active ? 'bg-neon text-midnight shadow-glow-green' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ icon: Icon, type, placeholder, value, onChange, autoComplete }) {
  return (
    <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 transition focus-within:border-neon/50 focus-within:ring-2 focus-within:ring-neon/20">
      <Icon size={16} className="shrink-0 text-slate-500" />
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function SetupNotice() {
  return (
    <div className="glass-strong space-y-3 p-6 text-sm text-slate-300">
      <div className="flex items-center gap-2 text-amber-300">
        <AlertCircle size={18} />
        <h2 className="font-bold">Connect your database</h2>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        Accounts are powered by Supabase. To switch it on, create a free project, run the
        schema in <code className="rounded bg-white/10 px-1 text-slate-200">supabase/schema.sql</code>,
        then add your keys to <code className="rounded bg-white/10 px-1 text-slate-200">.env.local</code>:
      </p>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-slate-300">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
      </pre>
      <p className="text-xs text-slate-500">
        Restart the dev server after saving, and this screen becomes a login.
      </p>
    </div>
  );
}
