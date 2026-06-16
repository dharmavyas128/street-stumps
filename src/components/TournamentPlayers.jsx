import { useState, useEffect } from 'react';
import { Users, ChevronRight, ChevronLeft, Eraser, Crown, UserCircle } from 'lucide-react';
import { loadPlayers, addPlayer } from '../storage';
import { useAuth } from '../auth/AuthContext';
import { withSelf } from '../selfPlayer';
import PlayerPickerModal from './PlayerPickerModal';

/**
 * TournamentPlayers — pick a roster for every team (tap a slot → choose from
 * your saved players or add a new one), just like 1v1 and series. Empty slots
 * fall back to "Batter N" in the engine.
 */
export default function TournamentPlayers({ teamNames, playersPerTeam, onBack, onCreate }) {
  const { profile } = useAuth();
  const [roster, setRoster] = useState([]);
  const pickerRoster = withSelf(roster, profile);
  const [picks, setPicks] = useState(() =>
    teamNames.map(() => Array.from({ length: playersPerTeam }, () => null))
  );
  const [captains, setCaptains] = useState(() => teamNames.map(() => null));
  const [editing, setEditing] = useState(null); // { team, idx } | null

  useEffect(() => {
    let on = true;
    loadPlayers().then((list) => on && setRoster(list)).catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  const takenIds = new Set();
  picks.forEach((team) => team.forEach((p) => p?.id && takenIds.add(p.id)));

  const setPick = (team, idx, player) =>
    setPicks((prev) => prev.map((t, ti) => (ti === team ? t.map((p, pi) => (pi === idx ? player : p)) : t)));

  const toggleCaptain = (team, idx) =>
    setCaptains((prev) => prev.map((c, ti) => (ti === team ? (c === idx ? null : idx) : c)));

  const clearTeam = (team) => {
    setPicks((prev) => prev.map((t, ti) => (ti === team ? t.map(() => null) : t)));
    setCaptains((prev) => prev.map((c, ti) => (ti === team ? null : c)));
  };

  const handlePick = (player) => {
    setPick(editing.team, editing.idx, player);
    setEditing(null);
  };
  const handleCreate = async (data) => {
    const target = editing;
    const { list, player } = await addPlayer(data);
    setRoster(list);
    setPick(target.team, target.idx, player);
    setEditing(null);
  };
  const handleClearSlot = () => {
    setPick(editing.team, editing.idx, null);
    setEditing(null);
  };

  const create = () => {
    const rosters = picks.map((team) => team.map((p) => p?.name || ''));
    onCreate({ rosters, captains });
  };

  return (
    <div className="space-y-4 animate-pop-in">
      {teamNames.map((name, ti) => (
        <section key={ti} className="glass p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon/10 text-neon ring-1 ring-neon/30">
                <Users size={18} />
              </span>
              <h2 className="truncate text-sm font-semibold uppercase tracking-widest text-slate-200">{name}</h2>
            </div>
            <button
              onClick={() => clearTeam(ti)}
              className="btn-press flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400"
            >
              <Eraser size={12} />
              Clear
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {picks[ti].map((player, si) => {
              const isCaptain = captains[ti] === si;
              return (
                <div key={si} className="flex items-center gap-2">
                  <span className="scoreboard grid h-10 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-400">
                    {si + 1}
                  </span>
                  <button
                    onClick={() => setEditing({ team: ti, idx: si })}
                    className="btn-press flex h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-left transition hover:border-neon/40 hover:bg-neon/5"
                  >
                    <UserCircle size={16} className={player ? 'text-neon' : 'text-slate-500'} />
                    {player ? (
                      <span className="truncate text-sm font-medium text-slate-100">{player.name}</span>
                    ) : (
                      <span className="text-sm text-slate-500">Select player</span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleCaptain(ti, si)}
                    title={isCaptain ? 'Captain' : 'Make captain'}
                    className={`btn-press grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${
                      isCaptain
                        ? 'border-amber-300/40 bg-amber-300/15 text-amber-300 shadow-glow-amber'
                        : 'border-white/10 bg-white/[0.03] text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Crown size={16} fill={isCaptain ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          onClick={onBack}
          className="btn-press flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-semibold text-slate-200"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={create}
          className="btn-press flex items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
        >
          Create Tournament
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      <PlayerPickerModal
        open={!!editing}
        roster={pickerRoster}
        takenIds={takenIds}
        currentId={editing ? picks[editing.team][editing.idx]?.id ?? null : null}
        onPick={handlePick}
        onCreate={handleCreate}
        onClear={handleClearSlot}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
