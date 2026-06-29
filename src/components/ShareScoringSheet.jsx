import { useEffect, useState } from 'react';
import { X, Loader2, UserPlus, Check, Radio, Users } from 'lucide-react';
import { listFriends } from '../data/db';
import DiceBearAvatar from './DiceBearAvatar';
import { parseConfig } from '../avatars';

/**
 * ShareScoringSheet — bottom-sheet for the match owner to hand a friend live
 * co-scoring rights. Pick one friend and they can score from their own device;
 * the two scoreboards stay in sync. Only the owner can save/delete the game.
 */
export default function ShareScoringSheet({ open, sharedScorer, onShare, onRevoke, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!open) return;
    let on = true;
    setLoading(true);
    listFriends()
      .then((f) => on && setFriends(f))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [open]);

  if (!open) return null;

  const share = async (friend) => {
    setBusyId(friend.friend_id);
    try { await onShare(friend); } finally { setBusyId(null); }
  };
  const revoke = async () => {
    setBusyId('revoke');
    try { await onRevoke(); } finally { setBusyId(null); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl animate-slide-up">
        <div className="flex shrink-0 justify-center pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="shrink-0 flex items-center gap-3 px-5 pb-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-azure/15 text-azure ring-1 ring-azure/30">
            <Radio size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">Share scoring</p>
            <p className="text-xs text-slate-400">Let a friend score this match live from their device</p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          {/* Current co-scorer */}
          {sharedScorer && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-neon/30 bg-neon/[0.08] p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/15 text-neon ring-1 ring-neon/30">
                <Check size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neon">Co-scoring now</p>
                <p className="truncate text-sm font-bold text-white">{sharedScorer.name}</p>
              </div>
              <button
                onClick={revoke}
                disabled={busyId === 'revoke'}
                className="btn-press flex items-center gap-1.5 rounded-xl border border-crimson/40 bg-crimson/15 px-3 py-2 text-xs font-semibold text-crimson-soft disabled:opacity-50"
              >
                {busyId === 'revoke' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Revoke
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin text-neon" />
              Loading friends…
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Users size={30} className="text-slate-600" />
              <p className="text-sm text-slate-400">No friends yet.</p>
              <p className="text-xs text-slate-500">Add a friend from your profile to share scoring.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {!sharedScorer && (
                <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Pick a friend
                </p>
              )}
              {friends.map((f) => {
                const isCurrent = sharedScorer?.id === f.friend_id;
                const cfg = parseConfig(f.avatar);
                return (
                  <button
                    key={f.friend_id}
                    onClick={() => share(f)}
                    disabled={busyId != null || isCurrent}
                    className={`btn-press flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-60 ${
                      isCurrent ? 'border-neon/30 bg-neon/[0.06]' : 'border-white/10 bg-white/[0.04] hover:border-neon/30'
                    }`}
                  >
                    {cfg ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                        <DiceBearAvatar config={f.avatar} size={40} className="h-full w-full" />
                      </div>
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon/15 text-sm font-extrabold text-neon ring-1 ring-neon/30">
                        {(f.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{f.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{f.bowling_style}</span>
                    </span>
                    {busyId === f.friend_id ? (
                      <Loader2 size={16} className="shrink-0 animate-spin text-neon" />
                    ) : isCurrent ? (
                      <Check size={16} className="shrink-0 text-neon" />
                    ) : (
                      <UserPlus size={16} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
