import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, Users, Hand, Disc3, Loader2 } from 'lucide-react';
import { loadPlayers, addPlayer, deletePlayer } from '../storage';
import PlayerForm from './PlayerForm';
import PlayerStatsSheet from './PlayerStatsSheet';

/**
 * MyPlayers — manage a personal roster: add players (name, batting hand,
 * bowling style) and remove them. Synced to your account in the cloud.
 */
export default function MyPlayers({ onBack, onChange }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [viewPlayer, setViewPlayer] = useState(null); // { name, subtitle } | null

  useEffect(() => {
    let on = true;
    loadPlayers()
      .then((list) => on && setPlayers(list))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, []);

  const add = async (data) => {
    setBusy(true);
    try {
      const { list } = await addPlayer(data);
      setPlayers(list);
      onChange?.(list.length);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id) => {
    const list = await deletePlayer(id);
    setPlayers(list);
    onChange?.(list.length);
  };

  return (
    <div className="space-y-4 animate-pop-in">
      <button onClick={onBack} className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300">
        <ChevronLeft size={18} />
        Home
      </button>

      <div className="flex items-center gap-2 px-1">
        <Users size={20} className="text-neon" />
        <h2 className="text-lg font-bold text-white">My Players</h2>
        <span className="ml-auto text-xs text-slate-500">
          {players.length} player{players.length === 1 ? '' : 's'}
        </span>
      </div>

      <section data-tour="players-add" className="glass p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Add a player
        </p>
        <PlayerForm onSubmit={add} submitLabel="Add to roster" busy={busy} />
      </section>

      {loading ? (
        <div className="glass flex items-center justify-center gap-2 p-8 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin text-neon" />
          Loading your roster…
        </div>
      ) : players.length === 0 ? (
        <div className="glass p-5">
          <div className="mb-3 flex items-center justify-center gap-1.5 text-neon">
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
              <path d="M8 18V4M8 4L3 9M8 4L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-semibold text-neon">Add your first player above</span>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-slate-300">Why add players?</p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-neon/60" />Pick them instantly when setting up any match</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-neon/60" />Their batting hand &amp; bowling style auto-fill</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-neon/60" />Stats build up on the Leaderboard over time</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="glass flex items-center gap-3 p-3.5"
            >
              <button
                onClick={() =>
                  setViewPlayer({
                    name: p.name,
                    subtitle: `${p.battingHand === 'left' ? 'Left-hand bat' : 'Right-hand bat'} · ${p.bowlingStyle}`,
                  })
                }
                className="btn-press flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon ring-1 ring-neon/20 text-sm font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{p.name}</p>
                  <p className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Hand size={11} />
                      {p.battingHand === 'left' ? 'Left-hand bat' : 'Right-hand bat'}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Disc3 size={11} />
                      {p.bowlingStyle}
                    </span>
                  </p>
                </div>
              </button>
              <button
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name}`}
                className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-crimson"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <PlayerStatsSheet
        open={!!viewPlayer}
        name={viewPlayer?.name}
        subtitle={viewPlayer?.subtitle}
        onClose={() => setViewPlayer(null)}
      />
    </div>
  );
}
