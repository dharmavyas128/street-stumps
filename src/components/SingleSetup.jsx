import { useState } from 'react';
import { User, UserPlus, Trash2, Hash, Footprints, ChevronRight, ChevronLeft, Shuffle, Layers } from 'lucide-react';

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 24;

/**
 * SingleSetup — solo mode setup. Every player is their own side: just a flat
 * list of names. Scoring is Runs or Survival. Batting order is drawn at random
 * on start, and everyone except the batter can bowl. Highest score wins.
 */
export default function SingleSetup({ initial, onNext, onBack }) {
  const [scoring, setScoring] = useState(initial?.scoring || 'runs');
  const [players, setPlayers] = useState(
    initial?.players?.length ? [...initial.players] : ['', '']
  );

  const setPlayer = (i, value) => setPlayers((ps) => ps.map((n, idx) => (idx === i ? value : n)));
  const addPlayer = () => setPlayers((ps) => (ps.length >= MAX_PLAYERS ? ps : [...ps, '']));
  const removePlayer = (i) =>
    setPlayers((ps) => (ps.length <= MIN_PLAYERS ? ps : ps.filter((_, idx) => idx !== i)));

  const submit = (e) => {
    e.preventDefault();
    onNext({ format: 'test', testMode: 'single', scoring, players });
  };

  return (
    <form onSubmit={submit} className="space-y-4 animate-pop-in">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300"
        >
          <ChevronLeft size={18} />
          Modes
        </button>
      )}

      {/* Scoring */}
      <section className="glass p-5">
        <Legend icon={Layers} title="Single Rules" />
        <div className="mt-4">
          <Label icon={scoring === 'survival' ? Footprints : Hash}>Scoring</Label>
          <SegToggle
            options={[
              { value: 'runs', label: 'Runs' },
              { value: 'survival', label: 'Survival' },
            ]}
            value={scoring}
            onChange={setScoring}
          />
          <p className="mt-1.5 px-1 text-[11px] text-slate-500">
            {scoring === 'survival'
              ? 'Every delivery faced is worth 1 point — survive to win. Runs are still recorded on the scorecard.'
              : 'Standard scoring — runs decide who tops the table.'}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Shuffle size={15} className="shrink-0 text-neon" />
          <p className="text-[11px] leading-snug text-slate-400">
            Everyone bats once until they're out (or they declare). Anyone except the batter can bowl.
            Batting order is drawn at random when you start.
          </p>
        </div>
      </section>

      {/* Players */}
      <section className="glass p-5">
        <div className="flex items-center justify-between">
          <Legend icon={User} title={`Players · ${players.length}`} />
          <button
            type="button"
            onClick={addPlayer}
            disabled={players.length >= MAX_PLAYERS}
            className="btn-press flex items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 px-3 py-2 text-xs font-bold text-neon disabled:opacity-30"
          >
            <UserPlus size={14} />
            Add player
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {players.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neon/15 text-xs font-extrabold text-neon ring-1 ring-neon/30">
                {i + 1}
              </span>
              <input
                type="text"
                value={name}
                placeholder={`Player ${i + 1}`}
                onChange={(e) => setPlayer(i, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon/50 focus:ring-2 focus:ring-neon/25"
              />
              <button
                type="button"
                onClick={() => removePlayer(i)}
                disabled={players.length <= MIN_PLAYERS}
                aria-label={`Remove player ${i + 1}`}
                className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-crimson disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="btn-press sheenable w-full rounded-2xl bg-neon py-4 text-center text-base font-bold text-midnight shadow-glow-green ring-1 ring-neon-soft/40"
      >
        <span className="inline-flex items-center justify-center gap-2">
          Start Match
          <ChevronRight size={20} strokeWidth={2.5} />
        </span>
      </button>
    </form>
  );
}

/* ---------------- Small presentational primitives ---------------- */

function Legend({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon/10 text-neon ring-1 ring-neon/30">
        <Icon size={18} />
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-200">{title}</h2>
    </div>
  );
}

function Label({ children, icon: Icon }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
      {Icon && <Icon size={13} />}
      {children}
    </span>
  );
}

function SegToggle({ options, value, onChange }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl neu-inset p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`neu-press truncate rounded-lg px-2 py-2 text-sm font-semibold transition-colors duration-200 ${
              active ? 'bg-neon/[0.14] text-neon ring-1 ring-neon/40 shadow-glow-green' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
