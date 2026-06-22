import { useState } from 'react';
import { Users, UserPlus, Trash2, Hash, Footprints, ChevronRight, ChevronLeft, Shuffle, Layers } from 'lucide-react';

const MIN_PAIRS = 2;
const MAX_PAIRS = 12;

const blankPair = () => ({ name: '', players: ['', ''] });

/**
 * PairsSetup — the whole setup for Pairs mode in one screen. Every team is
 * exactly two batters; you add as many pairs as you like. Scoring is Runs or
 * Survival (same as Test). Batting order is drawn at random when the match
 * starts, so there's no toss here.
 */
export default function PairsSetup({ initial, onNext, onBack }) {
  const [scoring, setScoring] = useState(initial?.scoring || 'runs');
  const [lastManStanding, setLastManStanding] = useState(initial?.lastManStanding !== false);
  const [pairs, setPairs] = useState(
    initial?.pairs?.length ? initial.pairs.map((p) => ({ name: p.name || '', players: [...(p.players || ['', ''])] })) : [blankPair(), blankPair()]
  );

  const setPair = (i, patch) =>
    setPairs((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setPlayer = (i, slot, value) =>
    setPairs((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, players: p.players.map((n, s) => (s === slot ? value : n)) } : p))
    );
  const addPair = () => setPairs((ps) => (ps.length >= MAX_PAIRS ? ps : [...ps, blankPair()]));
  const removePair = (i) => setPairs((ps) => (ps.length <= MIN_PAIRS ? ps : ps.filter((_, idx) => idx !== i)));

  const submit = (e) => {
    e.preventDefault();
    onNext({ format: 'test', testMode: 'pairs', scoring, lastManStanding, pairs });
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
        <Legend icon={Layers} title="Pairs Rules" />
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
        <div className="mt-4">
          <Label icon={Users}>Last Man Standing</Label>
          <button
            type="button"
            onClick={() => setLastManStanding((v) => !v)}
            className={`relative flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
              lastManStanding
                ? 'border-neon/30 bg-neon/[0.06]'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                lastManStanding ? 'bg-neon' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  lastManStanding ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${lastManStanding ? 'text-neon' : 'text-slate-400'}`}>
                {lastManStanding ? 'On' : 'Off'}
              </span>
              <span className="block text-[11px] leading-snug text-slate-500">
                {lastManStanding
                  ? 'When the first batter is out, their partner bats on alone.'
                  : 'Pair ends on the first dismissal — both sit down together.'}
              </span>
            </span>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Shuffle size={15} className="shrink-0 text-neon" />
          <p className="text-[11px] leading-snug text-slate-400">
            Each pair bats until {lastManStanding ? 'both batters are out' : 'the first batter is out'} (or they declare). Anyone not in the batting pair can bowl.
            Batting order is drawn at random when you start.
          </p>
        </div>
      </section>

      {/* Pairs */}
      <section className="glass p-5">
        <div className="flex items-center justify-between">
          <Legend icon={Users} title={`The Pairs · ${pairs.length}`} />
          <button
            type="button"
            onClick={addPair}
            disabled={pairs.length >= MAX_PAIRS}
            className="btn-press flex items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 px-3 py-2 text-xs font-bold text-neon disabled:opacity-30"
          >
            <UserPlus size={14} />
            Add pair
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {pairs.map((pair, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neon/15 text-xs font-extrabold text-neon ring-1 ring-neon/30">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={pair.name}
                  placeholder={`Pair ${i + 1}`}
                  onChange={(e) => setPair(i, { name: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon/50 focus:ring-2 focus:ring-neon/25"
                />
                <button
                  type="button"
                  onClick={() => removePair(i)}
                  disabled={pairs.length <= MIN_PAIRS}
                  aria-label={`Remove pair ${i + 1}`}
                  className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-crimson disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1].map((slot) => (
                  <input
                    key={slot}
                    type="text"
                    value={pair.players[slot]}
                    placeholder={`Batter ${slot + 1}`}
                    onChange={(e) => setPlayer(i, slot, e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon/50 focus:ring-2 focus:ring-neon/25"
                  />
                ))}
              </div>
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
