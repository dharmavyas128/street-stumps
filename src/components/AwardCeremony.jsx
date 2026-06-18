import { ChevronLeft, Trophy } from 'lucide-react';
import { competitionLeaderboard } from '../leaderboard';
import { useTheme } from '../hooks/useTheme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const maxBy = (arr, fn) =>
  arr.length ? arr.reduce((best, p) => fn(p) > fn(best) ? p : best) : null;
const minBy = (arr, fn) =>
  arr.length ? arr.reduce((best, p) => fn(p) < fn(best) ? p : best) : null;

const fmtAvg  = (p) => p.outs > 0 ? (p.runs / p.outs).toFixed(1) : `${p.runs}*`;
const fmtEcon = (n) => n.toFixed(2);
const oversStr = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

function computeAwards(comp) {
  const players = competitionLeaderboard(comp);
  if (!players.length) return null;

  const batters  = players.filter(p => p.balls > 0);
  const bowlers  = players.filter(p => p.wickets > 0);
  const econPool = players.filter(p => p.ballsBowled >= 12 && p.econ != null);
  const fielders = players.filter(p => (p.catches + p.runOuts) > 0);
  const sixers   = players.filter(p => p.sixes > 0);
  const fourers  = players.filter(p => p.fours > 0);

  const pot        = maxBy(players.filter(p => p.innings > 0 || p.wickets > 0), p => p.points);
  const topRuns    = maxBy(batters, p => p.runs);
  const topWickets = maxBy(bowlers, p => p.wickets);
  const topEcon    = minBy(econPool, p => p.econ);
  const topSixes   = maxBy(sixers,  p => p.sixes);
  const topFours   = maxBy(fourers, p => p.fours);
  const topFielder = maxBy(fielders, p => p.catches + p.runOuts);

  return { pot, topRuns, topWickets, topEcon, topSixes, topFours, topFielder };
}

