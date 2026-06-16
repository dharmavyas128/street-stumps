/**
 * narrative.js — the real-time "Match Context" storyteller.
 *
 * Reads the live scorecard and emits a single punchy, human-readable line.
 * Pure function of state — safe to call on every render.
 */
import {
  getMatchContext,
  maxWickets,
  teamName,
  currentInnings,
  tossSummary,
} from './matchEngine';

const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

export function generateNarrative(state) {
  if (!state || state.status === 'setup') {
    return 'Set the rules, name your sides, and let battle commence.';
  }

  if (state.status === 'complete' && state.result) {
    if (state.result.type === 'tie') return "Scores level — you can't separate them! 🤝";
    return `${state.result.text}. What a contest! 🏆`;
  }

  const ctx = getMatchContext(state);
  if (!ctx) return '';

  if (state.status === 'innings-break') {
    const inn = currentInnings(state);
    const chaser = teamName(state, inn.bowlingTeamId);
    return `Innings break — ${ctx.battingTeamName} post ${ctx.runs}/${ctx.wickets}. ${chaser} need ${state.target} to win.`;
  }

  // ---- Live match colour ----
  const lms = state.config.lastManStanding;
  const wktsToLMS = ctx.wicketsLeft - 1; // wickets until only one batter remains

  // Second innings — frame everything around the chase.
  if (ctx.isSecondInnings) {
    const need = ctx.runsNeeded;
    const balls = ctx.ballsRemaining;

    if (need <= 0) {
      return `${ctx.battingTeamName} have knocked it off — job done!`;
    }
    if (balls <= 6 && balls > 0) {
      return `Down to the wire: ${need} needed off the final ${balls} ball${balls === 1 ? '' : 's'}! 🔥`;
    }
    const rrrTxt = ctx.rrr != null ? `${fmt(ctx.rrr)} rpo` : '—';
    if (lms && wktsToLMS === 1) {
      return `${ctx.battingTeamName} need ${need} off ${balls}, but they're one wicket from Last Man Standing! 😬`;
    }
    if (ctx.rrr != null && ctx.rrr > 12) {
      return `${ctx.battingTeamName} need ${need} from ${balls} — a steep ${rrrTxt} ask. Boundaries only from here.`;
    }
    return `${ctx.battingTeamName} need ${need} from ${balls} balls — ${rrrTxt} required. Game on!`;
  }

  // First innings — frame around tempo and milestones.
  const crr = ctx.crr;
  const oversLeft = fmt((ctx.totalOvers * 6 - ctx.legalBalls) / 6);

  if (ctx.legalBalls === 0) {
    return `${tossSummary(state.config)}. ${ctx.battingTeamName} ready to set the tone — ${ctx.totalOvers} overs on the clock.`;
  }

  if (lms && wktsToLMS === 1) {
    return `${ctx.battingTeamName} at ${ctx.runs}/${ctx.wickets} — one more and it's Last Man Standing! 🎯`;
  }

  if (ctx.wicketsLeft === 1) {
    return `${ctx.battingTeamName} hanging on at ${ctx.runs}/${ctx.wickets} — last pair at the crease.`;
  }

  if (crr >= 10) {
    return `${ctx.battingTeamName} are flying at ${fmt(crr)} rpo! ${ctx.runs}/${ctx.wickets} with ${oversLeft} overs left.`;
  }
  if (crr <= 5 && ctx.legalBalls >= 12) {
    return `${ctx.battingTeamName} grinding at ${fmt(crr)} rpo — ${ctx.runs}/${ctx.wickets}. Time to find the gaps.`;
  }
  return `${ctx.battingTeamName} ticking along: ${ctx.runs}/${ctx.wickets} at ${fmt(crr)} rpo, ${oversLeft} overs to go.`;
}
