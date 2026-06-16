import { useState, useEffect } from 'react';
import { Users, ChevronRight, ChevronLeft, Eraser, Crown, UserCircle } from 'lucide-react';
import { loadPlayers, addPlayer } from '../storage';
import { useAuth } from '../auth/AuthContext';
import { selfAsPlayer, withSelf } from '../selfPlayer';
import PlayerPickerModal from './PlayerPickerModal';

/**
 * PlayerSetup — Step 2 of the wizard. Tap a slot to pick from your saved
 * roster (or add a new player on the spot), and tap the crown to set a captain.
 * Empty slots fall back to "Batter N" in the engine.
 */
export default function PlayerSetup({
  teamAName,
  teamBName,
  playersPerTeam,
  initialPicks,
  initialCaptains,
  onBack,
  onNext,
}) {
  const seed = (key) => {
    const arr = initialPicks?.[key] || [];
    return Array.from({ length: playersPerTeam }, (_, i) => arr[i] ?? null);
  };

  const { profile } = useAuth();
  const [roster, setRoster] = useState([]);
  const pickerRoster = withSelf(roster, profile);
  const [picks, setPicks] = useState({ A: seed('A'), B: seed('B') });
  const [captains, setCaptains] = useState({
    A: initialCaptains?.A ?? null,
    B: initialCaptains?.B ?? null,
  });
  const [editing, setEditing] = useState(null); // { team, idx } | null

  useEffect(() => {
    let on = true;
    loadPlayers().then((list) => on && setRoster(list)).catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  const takenIds = new Set();
  ['A', 'B'].forEach((t) => picks[t].forEach((p) => p?.id && takenIds.add(p.id)));

  const setPick = (team, idx, player) =>
    setPicks((p) => {
      const next = [...p[team]];
      next[idx] = player;
      return { ...p, [team]: next };
    });

  const toggleCaptain = (team, idx) =>
    setCaptains((c) => ({ ...c, [team]: c[team] === idx ? null : idx }));

  const clearTeam = (team) => {
    setPicks((p) => ({ ...p, [team]: Array.from({ length: playersPerTeam }, () => null) }));
    setCaptains((c) => ({ ...c, [team]: null }));
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

  const finish = () => {
    const names = (t) => picks[t].map((p) => p?.name || '');
    onNext({ players: { A: names('A'), B: names('B') }, captains, picks });
  };

  return (
    <div className="space-y-4 animate-pop-in">
      <TeamRoster
        title={teamAName}
        picks={picks.A}
        captainIdx={captains.A}
        onSlot={(i) => setEditing({ team: 'A', idx: i })}
        onCaptain={(i) => toggleCaptain('A', i)}
        onClear={() => clearTeam('A')}
      />
      <TeamRoster
        title={teamBName}
        picks={picks.B}
        captainIdx={captains.B}
        onSlot={(i) => setEditing({ team: 'B', idx: i })}
        onCaptain={(i) => toggleCaptain('B', i)}
        onClear={() => clearTeam('B')}
        tint="amber"
      />

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          onClick={onBack}
          className="btn-press flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-semibold text-slate-200"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={finish}
          className="btn-press flex items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
        >
          Next: Toss
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

function TeamRoster({ title, picks, captainIdx, onSlot, onCaptain, onClear, tint = 'neon' }) {
  const ring =
    tint === 'amber'
      ? 'text-alert bg-alert/10 ring-alert/30'
      : 'text-neon bg-neon/10 ring-neon/30';
  return (
    <section className="glass p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${ring}`}>
            <Users size={18} />
          </span>
          <h2 className="truncate text-sm font-semibold uppercase tracking-widest text-slate-200">
            {title}
          </h2>
        </div>
        <button
          onClick={onClear}
          className="btn-press flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400"
        >
          <Eraser size={12} />
          Clear
        </button>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Tap a slot to pick a player · tap the{' '}
        <Crown size={11} className="inline -mt-0.5 text-amber-300" /> to set a captain.
      </p>

      <div className="mt-2 space-y-2">
        {picks.map((player, i) => {
          const isCaptain = captainIdx === i;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="scoreboard grid h-10 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-400">
                {i + 1}
              </span>
              <button
                onClick={() => onSlot(i)}
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
                onClick={() => onCaptain(i)}
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
  );
}
