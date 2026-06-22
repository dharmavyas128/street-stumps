/**
 * narrative.js — per-delivery commentary + match-situation storyteller.
 *
 * generateNarrative(state, career?)
 *   When the current innings has a recent delivery, emits ball-by-ball commentary
 *   with batsman/bowler/fielder names, career milestone detection, and varied
 *   phrases keyed by delivery seed to avoid repetition.
 *   Falls back to match-situation narrative between deliveries.
 */
import {
  getMatchContext,
  teamName,
  currentInnings,
  tossSummary,
} from './matchEngine';

const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);

// ---------------------------------------------------------------------------
// Phrase banks — each is a function of relevant names
// ---------------------------------------------------------------------------

const SIX_PHRASES = [
  (n) => `${n} sends it into the stands! SIX!`,
  (n) => `${n} gets under it and launches it enormous! That's a maximum!`,
  (n) => `Clean strike from ${n} — all of that! SIX!`,
  (n) => `Over the rope, no doubt about it! SIX from ${n}!`,
  (n) => `${n} comes down the pitch and launches it! SIX!`,
  (n) => `Picked up and deposited over the boundary by ${n}! SIX!`,
  (n) => `${n} absolutely creams it! Massive six!`,
  (n) => `Gets the elevation, gets the distance — SIX from ${n}!`,
  (n) => `${n} slog-sweeps it into the crowd! SIX!`,
  (n) => `That's gone all the way! Effortless six from ${n}!`,
  (n) => `${n} steps out and drills it over the top! SIX!`,
  (n) => `${n} works it over fine leg — that's a six! Audacious!`,
  (n) => `Full swing from ${n} and it clears the rope with ease! SIX!`,
  (n) => `${n} rocks back and flat-bats it over mid-on! SIX!`,
  (n) => `Wow! ${n} has hit that into another postcode! SIX!`,
];

const FOUR_PHRASES = [
  (n) => `${n} punches it through the covers — four!`,
  (n) => `${n} finds the gap at fine leg! Four all the way!`,
  (n) => `Driven beautifully by ${n}, rolls to the rope! Four!`,
  (n) => `${n} cuts hard behind point — four!`,
  (n) => `${n} pulls it through square leg! Four!`,
  (n) => `Clipped off the pads by ${n}, racing away! Four!`,
  (n) => `${n} drills it back past the bowler — four!`,
  (n) => `Elegant flick from ${n}, beats mid-on easily! Four!`,
  (n) => `${n} ramps it over the slips cordon! Four!`,
  (n) => `Thick outside edge but it races away for ${n}! Four!`,
  (n) => `${n} gets forward and drives through extra cover! Four!`,
  (n) => `${n} whips it through mid-wicket, no stopping it! Four!`,
  (n) => `Short ball and ${n} swivels, pulls through square leg! Four!`,
  (n) => `${n} waits for it and works it delightfully — four!`,
  (n) => `That's crisp from ${n}! Straight down the ground — four!`,
];

const BOWLED_PHRASES = [
  (bt, bw) => `${bw} cleans up ${bt}! The off stump is pegged back!`,
  (bt, bw) => `Goes through the gate! ${bt} is bowled by ${bw}!`,
  (bt, bw) => `${bw} cleans up ${bt} — beautiful delivery, no answer to that.`,
  (bt, bw) => `${bt} is bowled neck and crop by ${bw}! What a delivery!`,
  (bt, bw) => `${bw} sneaks one through — top of off! ${bt} is bowled!`,
  (bt, bw) => `Timber! ${bw} has got ${bt} — the stump is cartwheeling!`,
  (bt, bw) => `${bt} misses, ${bw} hits — bowled! The stumps are shattered!`,
];

const CAUGHT_PHRASES = [
  (bt, bw, f) => `In the air… and pouched! ${f} takes a blinder to dismiss ${bt} off ${bw}!`,
  (bt, bw, f) => `${bt} chips it straight to ${f} — caught and bowled ${bw}!`,
  (bt, bw, f) => `Skied it and ${f} settles under it — caught! ${bt} walks back.`,
  (bt, bw, f) => `Sharp catch by ${f}! ${bt} is caught off ${bw}.`,
  (bt, bw, f) => `${bt} hits it straight to ${f} — couldn't have made it easier. Out!`,
  (bt, bw, f) => `Top grab by ${f}! ${bt} is caught off the bowling of ${bw}.`,
  (bt, bw, f) => `${f} runs around and takes it! ${bt} is on his way, caught off ${bw}!`,
];

