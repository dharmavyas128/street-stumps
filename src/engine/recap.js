import {
  computeAwards,
  teamName,
  oversText,
  maxWickets,
  BATSMAN_STATUS,
} from './matchEngine.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function s(n) {
  return n === 1 ? '' : 's';
}

function overs(legalBalls) {
  return oversText(legalBalls);
}

/** Best batsman across all innings (most runs). */
function topBatter(state) {
  let best = null;
  for (const inn of state.innings) {
    if (!inn) continue;
    for (const b of inn.batsmen) {
      if (b.status === BATSMAN_STATUS.DID_NOT_BAT && b.balls === 0) continue;
      if (!best || b.runs > best.runs || (b.runs === best.runs && b.balls < best.balls)) {
        best = b;
      }
    }
  }
  return best;
}

/** Best bowler across all innings (most wickets, then economy). */
function topBowler(state) {
  let best = null;
  for (const inn of state.innings) {
    if (!inn) continue;
    for (const bw of inn.bowlers) {
      if (!bw.balls) continue;
      if (
        !best ||
        bw.wickets > best.wickets ||
        (bw.wickets === best.wickets && bw.runs / bw.balls < best.runs / best.balls)
      ) {
        best = bw;
      }
    }
  }
  return best;
}

/** Describe a batter's innings in short prose. */
function batSentence(b) {
  if (!b) return '';
  const notOut = b.status !== BATSMAN_STATUS.OUT;
  const score = `${b.runs}${notOut ? '*' : ''}`;
  const milestone =
    b.runs >= 100
      ? pick(['a brilliant century', 'a magnificent hundred', 'a superb ton'])
      : b.runs >= 50
        ? pick(['a fine half-century', 'a solid fifty', 'a quality half-ton'])
        : null;

  const extra =
    b.sixes >= 3
      ? `, including ${b.sixes} six${s(b.sixes)}`
      : b.fours >= 5
        ? `, hitting ${b.fours} four${s(b.fours)}`
        : '';

  if (milestone) {
    return `${b.name} starred with ${milestone} — ${score} off ${b.balls} ball${s(b.balls)}${extra}.`;
  }
  return `${b.name} top-scored with ${score} off ${b.balls} ball${s(b.balls)}${extra}.`;
}

/** Describe a bowler's spell. */
function bowlSentence(bw) {
  if (!bw || !bw.wickets) return '';
  const figures = `${bw.wickets}/${bw.runs}`;
  const spell = bw.balls ? ` in ${overs(bw.balls)} over${overs(bw.balls) === '1' ? '' : 's'}` : '';
  const adj =
    bw.wickets >= 5
      ? pick(['a devastating', 'a magnificent', 'an outstanding'])
      : bw.wickets >= 3
        ? pick(['an excellent', 'a fine', 'a sharp'])
        : pick(['a solid', 'a handy', 'a useful']);
  return `${bw.name} produced ${adj} spell of ${figures}${spell}.`;
}

// ---------------------------------------------------------------------------
// Quick-match recap (2 innings, limited overs)
// ---------------------------------------------------------------------------

