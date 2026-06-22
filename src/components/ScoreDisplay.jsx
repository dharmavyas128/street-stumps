import { Target, TrendingUp, Gauge, Radio, Crown, Trophy, ArrowLeftRight } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

/**
 * ScoreDisplay — the digital stadium scoreboard.
 * Shows overs, runs/wickets, run rate, target & required rate (2nd innings),
 * a recent-deliveries strip, a live batsmen tracker, and the Match Context.
 */
export default function ScoreDisplay({ context, narrative, matchLabel, onSwapStrike, onSetOpeners }) {
  if (!context) return null;
  const c = context;
  const isFinal = matchLabel === 'Final';
  // Both Test and Pairs are unlimited-overs formats (no ball clock, wkts-left).
  const isTest = !!c.test || !!c.pairs;

  return (
    <div className="space-y-3">
      {/* Grand Final banner — only for the tournament final */}
      {isFinal && (
        <div className="relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-amber-300/40 bg-amber-300/[0.08] py-2.5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-amber-300/10 to-transparent" />
          <Trophy size={13} fill="currentColor" className="relative text-amber-300" />
          <span className="relative text-[11px] font-black uppercase tracking-[0.35em] text-amber-300">
            Grand Final
          </span>
          <Trophy size={13} fill="currentColor" className="relative text-amber-300" />
        </div>
      )}
      {/* Primary scoreboard */}
      <div className="card-hero relative overflow-hidden p-5">
        {/* faint scanline glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-neon/10 blur-3xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {c.battingTeamName}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="scoreboard text-6xl font-extrabold leading-none text-white text-glow-green">
                <AnimatedNumber value={c.runs} />
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
            <p className="mt-1 text-xs text-slate-400">{isTest ? 'unlimited' : `of ${c.totalOvers}.0`}</p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat icon={TrendingUp} label="CRR" value={fmt(c.crr)} tint="neon" />
          {c.isSecondInnings ? (
            <>
              <Stat icon={Target} label="Need" value={c.runsNeeded} tint="amber" />
              {isTest ? (
                <Stat
                  icon={Gauge}
                  label="Extras"
                  value={c.extras.wides + c.extras.noBalls + c.extras.byes + c.extras.legByes}
                />
              ) : (
                <Stat
                  icon={Gauge}
                  label="RRR"
                  value={c.rrr != null ? fmt(c.rrr) : '—'}
                  tint="amber"
                />
              )}
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
              {isTest ? (
                <Stat icon={Target} label="Wkts left" value={c.wicketsLeft} />
              ) : (
                <Stat icon={Target} label="Balls left" value={c.ballsRemaining} />
              )}
            </>
          )}
        </div>

        {c.isSecondInnings && (
          <p className="relative mt-3 text-center text-xs text-slate-400">
            Target{' '}
            <span className="scoreboard font-bold text-alert">{c.target}</span>
            {isTest ? (
              <> · {c.runsNeeded} {c.test.scoring === 'survival' ? 'pts' : 'runs'} to win</>
            ) : (
              <>
                {' '}·{' '}
                <span className="scoreboard font-bold text-white">{c.ballsRemaining}</span>{' '}
                balls remaining
              </>
            )}
          </p>
        )}
      </div>

      {/* Recent deliveries strip — last 10 balls bowled */}
      {c.recentBalls && c.recentBalls.length > 0 && (
        <div className="card-utility p-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            This innings · last {c.recentBalls.length} ball{c.recentBalls.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-1.5 overflow-x-auto scroll-slim">
            {c.recentBalls.map((b, i) => {
              const { label, tone } = ballToken(b);
              return <BallChip key={i} label={label} tone={tone} />;
            })}
          </div>
        </div>
      )}

      {/* Opening pair picker — only before the first ball, and only when there's
          a partner to choose (skipped in Single mode, where it's a lone batter). */}
      {c.atInningsStart && onSetOpeners && c.lineup.length >= 2 && (
        <OpenersPicker
          lineup={c.lineup}
          strikerId={c.strikerId}
          nonStrikerId={c.nonStrikerId}
          onSetOpeners={onSetOpeners}
        />
      )}

      {/* Batsmen tracker */}
      <div className="card-utility p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <div className="grid flex-1 grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Batter</span>
            <span className="w-8 text-right">R</span>
            <span className="w-8 text-right">B</span>
            <span className="w-12 text-right">SR</span>
          </div>
          {c.nonStriker && onSwapStrike && (
            <button
              onClick={onSwapStrike}
              title="Swap strike"
              aria-label="Swap strike"
              className="btn-press ml-3 flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:border-neon/40 hover:text-neon"
            >
              <ArrowLeftRight size={12} />
              Swap
            </button>
          )}
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
      <div className="card-utility flex items-start gap-3 p-4">
        <Radio
          size={18}
          className="mt-0.5 shrink-0 animate-pulse-glow text-neon"
        />
        <p className="text-sm leading-snug text-slate-200">{narrative}</p>
      </div>
    </div>
  );
}

