import { useState } from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import PlayerForm from './PlayerForm';
import Logo from './Logo';

/**
 * ProfileSetup — shown once, right after a user first signs in and has no
 * profile yet. They add THEMSELVES as a player (name + batting/bowling). This
 * profile is tied to their account and becomes their "self" identity — pickable
 * as "You" in match setup, and the basis for the friends feature later.
 */
export default function ProfileSetup() {
  const { user, saveProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (data) => {
    setBusy(true);
    setError(null);
    try {
      await saveProfile(data);
      // On success the AuthContext profile updates and the app swaps to Home.
    } catch (e) {
      setError(e?.message || 'Could not save your profile. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-10">
      <div className="animate-pop-in space-y-6">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-neon/15 text-neon ring-1 ring-neon/30 shadow-glow-green">
            <Logo size={34} />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            Welcome to <span className="text-neon">Street Stumps</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Set up your player profile to get started.
          </p>
          {user?.email && (
            <p className="mt-1 text-[11px] text-slate-500">{user.email}</p>
          )}
        </div>

        <section className="glass-strong p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Your player details
          </p>
          <PlayerForm onSubmit={submit} submitLabel="Save & start playing" busy={busy} autoFocus />
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-crimson/30 bg-crimson/10 px-3 py-2.5 text-xs text-crimson-soft">
              <AlertCircle size={15} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </section>

        <button
          onClick={signOut}
          className="btn-press mx-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  );
}
