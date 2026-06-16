import { useState } from 'react';
import { Trophy, Users, Timer, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * TournamentSetup — name the teams (3–6) and set the shared rules. Next step
 * picks players per team. Format: round-robin league, then playoffs (semi-finals
 * for 4+ teams, or a 3-team qualifier/eliminator) and a final.
 */
export default function TournamentSetup({ onBack, onNext }) {
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(['', '', '', '', '', '']);
  const [rules, setRules] = useState({
    totalOvers: 6,
    playersPerTeam: 6,
    lastManStanding: false,
    retirementThreshold: 0,
  });

  const setName = (i, v) => setNames((n) => n.map((x, idx) => (idx === i ? v : x)));
  const setRule = (patch) => setRules((r) => ({ ...r, ...patch }));

  const proceed = () => {
    const teamNames = names.slice(0, count).map((n, i) => n.trim() || `Team ${i + 1}`);
    onNext({ teamNames, rules });
  };

  return (
    <div className="space-y-4 animate-pop-in">
      <section className="glass p-5">
        <Legend icon={Trophy} title="Teams" />
        <div className="mt-4">
          <Label>Number of teams</Label>
          <div className="flex items-center justify-between gap-2">
            <StepBtn onClick={() => setCount((c) => Math.max(3, c - 1))} disabled={count <= 3}>
              –
            </StepBtn>
            <span className="scoreboard text-2xl font-bold text-white">{count}</span>
            <StepBtn onClick={() => setCount((c) => Math.min(6, c + 1))} disabled={count >= 6}>
              +
            </StepBtn>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {Array.from({ length: count }, (_, i) => (
            <label key={i} className="flex items-center gap-3">
              <span className="scoreboard grid h-9 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-400">
                {i + 1}
              </span>
              <input
                type="text"
                value={names[i]}
                placeholder={`Team ${i + 1}`}
                onChange={(e) => setName(i, e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon/50 focus:ring-2 focus:ring-neon/20"
              />
            </label>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Round-robin league, then playoffs — 4+ teams: semi-finals (1 v 3, 2 v 4); 3 teams:
          qualifier (1 v 2) + eliminator (loser v 3) — and a final. You'll pick players next.
        </p>
      </section>

      <section className="glass p-5">
        <Legend icon={Timer} title="Match Rules" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stepper
            icon={Timer}
            label="Overs"
            value={rules.totalOvers}
            min={1}
            max={50}
            onChange={(v) => setRule({ totalOvers: v })}
          />
          <Stepper
            icon={Users}
            label="Players / side"
            value={rules.playersPerTeam}
            min={2}
            max={15}
            onChange={(v) => setRule({ playersPerTeam: v })}
          />
        </div>
        <button
          type="button"
          onClick={() => setRule({ lastManStanding: !rules.lastManStanding })}
          className="btn-press mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
        >
          <span className="flex items-center gap-3">
            <Shield size={18} className={rules.lastManStanding ? 'text-neon' : 'text-slate-400'} />
            <span className="text-sm font-semibold text-slate-100">Last Man Standing</span>
          </span>
          <span className={`relative h-6 w-11 rounded-full transition ${rules.lastManStanding ? 'bg-neon shadow-glow-green' : 'bg-white/10'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${rules.lastManStanding ? 'left-[22px]' : 'left-0.5'}`} />
          </span>
        </button>
      </section>

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          onClick={onBack}
          className="btn-press flex items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-semibold text-slate-200"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button
          onClick={proceed}
          className="btn-press flex items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
        >
          Next: Add Players
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

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

function Label({ children }) {
  return (
    <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}

function Stepper({ icon: Icon, label, value, min, max, onChange }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
        <Icon size={13} />
        {label}
      </span>
      <div className="flex items-center justify-between gap-2">
        <StepBtn onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          –
        </StepBtn>
        <span className="scoreboard text-2xl font-bold text-slate-100">{value}</span>
        <StepBtn onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </StepBtn>
      </div>
    </div>
  );
}

function StepBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-xl font-bold text-slate-200 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
