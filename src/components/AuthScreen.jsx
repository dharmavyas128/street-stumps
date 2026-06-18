import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Logo from './Logo';

/**
 * AuthScreen — the first thing a visitor sees. Log in or create an account;
 * each account's matches and roster live privately in the cloud. If Supabase
 * isn't wired up yet, shows a short setup note instead of a broken form.
 */
export default function AuthScreen() {
  const { signIn, signUp, configured } = useAuth();
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
