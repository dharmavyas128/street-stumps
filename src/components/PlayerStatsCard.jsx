import { useEffect, useState } from 'react';

/**
 * PlayerStatsCard — the read-only stat panel (Career Stats, Recent Form, Best
 * Performances, Achievements) for a single player's derived `stats` object (as
 * produced by leaderboard.js `careerStats()`). Shared by a player's own profile
 * and the friend / roster stat sheets, so every player is shown the same way.
 */
const BADGES = [
  { id: 'first_match',  label: 'First Match',      emoji: '🏏', check: (s) => s.innings >= 1 },
  { id: 'half_century', label: 'Half-Century',     emoji: '⚡', check: (s) => s.hs >= 50 },
  { id: 'centurion',    label: 'Centurion',        emoji: '💯', check: (s) => s.hs >= 100 },
  { id: 'wicket_taker', label: 'Wicket Taker',     emoji: '🎳', check: (s) => s.wickets >= 1 },
  { id: 'five_for',     label: 'Five-For',         emoji: '🔥', check: (s) => s.wickets >= 5 },
  { id: 'six_machine',  label: 'Six Machine',      emoji: '💥', check: (s) => s.sixes >= 5 },
  { id: 'veteran',      label: '10-Match Veteran', emoji: '🏆', check: (s) => s.innings >= 10 },
];

export default function PlayerStatsCard({ stats, emptyMessage = 'No stats yet — play a match to build a record.' }) {
  if (!stats) {
    return (
      <div className="glass rounded-2xl p-4 text-center text-xs text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const last5 = stats.last5 || [];
  const achievements = BADGES.map((b) => ({ ...b, earned: b.check(stats) }));
  const tiles = [
    { label: 'Innings', value: stats.innings, decimals: 0 },
    { label: 'Runs',    value: stats.runs, decimals: 0 },
    { label: 'Wkts',    value: stats.wickets, decimals: 0 },
    { label: 'Avg',     value: stats.outs > 0 ? stats.runs / stats.outs : null, decimals: 1 },
    { label: 'Won',     value: stats.won ?? 0, decimals: 0 },
    { label: 'Lost',    value: stats.lost ?? 0, decimals: 0 },
    { label: 'Fours',   value: stats.fours, decimals: 0 },
    { label: 'Sixes',   value: stats.sixes, decimals: 0 },
  ];

  return (
    <div className="space-y-5">
      {/* Career Stats */}
      <section>
        <SectionLabel>Career Stats</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {tiles.map(({ label, value, decimals }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <p className="scoreboard text-lg font-extrabold text-neon">
                <CountUp value={value} decimals={decimals} />
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Form */}
      {last5.length > 0 && (
        <section>
          <SectionLabel>Recent Form — last {last5.length} innings</SectionLabel>
          <div className="flex gap-2">
            {last5.map((runs, i) => {
              const colour =
                runs >= 50 ? 'bg-neon/15 text-neon ring-neon/30' :
                runs >= 20 ? 'bg-amber-300/10 text-amber-300 ring-amber-300/20' :
                             'bg-white/5 text-slate-400 ring-white/10';
              return (
                <div key={i} className={`scoreboard flex-1 rounded-xl py-2.5 text-center text-sm font-bold ring-1 ${colour}`}>
                  {runs}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Best Performances */}
      {(stats.hs > 0 || stats.wickets > 0) && (
        <section>
          <SectionLabel>Best Performances</SectionLabel>
          <div className="glass divide-y divide-white/[0.06] rounded-2xl">
            {stats.hs > 0       && <PerfRow label="Highest Score" value={stats.hs} />}
            {stats.sr > 0       && <PerfRow label="Strike Rate"   value={stats.sr.toFixed(1)} />}
            {stats.wickets > 0  && <PerfRow label="Total Wickets" value={stats.wickets} />}
            {stats.econ != null && <PerfRow label="Economy Rate"  value={stats.econ.toFixed(2)} />}
          </div>
        </section>
      )}

      {/* Achievements */}
      <section>
        <SectionLabel>Achievements</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {achievements.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                b.earned
                  ? 'bg-neon/15 text-neon ring-neon/30'
                  : 'bg-white/[0.03] text-slate-600 ring-white/[0.08]'
              }`}
            >
              <span className={b.earned ? '' : 'opacity-30'}>{b.emoji}</span>
              {b.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </p>
  );
}

function PerfRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="scoreboard font-bold text-neon">{value}</span>
    </div>
  );
}

/* Animates a number from 0 → value on mount. */
function CountUp({ value, decimals = 0, fallback = '—' }) {
  const target = typeof value === 'number' ? value : NaN;
  const finite = Number.isFinite(target);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!finite) return;
    let raf;
    const start = performance.now();
    const dur = 650;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, finite]);

  if (!finite) return <>{fallback}</>;
  return <>{display.toFixed(decimals)}</>;
}
