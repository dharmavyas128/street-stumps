import { ChevronRight, Bookmark, Loader2 } from 'lucide-react';
import { oversText, teamName, maxWickets } from '../engine/matchEngine';
import AnimatedNumber from './AnimatedNumber';
import ScoreDisplay from './ScoreDisplay';
import BowlerPanel from './BowlerPanel';
import ScoringControls from './ScoringControls';
import MatchSummary from './MatchSummary';

/**
 * MatchView — renders an in-progress / finished match from the engine.
 * Shared by Quick matches and competition fixtures; the caller supplies the
 * `completeFooter` (Save/Delete for Quick, Continue for a fixture). When
 * `onSaveForLater` is given, a small "Save & exit" button appears during play
 * so the match can be parked in Match History and resumed later.
 */
export default function MatchView({ engine, completeFooter, onSaveForLater, savingForLater, matchLabel }) {
  const { state, status, context, narrative } = engine;

  if (status === 'live') {
    return (
      <div className="space-y-4">
        {onSaveForLater && <SaveForLaterBar onSave={onSaveForLater} saving={savingForLater} />}
        <ScoreDisplay context={context} narrative={narrative} matchLabel={matchLabel} />
        <BowlerPanel bowling={context.bowling} onSelectBowler={engine.selectBowler} />
        <ScoringControls
          onRuns={engine.scoreRuns}
          onExtra={engine.addExtra}
          onWicket={engine.takeWicket}
          onUndo={engine.undo}
          canUndo={engine.canUndo}
          EXTRA={engine.EXTRA}
          context={context}
          disabled={context.bowling.needsBowler}
        />
        <p className="text-center text-[10px] text-slate-600">
          {engine.historyDepth} ball{engine.historyDepth === 1 ? '' : 's'} recorded ·
          tap Undo to rewind
        </p>
      </div>
    );
  }

  if (status === 'innings-break') {
    return (
      <InningsBreak
        state={state}
        narrative={narrative}
        onContinue={engine.startNextInnings}
        onSaveForLater={onSaveForLater}
        savingForLater={savingForLater}
      />
    );
  }

  if (status === 'complete') {
    return <MatchSummary state={state} footer={completeFooter} matchLabel={matchLabel} />;
  }

  return null;
}

function SaveForLaterBar({ onSave, saving }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onSave}
        disabled={saving}
        className="btn-press flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-neon/40 hover:text-neon disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
        {saving ? 'Saving…' : 'Save & exit'}
      </button>
    </div>
  );
}

function InningsBreak({ state, narrative, onContinue, onSaveForLater, savingForLater }) {
  const inn = state.innings[0];
  const battedName = teamName(state, inn.battingTeamId);
  const chasingName = teamName(state, inn.bowlingTeamId);

  return (
    <div className="space-y-4 animate-pop-in">
      {onSaveForLater && <SaveForLaterBar onSave={onSaveForLater} saving={savingForLater} />}
      <div className="card-hero glass-box relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-neon/10 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Innings Break
        </p>
        <h2 className="relative mt-2 text-lg font-bold text-white">{battedName}</h2>
        <p className="relative mt-1 flex items-baseline justify-center gap-1">
          <span className="scoreboard text-5xl font-extrabold text-white text-glow-green">
            <AnimatedNumber value={inn.runs} />
          </span>
          <span className="scoreboard text-2xl font-bold text-slate-400">/{inn.wickets}</span>
        </p>
        <p className="scoreboard relative mt-1 text-sm text-slate-400">
          {oversText(inn.legalBalls)} overs · {maxWickets(state.config) - inn.wickets} wkt left
        </p>

        <div className="relative mt-4 rounded-xl border border-alert/30 bg-alert/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-alert-soft">{chasingName} need</p>
          <p className="scoreboard text-3xl font-extrabold text-alert">
            <AnimatedNumber value={state.target} />
          </p>
          <p className="text-xs text-slate-400">to win in {state.config.totalOvers} overs</p>
        </div>
      </div>

      <div className="card-utility p-4 text-center text-sm text-slate-300">{narrative}</div>

      <button
        onClick={onContinue}
        className="btn-press sheenable flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green ring-1 ring-neon-soft/40"
      >
        Start {chasingName}'s Innings
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
