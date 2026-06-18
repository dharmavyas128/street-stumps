import { ArrowLeft, Radio, Eye, Trophy, Mic } from 'lucide-react';
import { getMatchContext } from '../engine/matchEngine';
import { generateNarrative, generateCommentaryLog } from '../engine/narrative';
import { wasPlayerInGame } from '../utils/gameHelpers';
import ScoreDisplay from './ScoreDisplay';
import MatchSummary from './MatchSummary';

/**
 * WatchView — read-only live view of a friend's game. Renders the same
 * scoreboard the scorer sees (ScoreDisplay / MatchSummary), driven purely by
 * the `game.data` that streams in over Realtime. No scoring controls.
 *
 * A match game keeps its state in `data.state`; a series/tournament keeps the
 * active fixture's state in `data.activeMatchState` (absent between games).
 *
 * `myName` is the current user's profile name. When the game ends:
 *   - was a player → full scorecard stays, "Match complete" badge
 *   - pure spectator → soft notice + prompt to go back
 */
export default function WatchView({ game, onBack, ended = false, myName }) {
  const data = game?.data || {};
  const state = data.state || data.activeMatchState || null;
  const wasPlayer = wasPlayerInGame(data, myName);

  // Guard: a realtime payload could be transient/partial — never crash the view.
  let context = null;
  let narrative = '';
  let commentaryLog = [];
  try {
    if (state) {
      context = getMatchContext(state);
      narrative = generateNarrative(state);
      commentaryLog = generateCommentaryLog(state);
    }
  } catch {
    context = null;
  }

  // Badge appearance depends on state × ended × wasPlayer
  let badgeClass, dotClass, badgeLabel;
  if (!ended) {
    badgeClass = 'border-crimson/40 bg-crimson/10 text-crimson-soft';
    dotClass   = 'bg-crimson animate-pulse-glow';
    badgeLabel = 'Live';
  } else if (wasPlayer) {
    badgeClass = 'border-neon/40 bg-neon/10 text-neon';
    dotClass   = 'bg-neon';
    badgeLabel = 'Match complete';
  } else {
    badgeClass = 'border-white/10 bg-white/5 text-slate-400';
    dotClass   = 'bg-slate-500';
    badgeLabel = 'Ended';
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
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${badgeClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {badgeLabel}
        </span>
      </div>

      {/* Who you're watching */}
      <div className="glass flex items-center gap-3 p-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${
          wasPlayer && ended
            ? 'bg-neon/10 text-neon ring-neon/20'
            : 'bg-neon/10 text-neon ring-neon/20'
        }`}>
          {wasPlayer && ended ? <Trophy size={16} /> : <Eye size={16} />}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">
            {wasPlayer && ended ? 'You played in this game' : 'Watching'}
          </p>
          <p className="truncate text-sm font-bold text-white">
            {game?.owner_name ? `${game.owner_name}'s game` : 'Live game'}
          </p>
        </div>
      </div>

      {/* Ended notice — only for pure spectators */}
      {ended && !wasPlayer && (
        <div className="glass rounded-2xl border border-white/10 p-4 text-center">
          <p className="text-sm font-semibold text-slate-300">This game has ended</p>
          <p className="mt-1 text-xs text-slate-500">You weren't added as a player — the scorecard is no longer available.</p>
          <button
            onClick={onBack}
            className="btn-press mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300"
          >
            Back to home
          </button>
        </div>
      )}

      {/* The scoreboard — always visible for players, hidden for spectators once ended */}
      {(!ended || wasPlayer) && (
        state && context ? (
          state.status === 'complete' ? (
            <MatchSummary state={state} />
          ) : (
            <>
              <ScoreDisplay context={context} narrative={narrative} />
              {commentaryLog.length > 0 && (
                <div className="card-utility p-4">
                  <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <Mic size={12} />
                    Commentary
                  </p>
                  <div className="max-h-72 space-y-0 overflow-y-auto">
                    {commentaryLog.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 border-b border-white/5 py-2 last:border-0"
                      >
                        <span className={`mt-0.5 shrink-0 font-mono text-[10px] w-7 text-right tabular-nums ${
                          entry.isExtra ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                          {entry.isExtra ? '·' : entry.over}
                        </span>
                        <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          entry.isWicket ? 'bg-crimson' :
                          entry.isSix    ? 'bg-alert' :
                          entry.isFour   ? 'bg-neon' :
                          entry.isExtra  ? 'bg-slate-600' :
                          entry.isDot    ? 'bg-slate-700' :
                                           'bg-slate-500'
                        }`} />
                        <p className={`flex-1 text-xs leading-snug ${
                          entry.isWicket ? 'font-semibold text-crimson-soft' :
                          entry.isSix    ? 'font-medium text-alert' :
                          entry.isFour   ? 'text-slate-100' :
                                           'text-slate-400'
                        }`}>
                          {entry.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          <div className="glass rounded-2xl p-8 text-center">
            <Radio size={28} className="mx-auto mb-2 animate-pulse-glow text-neon" />
            <p className="text-sm font-semibold text-slate-300">Waiting for play to start</p>
            <p className="mt-1 text-xs text-slate-500">
              The scoreboard will appear here as soon as the next ball is bowled.
            </p>
          </div>
        )
      )}
    </div>
  );
}