const LBW_PHRASES = [
  (bt, bw) => `Huge appeal — the finger goes up! ${bt} is out LBW to ${bw}!`,
  (bt, bw) => `Trapped in front! ${bt} is plumb LBW to ${bw}.`,
  (bt, bw) => `${bw} crashes into the pad — ${bt} is out LBW! No review to be had.`,
  (bt, bw) => `Rapped on the knee-roll — ${bt} out LBW to ${bw}! Plumb!`,
  (bt, bw) => `${bw} angles it in and ${bt} misses completely — out LBW!`,
  (bt, bw) => `Full and straight from ${bw}, ${bt} plays across it — LBW!`,
];

const RUN_OUT_PHRASES = [
  (bt, f) => `Short of the crease! ${f} with a direct hit — ${bt} is run out!`,
  (bt, f) => `Mix-up in the middle! ${f} fires it in — ${bt} is run out!`,
  (bt, f) => `Called for a quick single… too late! ${bt} is run out by ${f}!`,
  (bt, _f) => `Sent back too late — ${bt} is run out! That's a disaster in the middle!`,
  (bt, f) => `${f} swoops and throws the stumps down! ${bt} is run out!`,
];

const STUMPED_PHRASES = [
  (bt, bw) => `${bt} wanders down the track and is stumped! ${bw} gets the credit.`,
  (bt, bw) => `${bt} went for the big shot but missed — stumped! ${bw} does the job.`,
  (bt, _bw) => `Wandered too far, the keeper whips the bails! ${bt} is stumped.`,
  (bt, bw) => `Lured out of the crease by ${bw} and beaten — stumped! Brilliant work.`,
];

const DOT_PHRASES = [
  (bw) => `Defended solidly. ${bw} keeping it tight.`,
  (_bw) => `Beaten on the outside edge — lucky escape!`,
  (bw) => `Dot ball, pressure building from ${bw}.`,
  (_bw) => `Tight line and length, no scoring opportunity there.`,
  (bw) => `${bw} beats the outside edge! No run.`,
  (_bw) => `Defended awkwardly but it's safe — dot ball.`,
  (bw) => `${bw} bangs it in short, batter ducks under it. Dot.`,
  (_bw) => `Good length delivery, kept out well. No run.`,
  (bw) => `Tight from ${bw} — absolutely nothing to hit there.`,
];

const SINGLE_PHRASES = [
  (n) => `${n} nudges for one — strike rotated.`,
  (n) => `Pushed for a quick single by ${n}.`,
  (n) => `${n} works it to leg for one.`,
  (n) => `Placed to the fielder — ${n} picks up a single.`,
  (n) => `Soft hands from ${n}, drops it and scampers through for one.`,
  (n) => `${n} tucks it into the gap, happy to take the single.`,
];