// Gold for the hero only; category rows use green / teal accent dots + stat colours.
const ACCENT = {
  gold:  { dot: 'bg-alert',  stat: 'text-alert',      bar: 'bg-alert/70'  },
  green: { dot: 'bg-neon',   stat: 'text-neon',       bar: 'bg-neon/70'   },
  teal:  { dot: 'bg-teal',   stat: 'text-teal',       bar: 'bg-teal/70'   },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AwardCeremony({ comp, onBack }) {
  const isLight = useTheme();
  const awards = computeAwards(comp);
  const isSeries = comp.kind === 'series';
  const tournamentLabel = isSeries ? 'Series' : 'Tournament';

  if (!awards) {
    return (
      <div className="space-y-4 animate-pop-in">
        <BackBtn onBack={onBack} />
        <div className="glass rounded-2xl p-8 text-center text-sm text-slate-400">
          No stats recorded yet.
        </div>
      </div>
    );
  }

  const { pot, topRuns, topWickets, topEcon, topSixes, topFours, topFielder } = awards;

  const categories = [
    topRuns && {
      label: 'Golden Bat',
      sublabel: 'Most runs',
      player: topRuns,
      stat: `${topRuns.runs}`,
      unit: 'runs',
      detail: `${topRuns.innings} inns · avg ${fmtAvg(topRuns)}`,
      accent: 'gold',
    },
    topWickets && {
      label: 'Golden Ball',
      sublabel: 'Most wickets',
      player: topWickets,
      stat: `${topWickets.wickets}`,
      unit: 'wkts',
      detail: topWickets.econ != null
        ? `${oversStr(topWickets.ballsBowled)} ov · econ ${fmtEcon(topWickets.econ)}`
        : `${oversStr(topWickets.ballsBowled)} overs`,
      accent: 'green',
    },
    topEcon && {
      label: 'Most Economical',
      sublabel: 'Best economy rate',
      player: topEcon,
      stat: fmtEcon(topEcon.econ),
      unit: 'rpo',
      detail: `${oversStr(topEcon.ballsBowled)} ov · ${topEcon.wickets} wkts`,
      accent: 'teal',
    },
    topSixes && {
      label: 'Maximum Sixes',
      sublabel: 'Power hitting',
      player: topSixes,
      stat: `${topSixes.sixes}`,
      unit: 'sixes',
      detail: `${topSixes.fours} fours also`,
      accent: 'green',
    },
    topFours && {
      label: 'Most Boundaries',
      sublabel: 'Most fours',
      player: topFours,
      stat: `${topFours.fours}`,
      unit: 'fours',
      detail: `${topFours.sixes} sixes also`,
      accent: 'teal',
    },
    topFielder && {
      label: 'Golden Gloves',
      sublabel: 'Best fielder',
      player: topFielder,
      stat: `${topFielder.catches + topFielder.runOuts}`,
      unit: 'dismissals',
      detail: `${topFielder.catches}c · ${topFielder.runOuts} ro`,
      accent: 'teal',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-4 animate-pop-in">
      <BackBtn onBack={onBack} />

      {/* ── Ceremony header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-8 text-center">
        <Ornament isLight={isLight} />
        <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.5em] text-slate-500">
          {tournamentLabel}
        </p>
        <h1 className="mt-1.5 text-[26px] font-black uppercase tracking-[0.18em] text-white">
          Award Ceremony
        </h1>
        {/* Single thin gold accent beneath the title */}
        <div className="mx-auto mt-3 h-px w-10 bg-alert/50" />
        <Ornament className="mt-4" isLight={isLight} />
      </div>

      {/* ── Player of the Tournament ────────────────────────────────────── */}
      {pot && (
        <div className={`relative overflow-hidden rounded-3xl border border-alert/20 p-6 shadow-glow-amber ${
          isLight
            ? 'bg-gradient-to-b from-amber-50/80 to-white/60 border-amber-200/60'
            : 'bg-gradient-to-b from-[#1c1a12] to-midnight'
        }`}>
          {/* Subtle warm bloom from top */}
          <div className="pointer-events-none absolute inset-x-0 -top-10 h-28 bg-alert/[0.10] blur-2xl" />
          {/* POT label */}
          <div className="relative flex items-center justify-center gap-2">
            <Trophy size={11} className="text-alert/60" />
            <p className="text-[9px] font-bold uppercase tracking-[0.45em] text-slate-400">
              Player of the {tournamentLabel}
            </p>
            <Trophy size={11} className="text-alert/60" />
          </div>
          {/* Winner name — the one place gold text is used */}
          <h2 className="relative mt-4 text-center text-[38px] font-black leading-none tracking-tight text-alert">
            {pot.name}
          </h2>
          {pot.team && (
            <p className="relative mt-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {pot.team}
            </p>
          )}
          {/* Thin separator */}
          <div className="relative mx-auto my-5 h-px bg-white/[0.07]" />
          {/* Stats row */}
          <div className="relative flex items-center justify-around">
            <HeroStat label="Runs" value={pot.runs} />
            <div className="h-8 w-px bg-white/[0.08]" />
            <HeroStat label="Wickets" value={pot.wickets} />
            <div className="h-8 w-px bg-white/[0.08]" />
            <HeroStat label="Points" value={Math.round(pot.points)} gold />
          </div>
        </div>
      )}

      {/* ── Category awards ─────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-[9px] font-bold uppercase tracking-[0.35em] text-slate-600">
            Honours
          </p>
          {categories.map((cat, i) => (
            <AwardRow key={i} cat={cat} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BackBtn({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="btn-press flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300"
    >
      <ChevronLeft size={16} />
      Back
    </button>
  );
}

function Ornament({ className = '', isLight = false }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${isLight ? 'to-slate-300/60' : 'to-white/[0.12]'}`} />
      <div className={`h-1.5 w-1.5 rotate-45 ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
      <div className={`h-px flex-1 bg-gradient-to-l from-transparent ${isLight ? 'to-slate-300/60' : 'to-white/[0.12]'}`} />
    </div>
  );
}

function HeroStat({ label, value, gold }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`scoreboard mt-0.5 text-2xl font-black ${gold ? 'text-alert' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function AwardRow({ cat, index }) {
  const { label, sublabel, player, stat, unit, detail, accent } = cat;
  const a = ACCENT[accent] ?? ACCENT.green;
  const num = String(index + 1).padStart(2, '0');

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-white/[0.05] bg-white/[0.025] px-4 py-3.5">
      {/* Index number */}
      <p className="w-5 shrink-0 text-[11px] font-bold tabular-nums text-slate-600">{num}</p>
      {/* Thin left accent bar */}
      <div className={`h-9 w-0.5 shrink-0 rounded-full ${a.bar}`} />
      {/* Text content */}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-[15px] font-bold leading-tight text-white">{player.name}</p>
        {detail && (
          <p className="mt-0.5 text-[10px] text-slate-600">{detail}</p>
        )}
      </div>
      {/* Stat */}
      <div className="shrink-0 text-right">
        <p className={`scoreboard text-2xl font-black leading-none ${a.stat}`}>{stat}</p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-600">{unit}</p>
      </div>
    </div>
  );
}
