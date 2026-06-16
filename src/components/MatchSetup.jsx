import { useState } from 'react';
import { Swords, Users, Timer, UserMinus, Shield, Zap, ChevronRight } from 'lucide-react';

/**
 * MatchSetup — Step 1 of the pre-match wizard: the "Rule Bender" form.
 * Collects team names + bendable rules, then advances to player naming.
 * (Who bats first is decided later by the toss.)
 */
export default function MatchSetup({ initial, onNext, showSeriesLength = false, nextLabel = 'Next: Name Players' }) {
  const [form, setForm] = useState({
    teamAName: '',
    teamBName: '',
    totalOvers: 6,
    playersPerTeam: 6,
    lastManStanding: false,
    retirementThreshold: 0, // 0 = off
    bestOf: 3,
    ...initial,
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    onNext(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4 animate-pop-in">
      {/* Team names */}
      <section className="glass p-5">
        <Legend icon={Swords} title="The Sides" tint="neon" />
        <div className="mt-4 space-y-3">
          <TextField
            label="Team A"
            value={form.teamAName}
            placeholder="e.g. Midnight Maulers"
            onChange={(v) => set({ teamAName: v })}
          />
          <TextField
            label="Team B"
            value={form.teamBName}
            placeholder="e.g. Neon Knights"
            onChange={(v) => set({ teamBName: v })}
          />
        </div>

        {showSeriesLength && (
          <div className="mt-4">
            <Label>Series length</Label>
            <SegToggle
              options={[
                { value: 3, label: 'Best of 3' },
                { value: 5, label: 'Best of 5' },
                { value: 7, label: 'Best of 7' },
              ]}
              value={form.bestOf}
              onChange={(v) => set({ bestOf: v })}
            />
          </div>
        )}
      </section>

      {/* Rule Bender */}
      <section className="glass p-5">
        <Legend icon={Zap} title="Rule Bender" tint="amber" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stepper
            icon={Timer}
            label="Overs"
            value={form.totalOvers}
            min={1}
            max={50}
            onChange={(v) => set({ totalOvers: v })}
          />
          <Stepper
            icon={Users}
            label="Players / side"
            value={form.playersPerTeam}
            min={2}
            max={15}
            onChange={(v) => set({ playersPerTeam: v })}
          />
        </div>

        <div className="mt-4">
          <Label icon={UserMinus}>Auto-retire batter at</Label>
          <SegToggle
            options={[
              { value: 0, label: 'Off' },
              { value: 30, label: '30' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
            ]}
            value={form.retirementThreshold}
            onChange={(v) => set({ retirementThreshold: v })}
          />
        </div>

        <div className="mt-4">
          <ToggleRow
            icon={Shield}
            title="Last Man Standing"
            subtitle="Final batter can bat on solo"
            checked={form.lastManStanding}
            onChange={(v) => set({ lastManStanding: v })}
          />
        </div>
      </section>

      <button
        type="submit"
        className="btn-press w-full rounded-2xl bg-neon py-4 text-center text-base font-bold text-midnight shadow-glow-green"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {nextLabel}
          <ChevronRight size={20} strokeWidth={2.5} />
        </span>
      </button>
    </form>
  );
}

/* ---------------- Small presentational primitives ---------------- */

function Legend({ icon: Icon, title, tint = 'neon' }) {
  const ring =
    tint === 'amber'
      ? 'text-alert bg-alert/10 ring-alert/30'
      : 'text-neon bg-neon/10 ring-neon/30';
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${ring}`}>
        <Icon size={18} />
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-200">
        {title}
      </h2>
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

function TextField({ label, value, placeholder, onChange }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-neon/50 focus:ring-2 focus:ring-neon/20"
      />
    </label>
  );
}

function SegToggle({ options, value, onChange, tint = 'neon' }) {
  const activeCls =
    tint === 'amber'
      ? 'bg-alert/15 text-alert ring-1 ring-alert/40'
      : 'bg-neon/[0.12] text-neon ring-1 ring-neon/40';
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`btn-press truncate rounded-lg px-2 py-2 text-sm font-semibold transition ${
              active ? activeCls : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ icon: Icon, label, value, min, max, onChange }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <Label icon={Icon}>{label}</Label>
      <div className="flex items-center justify-between gap-2">
        <StepBtn onClick={dec} disabled={value <= min}>
          –
        </StepBtn>
        <span className="scoreboard text-2xl font-bold text-slate-100">{value}</span>
        <StepBtn onClick={inc} disabled={value >= max}>
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

function ToggleRow({ icon: Icon, title, subtitle, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="btn-press flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
    >
      <span className="flex items-center gap-3">
        <Icon size={18} className={checked ? 'text-neon' : 'text-slate-400'} />
        <span>
          <span className="block text-sm font-semibold text-slate-100">{title}</span>
          <span className="block text-xs text-slate-400">{subtitle}</span>
        </span>
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? 'bg-neon shadow-glow-green' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}
