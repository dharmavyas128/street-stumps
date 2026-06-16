import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, Users, Hand, Disc3, Loader2 } from 'lucide-react';
import { loadPlayers, addPlayer, deletePlayer } from '../storage';
import PlayerForm from './PlayerForm';

/**
 * MyPlayers — manage a personal roster: add players (name, batting hand,
 * bowling style) and remove them. Synced to your account in the cloud.
 */
export default function MyPlayers({ onBack, onChange }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

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

      <section className="glass p-5">
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
        <div className="glass flex flex-col items-center gap-2 p-8 text-center">
          <Users size={30} className="text-slate-600" />
          <p className="text-sm text-slate-400">No players yet.</p>
          <p className="text-xs text-slate-500">
            Add players above — they'll appear when you pick teams.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="glass flex items-center gap-3 p-3.5"
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
    </div>
  );
}
