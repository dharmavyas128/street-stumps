import { Target, TrendingUp, Gauge, Radio, Crown } from 'lucide-react';

const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

/**
 * ScoreDisplay — the digital stadium scoreboard.
 * Shows overs, runs/wickets, run rate, target & required rate (2nd innings),
 * a live batsmen tracker, and the punchy Match Context narrative.
 */
export default function ScoreDisplay({ context, narrative }) {
  if (!context) return null;
  const c = context;

  return (
    <div className="space-y-3">
      {/* Primary scoreboard */}
      <div className="glass-strong relative overflow-hidden p-5">
        {/* faint scanline glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-neon/10 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {c.battingTeamName}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="scoreboard text-6xl font-extrabold leading-none text-white text-glow-green">
                {c.runs}
              </span>
              <span className="scoreboard text-3xl font-bold leading-none text-slate-400">
                /{c.wickets}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              vs {c.bowlingTeamName} · {c.wicketsLeft} wkt
              {c.wicketsLeft === 1 ? '' : 's'} in hand
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Overs
            </p>
            <p className="scoreboard text-3xl font-bold leading-none text-white">
              {c.oversText}
            </p>
            <p className="mt-1 text-xs text-slate-400">of {c.totalOvers}.0</p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat icon={TrendingUp} label="CRR" value={fmt(c.crr)} tint="neon" />
          {c.isSecondInnings ? (
            <>
              <Stat icon={Target} label="Need" value={c.runsNeeded} tint="amber" />
              <Stat
                icon={Gauge}
                label="RRR"
                value={c.rrr != null ? fmt(c.rrr) : '—'}
                tint="amber"
              />
            </>
          ) : (
            <>
              <Stat
                icon={Gauge}
                label="Extras"
                value={
                  c.extras.wides + c.extras.noBalls + c.extras.byes + c.extras.legByes
                }
              />
              <Stat icon={Target} label="Balls left" value={c.ballsRemaining} />
            </>
          )}
        </div>

        {c.isSecondInnings && (
          <p className="relative mt-3 text-center text-xs text-slate-400">
            Target{' '}
            <span className="scoreboard font-bold text-alert">{c.target}</span> ·{' '}
            <span className="scoreboard font-bold text-white">{c.ballsRemaining}</span>{' '}
            balls remaining
          </p>
        )}
      </div>

      {/* Batsmen tracker */}
      <div className="glass p-3">
        <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Batter</span>
          <span className="w-8 text-right">R</span>
          <span className="w-8 text-right">B</span>
          <span className="w-12 text-right">SR</span>
        </div>
        <BatterRow batter={c.striker} onStrike />
        {c.nonStriker ? (
          <BatterRow batter={c.nonStriker} />
        ) : (
          <div className="px-2 py-2 text-center text-xs italic text-slate-500">
            Last Man Standing — batting solo
          </div>
        )}
      </div>

      {/* Match Context narrative */}
      <div className="glass flex items-start gap-3 p-4">
        <Radio
          size={18}
          className="mt-0.5 shrink-0 animate-pulse-glow text-neon"
        />
        <p className="text-sm leading-snug text-slate-200">{narrative}</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }) {
  const valueCls =
    tint === 'neon'
      ? 'text-neon'
      : tint === 'amber'
        ? 'text-alert'
        : 'text-slate-100';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={11} />
        {label}
      </p>
      <p className={`scoreboard text-lg font-bold ${valueCls}`}>{value}</p>
    </div>
  );
}

function BatterRow({ batter, onStrike = false }) {
  if (!batter) return null;
  const sr = batter.balls ? ((batter.runs / batter.balls) * 100).toFixed(0) : '—';
  return (
    <div
      className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-xl px-2 py-2 ${
        onStrike ? 'bg-neon/10 ring-1 ring-neon/20' : ''
      }`}
    >
      <span className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-100">
        {batter.name}
        {batter.isCaptain && (
          <Crown size={11} className="shrink-0 text-amber-300" fill="currentColor" />
        )}
        {onStrike && <span className="text-neon text-glow-green">*</span>}
        <span className="ml-1 text-[10px] text-slate-500">
          {batter.fours}×4 {batter.sixes}×6
        </span>
      </span>
      <span className="scoreboard w-8 text-right text-sm font-bold text-white">
        {batter.runs}
      </span>
      <span className="scoreboard w-8 text-right text-sm text-slate-400">
        {batter.balls}
      </span>
      <span className="scoreboard w-12 text-right text-sm text-slate-400">{sr}</span>
    </div>
  );
}