const TWO_PHRASES = [
  (_n) => `Good running between the wickets — two!`,
  (n) => `${n} hustles back for a second run!`,
  (n) => `Quick two, smart cricket from ${n}.`,
  (_n) => `They run hard and come back for two!`,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function findBatsman(inn, id) {
  return inn.batsmen.find((b) => b.id === id);
}
function findBowler(inn, id) {
  return inn.bowlers.find((b) => b.id === id);
}
function findName(inn, id) {
  if (!id) return null;
  const b = inn.batsmen.find((x) => x.id === id);
  if (b) return b.name;
  const bw = inn.bowlers.find((x) => x.id === id);
  return bw?.name || null;
}
function careerOf(career, name) {
  if (!career || !name) return null;
  return career.find((p) => p.name === name) || null;
}

// Check for career six / four milestone, returns a string or null.
function sixMilestone(career, batter) {
  if (!batter) return null;
  const cp = careerOf(career, batter.name);
  const total = (cp ? cp.sixes : 0) + batter.sixes;
  if (total === 10) return `That's ${batter.name}'s 10th career six — double figures in maximums!`;
  if (total === 25) return `25 career sixes for ${batter.name}! A quarter century of maximums!`;
  if (total === 50) return `50 career sixes for ${batter.name}! What a milestone! 🎉`;
  if (total === 100) return `100 career sixes for ${batter.name}! An absolute legend!`;
  if (total > 100 && total % 25 === 0) return `${total} career sixes for ${batter.name}! Incredible power hitting!`;
  return null;
}

function fourMilestone(career, batter) {
  if (!batter) return null;
  const cp = careerOf(career, batter.name);
  const total = (cp ? cp.fours : 0) + batter.fours;
  if (total === 25) return `25 career boundaries for ${batter.name}!`;
  if (total === 50) return `50th career four for ${batter.name}! Fifty fours in the books!`;
  if (total === 100) return `100 career boundaries for ${batter.name} — a century of fours!`;
  if (total > 100 && total % 50 === 0) return `${total} career fours for ${batter.name}! Extraordinary!`;
  return null;
}

function wicketMilestone(career, bowler) {
  if (!bowler) return null;
  const cp = careerOf(career, bowler.name);
  const total = (cp ? cp.wickets : 0) + bowler.wickets;
  if (total === 10) return `10 career wickets for ${bowler.name} — he's hitting his stride!`;
  if (total === 25) return `25 career wickets for ${bowler.name}! A genuine threat.`;
  if (total === 50) return `50 career wickets for ${bowler.name}! Fifty scalps — what a bowler!`;
  if (total === 100) return `100 career wickets for ${bowler.name}! A century of scalps! 🏏`;
  if (total > 100 && total % 25 === 0) return `${total} career wickets for ${bowler.name}! Sensational!`;
  return null;
}

// ---------------------------------------------------------------------------
// Per-delivery commentary
// ---------------------------------------------------------------------------

function deliveryComment(inn, delivery, career, seed) {
  const batter = findBatsman(inn, delivery.batsmanId);
  const bowler = findBowler(inn, delivery.bowlerId);
  const bName = batter?.name || 'Batter';
  const bwName = bowler?.name || 'Bowler';

  // Wicket
  if (delivery.kind === 'wicket') {
    const d = delivery.dismissal || {};
    const fielder = findName(inn, d.fielderId) || 'the fielder';
    let line;
    switch (d.id) {
      case 'bowled':
        line = pick(BOWLED_PHRASES, seed)(bName, bwName);
        break;
      case 'caught':
        line = pick(CAUGHT_PHRASES, seed)(bName, bwName, fielder);
        break;
      case 'lbw':
        line = pick(LBW_PHRASES, seed)(bName, bwName);
        break;
      case 'run_out':
        line = pick(RUN_OUT_PHRASES, seed)(bName, fielder);
        break;
      case 'stumped':
        line = pick(STUMPED_PHRASES, seed)(bName, bwName);
        break;
      default:
        line = `${bName} is out! ${d.label || 'Wicket!'}`;
    }
    if (bowler && d.id !== 'run_out') {
      const m = wicketMilestone(career, bowler);
      if (m) line += ` ${m}`;
    }
    return line;
  }

  // Legal run delivery
  if (delivery.kind === 'run') {
    const runs = delivery.runs || 0;

    if (delivery.boundary && runs === 6) {
      const base = pick(SIX_PHRASES, seed)(bName);
      const m = sixMilestone(career, batter);
      return m ? `${base} ${m}` : base;
    }
    if (delivery.boundary && runs === 4) {
      const base = pick(FOUR_PHRASES, seed)(bName);
      const m = fourMilestone(career, batter);
      return m ? `${base} ${m}` : base;
    }
    if (runs === 0) return pick(DOT_PHRASES, seed)(bwName);
    if (runs === 1) return pick(SINGLE_PHRASES, seed)(bName);
    if (runs === 2 || runs === 3) return pick(TWO_PHRASES, seed)(bName);
    return `${bName} picks up ${runs} — some adventurous running!`;
  }

  // Extras
  if (delivery.kind === 'wide') {
    return `Wide ball from ${bwName} — that's going down leg.`;
  }
  if (delivery.kind === 'no_ball') {
    const runs = delivery.runs || 0;
    if (delivery.boundary && runs >= 4) {
      return `No-ball AND a boundary from ${bName}! Expensive from ${bwName}.`;
    }
    return `No-ball from ${bwName}! Free hit coming up.`;
  }
  if (delivery.kind === 'bye') {
    const r = delivery.runs || 0;
    return `${r > 0 ? r + ' bye' + (r > 1 ? 's' : '') : 'Bye'} — extras on the board.`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Situation narrative (fallback)
// ---------------------------------------------------------------------------

function testSituation(state, ctx) {
  const t = ctx.test;
  const unit = t.scoring === 'survival' ? ' pts' : '';
  if (t.isFinalInnings && ctx.runsNeeded != null) {
    return `${ctx.battingTeamName} chasing ${state.target}${unit} — ${ctx.runsNeeded}${unit} to win, ${ctx.wicketsLeft} wkt${ctx.wicketsLeft === 1 ? '' : 's'} left.`;
  }
  if (ctx.legalBalls === 0) {
    return `${tossSummary(state.config)}. ${ctx.battingTeamName} begin innings ${t.inningsNumber} of ${t.totalInnings} — no over limit, bat as long as you can.`;
  }
  const leadTxt =
    t.lead > 0 ? `lead by ${t.lead}${unit}` : t.lead < 0 ? `trail by ${-t.lead}${unit}` : 'all square';
  return `${ctx.battingTeamName} ${ctx.runs}/${ctx.wickets} — innings ${t.inningsNumber} of ${t.totalInnings}, ${leadTxt}.`;
}

function situationNarrative(state, ctx) {
  if (ctx.test) return testSituation(state, ctx);
  const lms = state.config.lastManStanding;
  const wktsToLMS = ctx.wicketsLeft - 1;

  if (ctx.isSecondInnings) {
    const need = ctx.runsNeeded;
    const balls = ctx.ballsRemaining;
    if (need <= 0) return `${ctx.battingTeamName} have knocked it off — job done!`;
    if (balls <= 6 && balls > 0) {
      return `Down to the wire: ${need} needed off the final ${balls} ball${balls === 1 ? '' : 's'}! 🔥`;
    }
    const rrrTxt = ctx.rrr != null ? `${fmt(ctx.rrr)} rpo` : '—';
    if (lms && wktsToLMS === 1) {
      return `${ctx.battingTeamName} need ${need} off ${balls}, but one wicket from Last Man Standing! 😬`;
    }
    if (ctx.rrr != null && ctx.rrr > 12) {
      return `${ctx.battingTeamName} need ${need} from ${balls} — a steep ${rrrTxt} ask. Boundaries only from here.`;
    }
    return `${ctx.battingTeamName} need ${need} from ${balls} balls — ${rrrTxt} required. Game on!`;
  }

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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * generateCommentaryLog(state)
 * Returns all past deliveries as commentary entries, newest first.
 * Iterates every innings timeline and generates ball-by-ball text using
 * the delivery index as the phrase seed (stable across re-renders).
 */
export function generateCommentaryLog(state) {
  if (!state?.innings) return [];
  const log = [];

  state.innings.forEach((inn) => {
    if (!inn?.timeline?.length) return;
    let legal = 0;

    inn.timeline.forEach((delivery, i) => {
      const comment = deliveryComment(inn, delivery, null, i);
      if (!comment) return;

      const isLegal = delivery.kind !== 'wide' && delivery.kind !== 'no_ball';
      const runs = delivery.runs ?? 0;

      log.push({
        comment,
        over: `${Math.floor(legal / 6)}.${(legal % 6) + 1}`,
        isExtra: !isLegal,
        isWicket: delivery.kind === 'wicket',
        isSix:   delivery.kind === 'run' && !!delivery.boundary && runs === 6,
        isFour:  delivery.kind === 'run' && !!delivery.boundary && runs === 4,
        isDot:   delivery.kind === 'run' && runs === 0,
      });

      if (isLegal) legal++;
    });
  });

  return log.reverse();
}

export function generateNarrative(state, career) {
  if (!state || state.status === 'setup') {
    return 'Set the rules, name your sides, and let battle commence.';
  }

  if (state.status === 'complete' && state.result) {
    if (state.result.type === 'tie') return "Scores level — you can't separate them! 🤝";
    if (state.result.type === 'draw') return `${state.result.text} — honours even after a hard-fought Test. 🤝`;
    return `${state.result.text}. What a contest! 🏆`;
  }

  const ctx = getMatchContext(state);
  if (!ctx) return '';

  if (state.status === 'innings-break') {
    const inn = currentInnings(state);
    if (ctx.test) {
      const t = ctx.test;
      const unit = t.scoring === 'survival' ? ' pts' : '';
      if (t.followOnAvailable) {
        return `${ctx.battingTeamName} close on ${t.score}${unit} with a commanding lead — the follow-on is on the table.`;
      }
      const leadTxt =
        t.lead > 0 ? `lead by ${t.lead}${unit}` : t.lead < 0 ? `trail by ${-t.lead}${unit}` : 'all square';
      return `Innings ${t.inningsNumber} of ${t.totalInnings} done — ${ctx.battingTeamName} ${leadTxt}.`;
    }
    const chaser = teamName(state, inn.bowlingTeamId);
    return `Innings break — ${ctx.battingTeamName} post ${ctx.runs}/${ctx.wickets}. ${chaser} need ${state.target} to win.`;
  }

  // Per-delivery commentary — look at the last timeline entry.
  const inn = currentInnings(state);
  if (inn?.timeline?.length > 0) {
    const last = inn.timeline[inn.timeline.length - 1];
    // Use total legal balls as seed so each delivery picks a different phrase.
    const seed = inn.legalBalls;
    const comment = deliveryComment(inn, last, career || null, seed);
    if (comment) return comment;
  }

  return situationNarrative(state, ctx);
}