/** Map a timeline delivery record to a compact chip label + colour tone. */
function ballToken(b) {
  switch (b.kind) {
    case 'wicket':
      return { label: 'W', tone: 'wicket' };
    case 'wide':
      return { label: b.runs > 1 ? `${b.runs}wd` : 'wd', tone: 'extra' };
    case 'no_ball':
      return { label: b.batRuns ? `${b.batRuns}nb` : 'nb', tone: 'extra' };
    case 'bye':
      return { label: `${b.runs}b`, tone: 'bye' };
    case 'leg_bye':
      return { label: `${b.runs}lb`, tone: 'bye' };
    case 'run':
    default:
      if (b.runs === 0) return { label: '•', tone: 'dot' };
      return { label: String(b.runs), tone: b.boundary ? 'boundary' : 'run' };
  }
}

function BallChip({ label, tone }) {
  const tones = {
    boundary: 'bg-neon/20 text-neon ring-neon/40 font-bold',
    run: 'bg-white/8 text-slate-100 ring-white/15',
    dot: 'bg-white/5 text-slate-500 ring-white/10',
    wicket: 'bg-crimson/20 text-crimson-soft ring-crimson/40 font-bold',
    extra: 'bg-alert/15 text-alert ring-alert/30',
    bye: 'bg-azure/15 text-azure ring-azure/30',
  };
  return (
    <span
      className={`scoreboard grid h-8 min-w-8 shrink-0 place-items-center rounded-lg px-1.5 text-xs ring-1 ${
        tones[tone] || tones.run
      }`}
    >
      {label}
    </span>
  );
}

function OpenersPicker({ lineup, strikerId, nonStrikerId, onSetOpeners }) {
  const solo = lineup.length < 2;
  return (
    <div className="card-utility p-3">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-neon">
        Opening pair — pick who starts
      </p>
      <div className={`grid gap-2 ${solo ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <label className="block">
          <span className="mb-1 block px-1 text-[10px] uppercase tracking-wider text-slate-500">
            On strike *
          </span>
          <select
            value={strikerId || ''}
            onChange={(e) => onSetOpeners(e.target.value, solo ? null : nonStrikerId)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-neon/40"
          >
            {lineup.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === nonStrikerId} className="bg-midnight">
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {!solo && (
          <label className="block">
            <span className="mb-1 block px-1 text-[10px] uppercase tracking-wider text-slate-500">
              Non-striker
            </span>
            <select
              value={nonStrikerId || ''}
              onChange={(e) => onSetOpeners(strikerId, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2 text-sm text-slate-100 outline-none focus:border-neon/40"
            >
              {lineup.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === strikerId} className="bg-midnight">
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
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
    <div className="rounded-xl neu-inset px-3 py-2">
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
