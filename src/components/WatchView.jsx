import { ArrowLeft, Radio, Eye } from 'lucide-react';
import { getMatchContext } from '../engine/matchEngine';
import { generateNarrative } from '../engine/narrative';
import ScoreDisplay from './ScoreDisplay';
import MatchSummary from './MatchSummary';

/**
 * WatchView — read-only live view of a friend's game. Renders the same
 * scoreboard the scorer sees (ScoreDisplay / MatchSummary), driven purely by
 * the `game.data` that streams in over Realtime. No scoring controls.
 *
 * A match game keeps its state in `data.state`; a series/tournament keeps the
 * active fixture's state in `data.activeMatchState` (absent between games).
 */
export default function WatchView({ game, onBack, ended = false }) {
  const data = game?.data || {};
  const state = data.state || data.activeMatchState || null;
  // Guard: a realtime payload could be transient/partial — never crash the view.
  let context = null;
  let narrative = '';
  try {
    if (state) {
      context = getMatchContext(state);
      narrative = generateNarrative(state);
    }
  } catch {
    context = null;
  }

  return (
    <div className="space-y-4 animate-pop-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-press flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            ended
              ? 'border-white/10 bg-white/5 text-slate-400'
              : 'border-crimson/40 bg-crimson/10 text-crimson-soft'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              ended ? 'bg-slate-500' : 'bg-crimson animate-pulse-glow'
            }`}
          />
          {ended ? 'Ended' : 'Live'}
        </span>
      </div>

      {/* Who you're watching */}
      <div className="glass flex items-center gap-3 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon ring-1 ring-neon/20">
          <Eye size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Watching</p>
          <p className="truncate text-sm font-bold text-white">
            {game?.owner_name ? `${game.owner_name}'s game` : 'Live game'}
          </p>
        </div>
      </div>

      {ended && (
        <div className="glass rounded-2xl border border-white/10 p-3 text-center text-xs text-slate-400">
          This game has ended or was closed. Showing the last update.
        </div>
      )}

      {/* The scoreboard */}
      {state && context ? (
        state.status === 'complete' ? (
          <MatchSummary state={state} />
        ) : (
          <ScoreDisplay context={context} narrative={narrative} />
        )
      ) : (
        <div className="glass rounded-2xl p-8 text-center">
          <Radio size={28} className="mx-auto mb-2 animate-pulse-glow text-neon" />
          <p className="text-sm font-semibold text-slate-300">Waiting for play to start</p>
          <p className="mt-1 text-xs text-slate-500">
            The scoreboard will appear here as soon as the next ball is bowled.
          </p>
        </div>
      )}
    </div>
  );
}
