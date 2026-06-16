import { X, Crown } from 'lucide-react';

/**
 * CompareModal — full-screen head-to-head between two players. Player 1 on the
 * left (neon), Player 2 on the right (amber). Each metric is a centre-split bar
 * whose halves widen toward whoever holds the higher value.
 */
export default function CompareModal({ p1, p2, onClose }) {
  if (!p1 || !p2) return null;

  const metrics = [
    { label: 'Total Points', v1: p1.points, v2: p2.points, fmt: (v) => Math.round(v) },
    { label: 'Runs', v1: p1.runs, v2: p2.runs, fmt: (v) => v },
    { label: 'Wickets', v1: p1.wickets, v2: p2.wickets, fmt: (v) => v },
    { label: 'Strike Rate', v1: p1.sr, v2: p2.sr, fmt: (v) => v.toFixed(1) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 w-full max-w-md p-5 animate-pop-in">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Head to head</h3>
          <button
            onClick={onClose}
            className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Names + points */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <PlayerHead player={p1} tint="neon" win={p1.points >= p2.points} />
          <PlayerHead player={p2} tint="alert" win={p2.points >= p1.points} align="right" />
        </div>

        <div className="space-y-4">
          {metrics.map((m) => (
            <MetricBar key={m.label} {...m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerHead({ player, tint, win, align = 'left' }) {
  const color = tint === 'neon' ? 'text-neon' : 'text-alert';
  const ring = tint === 'neon' ? 'bg-neon/10 ring-neon/30 text-neon' : 'bg-alert/10 ring-alert/30 text-alert';
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 text-sm font-bold ${ring}`}>
          {player.name.charAt(0).toUpperCase()}
        </span>
        <div className={align === 'right' ? 'text-right' : ''}>
          <p className="flex items-center gap-1 truncate text-sm font-bold text-white">
            {align === 'left' && win && <Crown size={12} className="text-amber-300" fill="currentColor" />}
            {player.name}
            {align === 'right' && win && <Crown size={12} className="text-amber-300" fill="currentColor" />}
          </p>
          <p className={`scoreboard text-lg font-extrabold ${color}`}>{Math.round(player.points)}</p>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, v1, v2, fmt }) {
  const total = v1 + v2 || 1;
  const left = (v1 / total) * 100;
  const right = (v2 / total) * 100;
  const lead1 = v1 > v2;
  const lead2 = v2 > v1;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`scoreboard font-bold ${lead1 ? 'text-neon' : 'text-slate-400'}`}>{fmt(v1)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`scoreboard font-bold ${lead2 ? 'text-alert' : 'text-slate-400'}`}>{fmt(v2)}</span>
      </div>
      <div className="flex h-3.5 items-center gap-1">
        <div className="flex flex-1 justify-end overflow-hidden rounded-l-md bg-white/5">
          <div className="h-full rounded-l-md bg-neon transition-all" style={{ width: `${left}%` }} />
        </div>
        <div className="flex flex-1 justify-start overflow-hidden rounded-r-md bg-white/5">
          <div className="h-full rounded-r-md bg-alert transition-all" style={{ width: `${right}%` }} />
        </div>
      </div>
    </div>
  );
}
