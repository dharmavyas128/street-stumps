import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { careerStats } from '../leaderboard';
import DiceBearAvatar from './DiceBearAvatar';
import { parseConfig } from '../avatars';
import PlayerStatsCard from './PlayerStatsCard';

/**
 * PlayerStatsSheet — a bottom-sheet that shows one player's career record
 * (stats, form, best performances, achievements). Stats are derived by NAME
 * from this account's saved games, so it works for a friend or a roster player
 * exactly as it does for your own profile.
 */
export default function PlayerStatsSheet({ open, name, subtitle, avatar, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !name) return;
    let on = true;
    setLoading(true);
    setStats(null);
    careerStats()
      .then((all) => {
        if (!on) return;
        setStats(all.find((p) => p.name === name) || null);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [open, name]);

  if (!open) return null;

  const initials = (name || '?').charAt(0).toUpperCase();
  const cfg = parseConfig(avatar);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl animate-slide-up">
        <div className="flex shrink-0 justify-center pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="shrink-0 flex items-center gap-3 px-5 pb-4">
          {cfg ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl ring-1 ring-neon/30">
              <DiceBearAvatar config={avatar} size={48} className="h-full w-full" />
            </div>
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neon/15 text-xl font-extrabold text-neon ring-1 ring-neon/30">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{name}</p>
            {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto px-5 pb-10">
          {loading ? (
            <div className="glass flex items-center justify-center gap-2 rounded-2xl p-8 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin text-neon" />
              Loading stats…
            </div>
          ) : (
            <PlayerStatsCard
              stats={stats}
              emptyMessage={`No stats yet for ${name} — they'll appear once they've played a game you've scored.`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
