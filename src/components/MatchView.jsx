import { useState } from 'react';
import { ChevronRight, Bookmark, Loader2, Flag, Hourglass, Handshake, Repeat2, Layers } from 'lucide-react';
import { oversText, teamName, maxWickets, currentInnings, inningsScore, followOnAvailable } from '../engine/matchEngine';
import AnimatedNumber from './AnimatedNumber';
import ScoreDisplay from './ScoreDisplay';
import BowlerPanel from './BowlerPanel';
import ScoringControls from './ScoringControls';
import MatchSummary from './MatchSummary';

/**
 * MatchView — renders an in-progress / finished match from the engine.
 * Shared by Quick matches, Test matches, and competition fixtures; the caller
 * supplies the `completeFooter` (Save/Delete for Quick, Continue for a fixture).
 * When `onSaveForLater` is given, a small "Save & exit" button appears during
 * play so the match can be parked in Match History and resumed later.
 */
export default function MatchView({ engine, completeFooter, onSaveForLater, savingForLater, matchLabel }) {
  const { state, status, context, narrative } = engine;
  const isTest = state.config?.format === 'test';

  if (status === 'live') {
    return (
      <div className="space-y-4">
        {onSaveForLater && <SaveForLaterBar onSave={onSaveForLater} saving={savingForLater} />}
        {isTest && context.test && (
          <TestStatusBar
            context={context}
            onDeclare={engine.declare}
            onDraw={engine.declareDraw}
          />
        )}
        <ScoreDisplay
          context={context}
          narrative={narrative}
          matchLabel={matchLabel}
          onSwapStrike={engine.swapStrike}
          onSetOpeners={engine.setOpeners}
        />
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
    return isTest ? (
      <TestInningsBreak
        state={state}
        narrative={narrative}
        onContinue={engine.startNextInnings}
        onFollowOn={engine.enforceFollowOn}
        onSaveForLater={onSaveForLater}
        savingForLater={savingForLater}
      />
    ) : (
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

/** A short word for the lead/deficit between the two sides this innings. */
function leadLine(t, battingName, bowlingName) {
  if (t.lead > 0) return `${battingName} lead by ${t.lead}`;
  if (t.lead < 0) return `${battingName} trail by ${-t.lead}`;
  return 'Scores level';
}

/**
 * TestStatusBar — the running Test situation plus Declare / Draw controls.
 * Declare shows in any non-final innings; Draw is offered in the final innings
 * (the side batting last can shake hands instead of chasing on).
 */
function TestStatusBar({ context, onDeclare, onDraw }) {
  const t = context.test;
  const [confirm, setConfirm] = useState(null); // 'declare' | 'draw' | null
  const unit = t.scoring === 'survival' ? 'pts' : null;

  return (
    <div className="card-utility space-y-3 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Layers size={13} />
          Innings {t.inningsNumber} of {t.totalInnings}
        </span>
        {t.scoring === 'survival' && (
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-200">
            <Hourglass size={10} /> Survival · {t.points} pts
          </span>
        )}
      </div>

      {t.inningsNumber > 1 && (
        <p className="text-sm font-semibold text-slate-200">
          {leadLine(t, context.battingTeamName, context.bowlingTeamName)}
          {unit ? ` ${unit}` : ''}
        </p>
      )}

      {(t.canDeclare || t.isFinalInnings) && (
        <div className="flex gap-2">
          {t.canDeclare && (
            <button
              onClick={() => setConfirm('declare')}
              className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-alert/40 bg-alert/10 py-2.5 text-sm font-bold text-alert"
            >
              <Flag size={15} /> Declare
            </button>
          )}
          {t.isFinalInnings && (
            <button
              onClick={() => setConfirm('draw')}
              className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/[0.06] py-2.5 text-sm font-bold text-slate-200"
            >
              <Handshake size={15} /> Draw
            </button>
          )}
        </div>
      )}

      {confirm && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center animate-pop-in">
          <p className="text-sm font-semibold text-white">
            {confirm === 'declare' ? 'Declare this innings closed?' : 'End the match as a draw?'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {confirm === 'declare'
              ? 'The batting side stops here and the next innings begins.'
              : 'Both captains agree to a draw — no winner is recorded.'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirm(null)}
              className="btn-press rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={() => { confirm === 'declare' ? onDeclare() : onDraw(); setConfirm(null); }}
              className={`btn-press rounded-xl py-2.5 text-sm font-bold ${
                confirm === 'declare'
                  ? 'bg-alert text-midnight'
                  : 'bg-white/90 text-midnight'
              }`}
            >
              {confirm === 'declare' ? 'Declare' : 'Agree draw'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Test innings break — shows the closed innings + the follow-on / next choice. */
function TestInningsBreak({ state, narrative, onContinue, onFollowOn, onSaveForLater, savingForLater }) {
  const inn = currentInnings(state);
  const battedName = teamName(state, inn.battingTeamId);
  const score = inningsScore(inn, state.config);
  const survival = state.config.scoring === 'survival';
  const canFollowOn = followOnAvailable(state);
  const declared = inn.declared;

  return (
    <div className="space-y-4 animate-pop-in">
      {onSaveForLater && <SaveForLaterBar onSave={onSaveForLater} saving={savingForLater} />}
      <div className="card-hero glass-box relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-white/[0.06] blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Innings Closed{declared ? ' · Declared' : ''}
        </p>
        <h2 className="relative mt-2 text-lg font-bold text-white">{battedName}</h2>
        <p className="relative mt-1 flex items-baseline justify-center gap-1">
          <span className="scoreboard text-5xl font-extrabold text-white">
            <AnimatedNumber value={score} />
          </span>
          <span className="scoreboard text-2xl font-bold text-slate-400">/{inn.wickets}</span>
        </p>
        <p className="scoreboard relative mt-1 text-sm text-slate-400">
          {survival ? `${inn.runs} runs · ` : ''}{oversText(inn.legalBalls)} overs{survival ? ` · ${score} pts` : ''}
        </p>
      </div>

      <div className="card-utility p-4 text-center text-sm text-slate-300">{narrative}</div>

      {canFollowOn ? (
        <div className="space-y-2">
          <p className="px-1 text-center text-xs text-slate-400">
            {battedName} lead by enough to enforce the follow-on.
          </p>
          <button
            onClick={onFollowOn}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-alert/40 bg-alert/10 py-3.5 text-base font-bold text-alert"
          >
            <Repeat2 size={18} /> Enforce follow-on
          </button>
          <button
            onClick={onContinue}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-white/90 py-3.5 text-base font-bold text-midnight"
          >
            Bat again ourselves
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <button
          onClick={onContinue}
          className="btn-press sheenable flex w-full items-center justify-center gap-2 rounded-2xl bg-white/90 py-4 text-base font-bold text-midnight ring-1 ring-white/40"
        >
          Start next innings
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      )}
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
