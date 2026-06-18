import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { BATTING_HANDS, BOWLING_STYLES } from '../storage';

/**
 * PlayerForm — capture a player's name, batting hand and bowling style.
 * Reused on the My Players page and inside the in-setup "add new player" flow.
 */
export default function PlayerForm({ onSubmit, submitLabel = 'Add player', autoFocus = false, busy = false, initial }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [battingHand, setBattingHand] = useState(initial?.battingHand ?? 'right');
  const [bowlingStyle, setBowlingStyle] = useState(initial?.bowlingStyle ?? BOWLING_STYLES[0]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, battingHand, bowlingStyle });
    if (!initial) {
      setName('');
      setBattingHand('right');
      setBowlingStyle(BOWLING_STYLES[0]);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>Player name</Label>
        <input
          type="text"
          value={name}
          autoFocus={autoFocus}
          placeholder="e.g. Rohit"
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-base text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-neon/25"
        />
      </div>

      <div>
        <Label>Batting</Label>
        <div className="grid grid-cols-2 gap-1 rounded-xl neu-inset p-1">
          {BATTING_HANDS.map((h) => {
            const active = battingHand === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setBattingHand(h.id)}
                className={`neu-press rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  active ? 'bg-neon/[0.14] text-neon ring-1 ring-neon/40 shadow-glow-green' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Bowling</Label>
        <select
          value={bowlingStyle}
          onChange={(e) => setBowlingStyle(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-base text-slate-100 outline-none transition focus:border-neon/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-neon/25"
        >
          {BOWLING_STYLES.map((s) => (
            <option key={s} value={s} className="bg-surface text-slate-100">
              {s}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!name.trim() || busy}
        className="btn-press sheenable flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-3.5 text-base font-bold text-midnight shadow-glow-green ring-1 ring-neon-soft/40 disabled:opacity-40"
      >
        <UserPlus size={18} strokeWidth={2.5} />
        {submitLabel}
      </button>
    </form>
  );
}

function Label({ children }) {
  return (
    <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}
