import { Crown, Disc3 } from 'lucide-react';
import { oversText, bowlerEconomy } from '../engine/matchEngine';

const econFmt = (b) => bowlerEconomy(b).toFixed(2);
const figures = (b) =>
  `${oversText(b.balls)}-${b.maidens}-${b.runs}-${b.wickets}`;

/**
 * BowlerPanel — over-by-over bowler selection + live bowling figures.
 *  • When a new over starts, prompts to pick a bowler (can't bowl two in a row).
 *  • Otherwise shows the current bowler's O-M-R-W + economy, plus every
 *    bowler used this innings.
 */
export default function BowlerPanel({ bowling, onSelectBowler }) {
  const { needsBowler, roster, currentBowler, bowlers, overNumber, teamName } = bowling;

  if (needsBowler) {
    return (
      <div className="glass p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neon/15 text-neon ring-1 ring-neon/30">
            <Disc3 size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Over {overNumber} · Select bowler</p>
            <p className="text-[11px] text-slate-500">{teamName} to bowl</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {roster.map((p) => {
            const stat = bowlers.find((b) => b.id === p.id);
            return (
              <button
                key={p.id}
                disabled={p.disabled}
                onClick={() => onSelectBowler(p.id)}
                className="btn-press flex flex-col items-start rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left enabled:hover:border-neon/40 enabled:hover:bg-neon/10 disabled:opacity-30"
              >
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-100">
                  <span className="truncate">{p.name}</span>
                  {p.isCaptain && <Crown size={12} className="shrink-0 text-amber-300" fill="currentColor" />}
                </span>
                <span className="scoreboard text-[11px] text-slate-500">
                  {stat ? `${figures(stat)} · ${econFmt(stat)} econ` : 'yet to bowl'}
                  {p.disabled && ' · just bowled'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // A bowler is on — show their live figures + the innings' bowling summary.
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neon/15 text-neon ring-1 ring-neon/30">
            <Disc3 size={16} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-white">
              {currentBowler?.name}
              <span className="text-[10px] font-medium uppercase tracking-wider text-neon">
                · bowling
              </span>
            </p>
            <p className="scoreboard text-[11px] text-slate-400">
              {currentBowler ? figures(currentBowler) : '0.0-0-0-0'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Econ
          </p>
          <p className="scoreboard text-lg font-bold text-neon">
            {currentBowler ? econFmt(currentBowler) : '0.00'}
          </p>
        </div>
      </div>

      {bowlers.length > 1 && (
        <div className="mt-3 border-t border-white/10 pt-2">
          {bowlers
            .filter((b) => b.id !== currentBowler?.id)
            .map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-1 py-1 text-xs text-slate-400"
              >
                <span className="truncate">{b.name}</span>
                <span className="scoreboard">
                  {figures(b)} · {econFmt(b)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