function quickRecap(state) {
  const { config, innings, result } = state;
  const [first, second] = innings;
  if (!first || !second || !result) return null;

  const chasingId = second.battingTeamId;
  const defendingId = first.battingTeamId;
  const chasingName = teamName(state, chasingId);
  const defendingName = teamName(state, defendingId);
  const max = maxWickets(config);

  const awards = computeAwards(state);
  const bat = topBatter(state);
  const bowl = topBowler(state);
  const motm = awards?.manOfMatch;

  let opening = '';
  if (result.type === 'tie') {
    opening = pick([
      `In a dramatic finish, ${chasingName} and ${defendingName} could not be separated — the scores finished level.`,
      `What a match! ${chasingName} needed more but could only tie — scores level after ${overs(second.legalBalls)} overs.`,
    ]);
  } else if (result.winnerId === chasingId) {
    const wktsLeft = max - second.wickets;
    const ballsLeft = config.totalOvers * 6 - second.legalBalls;
    const adjective =
      wktsLeft <= 1
        ? pick(['a breathtaking last-wicket stand', 'the narrowest of victories'])
        : wktsLeft >= 6
          ? pick(['a commanding chase', 'a dominant run chase'])
          : pick(['a composed chase', 'a clinical run chase']);
    opening =
      ballsLeft >= 12
        ? `${chasingName} completed ${adjective} with ${overs(second.legalBalls)} overs, winning by ${wktsLeft} wicket${s(wktsLeft)}.`
        : `${chasingName} crossed the line in ${adjective}, winning by ${wktsLeft} wicket${s(wktsLeft)} off the last few balls.`;
  } else {
    const margin = (state.target ?? first.runs + 1) - 1 - second.runs;
    const adjective =
      margin <= 5
        ? pick(['a nervy finish', 'a tense contest'])
        : margin >= 50
          ? pick(['a commanding performance', 'a dominant display'])
          : pick(['a solid all-round performance', 'a well-rounded team effort']);
    opening = `${defendingName} defended their total in ${adjective}, winning by ${margin} run${s(margin)}.`;
  }

  const parts = [opening, batSentence(bat), bowlSentence(bowl)].filter(Boolean);

  if (motm) {
    parts.push(`${motm.name} was named Player of the Match.`);
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Test-match recap (team mode)
// ---------------------------------------------------------------------------

function testRecap(state) {
  const { result } = state;
  if (!result) return null;

  const awards = computeAwards(state);
  const bat = topBatter(state);
  const bowl = topBowler(state);
  const motm = awards?.manOfMatch;

  let opening = '';
  if (result.type === 'draw') {
    opening = pick([
      'Honours even — both sides fought hard but neither could force a result.',
      'The match ended in a draw after a spirited contest over multiple innings.',
    ]);
  } else if (result.type === 'tie') {
    opening = 'An incredible match finished level — a tie in Test cricket!';
  } else {
    const text = result.text || '';
    const byInnings = text.includes('innings');
    if (byInnings) {
      opening = `${text} — a dominant performance across the match.`;
    } else {
      opening = text + '.';
    }
  }

  const parts = [opening, batSentence(bat), bowlSentence(bowl)].filter(Boolean);
  if (motm) parts.push(`${motm.name} was named Player of the Match.`);
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Pairs / Single recap
// ---------------------------------------------------------------------------

function pairsRecap(state) {
  const { result, config } = state;
  if (!result) return null;

  const isSingle = config.testMode === 'single';
  const noun = isSingle ? 'player' : 'pair';
  const unit = config.scoring === 'survival' ? 'point' : 'run';

  let opening = '';
  if (result.type === 'tie') {
    const tied = result.standings?.filter((x) => x.score === result.standings[0].score) || [];
    opening = `${tied.map((t) => t.name).join(' and ')} could not be separated — both finished level.`;
  } else {
    const winner = result.standings?.[0];
    const runner = result.standings?.[1];
    if (winner) {
      const margin = runner ? winner.score - runner.score : winner.score;
      const adj =
        margin === 0
          ? 'by the narrowest margin'
          : margin <= 5
            ? pick(['in a close contest', 'in a tight finish'])
            : margin >= 30
              ? pick(['in dominant fashion', 'with a commanding total'])
              : pick(['in a solid performance', 'with a well-compiled total']);
      opening = `${winner.name} topped the standings ${adj}, finishing on ${winner.score} ${unit}${s(winner.score)}.`;
    }
  }

  // Best batter across all innings
  const bat = topBatter(state);
  const bowl = topBowler(state);

  const parts = [opening];
  if (bat) {
    const notOut = bat.status !== BATSMAN_STATUS.OUT;
    parts.push(
      `${bat.name} led the ${noun}s with the bat, posting ${bat.runs}${notOut ? '*' : ''} off ${bat.balls} ball${s(bat.balls)}.`
    );
  }
  if (bowl && bowl.wickets) {
    parts.push(bowlSentence(bowl));
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/** Generate a 2–4 sentence match recap from completed match state. */
export function generateRecap(state) {
  if (state.status !== 'complete') return null;
  if (state.config?.pairs) return pairsRecap(state);
  if (state.config?.format === 'test') return testRecap(state);
  return quickRecap(state);
}
