/**
 * matchEngine.js — the pure, deterministic state engine for Cyber-Field.
 *
 * Design principles
 * -----------------
 * 1. PURE REDUCER: `matchReducer(state, action)` never mutates its input. Each
 *    delivery handler works on a `structuredClone` of the state, so the previous
 *    state object stays frozen-in-time and can be pushed onto the history stack
 *    for a perfect, instant Undo (see useMatchEngine.js).
 * 2. SINGLE SOURCE OF TRUTH: every derived display value (overs text, run rate,
 *    required run rate, target) is computed by a *selector* from raw state —
 *    runs, wickets, legalBalls — never stored redundantly.
 * 3. RULE BENDER: all the configurable rules (overs, players, extra penalty,
 *    last-man-standing, retirement threshold) flow through `config` and are
 *    honoured consistently across both innings.
 *
 * State shape
 * -----------
 * {
 *   status: 'setup' | 'live' | 'innings-break' | 'complete',
 *   config: {
 *     teams: { A: {id,name}, B: {id,name} },
 *     totalOvers, playersPerTeam,
 *     extraPenalty (1|2), lastManStanding (bool),
 *     retirementThreshold (number|null),
 *     tossWinnerId, // who bats first
 *   },
 *   inningsIndex: 0 | 1,
 *   target: number | null,
 *   innings: [InningsState, InningsState | null],
 *   result: { winnerId|null, text, type } | null,
 * }
 *
 * InningsState {
 *   battingTeamId, bowlingTeamId,
 *   runs, wickets, legalBalls,
 *   extras: { wides, noBalls, byes, legByes },
 *   batsmen: [{ id, name, runs, balls, fours, sixes,
 *               status: 'did_not_bat'|'not_out'|'out'|'retired',
 *               dismissal: {type,label}|null }],
 *   strikerId, nonStrikerId,
 *   nextBatsmanIndex,
 *   timeline: [DeliveryRecord],
 * }
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EXTRA = {
  WIDE: 'wide',
  NO_BALL: 'no_ball',
  BYE: 'bye',
  LEG_BYE: 'leg_bye',
};

export const DISMISSAL_TYPES = [
  { id: 'bowled', label: 'Bowled' },
  { id: 'caught', label: 'Caught' },
  { id: 'lbw', label: 'LBW' },
  { id: 'run_out', label: 'Run Out' },
  { id: 'stumped', label: 'Stumped' },
  { id: 'hit_wicket', label: 'Hit Wicket' },
];

export const BATSMAN_STATUS = {
  DID_NOT_BAT: 'did_not_bat',
  NOT_OUT: 'not_out',
  OUT: 'out',
  RETIRED: 'retired',
};

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

/** The pristine pre-match state — the app boots into the setup screen. */
export function createEmptyState() {
  return {
    status: 'setup',
    config: null,
    inningsIndex: 0,
    target: null,
    innings: [null, null],
    result: null,
  };
}

function makeLineup(teamId, count, names = []) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${teamId}_b${i}`,
    name: (names[i] && String(names[i]).trim()) || `Batter ${i + 1}`,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    status: BATSMAN_STATUS.DID_NOT_BAT,
    dismissal: null,
    isCaptain: false,
  }));
}

function makeInnings(config, battingTeamId, bowlingTeamId) {
  const count = config.playersPerTeam;
  const names = config.players?.[battingTeamId] || [];
  const batsmen = makeLineup(battingTeamId, count, names);
  const hasPartner = count > 1;

  batsmen[0].status = BATSMAN_STATUS.NOT_OUT;
  if (hasPartner) batsmen[1].status = BATSMAN_STATUS.NOT_OUT;

  const captainIdx = config.captains?.[battingTeamId];
  if (captainIdx != null && batsmen[captainIdx]) batsmen[captainIdx].isCaptain = true;

  return {
    battingTeamId,
    bowlingTeamId,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    batsmen,
    strikerId: batsmen[0].id,
    nonStrikerId: hasPartner ? batsmen[1].id : null,
    nextBatsmanIndex: hasPartner ? 2 : 1,
    timeline: [],
    // ---- bowling ----
    bowlers: [], // stat objects, created on first selection
    currentBowlerId: null,
    lastBowlerId: null, // bowler of the previous over (can't bowl two in a row)
    currentOverConceded: 0, // runs charged to the bowler this over (for maidens)
  };
}

/** Normalise raw setup-form values into a clean config object. */
export function buildConfig(form) {
  const teamAName = (form.teamAName || 'Team A').trim() || 'Team A';
  const teamBName = (form.teamBName || 'Team B').trim() || 'Team B';
  const playersPerTeam = clampInt(form.playersPerTeam, 1, 15, 6);

  const format = form.format === 'test' ? 'test' : 'limited';

  return {
    teams: {
      A: { id: 'A', name: teamAName },
      B: { id: 'B', name: teamBName },
    },
    totalOvers: clampInt(form.totalOvers, 1, 100, 6),
    playersPerTeam,
    lastManStanding: !!form.lastManStanding,
    retirementThreshold:
      form.retirementThreshold && Number(form.retirementThreshold) > 0
        ? Number(form.retirementThreshold)
        : null,
    // ---- Test format (each side bats up to twice; no over limit) ----
    format, // 'limited' | 'test'
    testMode: ['team', 'pairs', 'single'].includes(form.testMode) ? form.testMode : 'team',
    inningsPerSide: format === 'test' ? clampInt(form.inningsPerSide, 1, 2, 2) : 1,
    scoring: form.scoring === 'survival' ? 'survival' : 'runs', // survival = 1 point / delivery
    followOn: {
      enabled: format === 'test' && !!form.followOn?.enabled,
      gap: clampInt(form.followOn?.gap, 1, 999, 100),
    },
    players: {
      A: normalizeNames(form.players?.A, playersPerTeam),
      B: normalizeNames(form.players?.B, playersPerTeam),
    },
    captains: {
      A: normalizeCaptain(form.captains?.A, playersPerTeam),
      B: normalizeCaptain(form.captains?.B, playersPerTeam),
    },
    toss: normalizeToss(form.toss),
  };
}

/** Build a `count`-long list of player names, filling blanks with defaults. */
function normalizeNames(arr, count) {
  return Array.from({ length: count }, (_, i) => {
    const v = arr && arr[i] != null ? String(arr[i]).trim() : '';
    return v || `Batter ${i + 1}`;
  });
}

/** A captain is a player index within the side, or null if unassigned. */
function normalizeCaptain(v, count) {
  if (v == null || v === '') return null; // guard: Number(null) === 0 would falsely pick player 0
  const n = Number(v);
  if (Number.isInteger(n) && n >= 0 && n < count) return n;
  return null;
}

function normalizeToss(toss) {
  const winnerId = toss?.winnerId === 'B' ? 'B' : 'A';
  const decision = toss?.decision === 'bowl' ? 'bowl' : 'bat';
  const callerId = toss?.callerId === 'B' ? 'B' : 'A';
  const call = toss?.call === 'tails' ? 'tails' : 'heads';
  return { winnerId, decision, callerId, call };
}

/** Human-readable toss result, e.g. "Neon Knights won the toss & chose to bowl". */
export function tossSummary(config) {
  if (!config?.toss) return '';
  const winner = config.teams[config.toss.winnerId].name;
  const verb = config.toss.decision === 'bat' ? 'bat' : 'bowl';
  return `${winner} won the toss & chose to ${verb}`;
}

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------------
// Small helpers (operate on a mutable *clone* inside the reducer)
// ---------------------------------------------------------------------------

export function maxWickets(config) {
  const lim = config.lastManStanding
    ? config.playersPerTeam
    : config.playersPerTeam - 1;
  return Math.max(1, lim);
}

export function currentInnings(state) {
  return state.innings[state.inningsIndex] || null;
}

function getBatsman(inn, id) {
  return inn.batsmen.find((b) => b.id === id) || null;
}

function getStriker(inn) {
  return getBatsman(inn, inn.strikerId);
}

function rotateStrike(inn) {
  if (!inn.nonStrikerId) return; // lone batter (last-man-standing) — no rotation
  const tmp = inn.strikerId;
  inn.strikerId = inn.nonStrikerId;
  inn.nonStrikerId = tmp;
}

/** Pull the next yet-to-bat batsman in, or null if the lineup is exhausted. */
function findNextBatsman(inn) {
  for (let i = inn.nextBatsmanIndex; i < inn.batsmen.length; i += 1) {
    if (inn.batsmen[i].status === BATSMAN_STATUS.DID_NOT_BAT) {
      inn.nextBatsmanIndex = i + 1;
      return inn.batsmen[i];
    }
  }
  inn.nextBatsmanIndex = inn.batsmen.length;
  return null;
}

/**
 * Bring a fresh batsman into the slot vacated by `vacatingId`.
 * Returns the incoming batsman, or null if none are left.
 */
function bringInBatsman(inn, vacatingId) {
  const next = findNextBatsman(inn);
  if (!next) {
    // No replacement available — the surviving partner (if any) bats on alone.
    if (inn.strikerId === vacatingId) inn.strikerId = inn.nonStrikerId;
    inn.nonStrikerId = null;
    return null;
  }
  next.status = BATSMAN_STATUS.NOT_OUT;
  if (inn.strikerId === vacatingId) inn.strikerId = next.id;
  else if (inn.nonStrikerId === vacatingId) inn.nonStrikerId = next.id;
  return next;
}

/**
 * Bring a SPECIFIC chosen batsman into the slot vacated by `vacatedId`.
 * Falls back to a lone batter (last-man-standing) when no valid pick is given.
 */
function bringInSpecific(inn, vacatedId, newId) {
  const slot =
    inn.strikerId === vacatedId
      ? 'striker'
      : inn.nonStrikerId === vacatedId
        ? 'nonStriker'
        : null;
  if (!slot) return;

  const incoming = newId ? getBatsman(inn, newId) : null;
  const eligible =
    incoming &&
    (incoming.status === BATSMAN_STATUS.DID_NOT_BAT ||
      incoming.status === BATSMAN_STATUS.RETIRED);

  if (eligible) {
    incoming.status = BATSMAN_STATUS.NOT_OUT;
    if (slot === 'striker') inn.strikerId = newId;
    else inn.nonStrikerId = newId;
  } else {
    // No valid replacement — surviving partner bats on alone.
    if (slot === 'striker') inn.strikerId = inn.nonStrikerId;
    inn.nonStrikerId = null;
  }
}

/** Auto-retire the scoring batsman once they cross the threshold. */
function maybeRetire(inn, config, scorerId) {
  if (!config.retirementThreshold) return;
  const scorer = getBatsman(inn, scorerId);
  if (!scorer || scorer.status !== BATSMAN_STATUS.NOT_OUT) return;
  if (scorer.runs < config.retirementThreshold) return;

  // Only retire if there's a replacement waiting — never strand the side.
  // Peek for the next batsman WITHOUT committing any pointer changes first.
  let nextIdx = -1;
  for (let i = inn.nextBatsmanIndex; i < inn.batsmen.length; i += 1) {
    if (inn.batsmen[i].status === BATSMAN_STATUS.DID_NOT_BAT) {
      nextIdx = i;
      break;
    }
  }
  if (nextIdx === -1) return; // no one to replace them — they bat on.

  const incoming = inn.batsmen[nextIdx];
  scorer.status = BATSMAN_STATUS.RETIRED;
  incoming.status = BATSMAN_STATUS.NOT_OUT;
  inn.nextBatsmanIndex = nextIdx + 1;
  if (inn.strikerId === scorer.id) inn.strikerId = incoming.id;
  else if (inn.nonStrikerId === scorer.id) inn.nonStrikerId = incoming.id;
}

function endOfOver(inn) {
  return inn.legalBalls > 0 && inn.legalBalls % 6 === 0;
}

// ---------------------------------------------------------------------------
// Bowling
// ---------------------------------------------------------------------------

function getCurrentBowler(inn) {
  if (!inn.currentBowlerId) return null;
  return inn.bowlers.find((b) => b.id === inn.currentBowlerId) || null;
}

/** Index of a batsman/bowler id of the form `${teamId}_b${i}`. */
function idIndex(playerId) {
  const i = Number(String(playerId).split('_b')[1]);
  return Number.isInteger(i) ? i : -1;
}

/** Set the bowler for the upcoming over, creating a stat record on first use. */
function selectBowler(inn, config, bowlerId) {
  let entry = inn.bowlers.find((b) => b.id === bowlerId);
  if (!entry) {
    const roster = config.players?.[inn.bowlingTeamId] || [];
    const idx = idIndex(bowlerId);
    entry = {
      id: bowlerId,
      name: roster[idx] || `Bowler ${idx + 1}`,
      balls: 0,
      runs: 0, // runs charged to the bowler (off bat + wides + no-balls)
      wickets: 0,
      maidens: 0,
    };
    inn.bowlers.push(entry);
  }
  inn.currentBowlerId = bowlerId;
}

/** Close out an over: tally a maiden, rotate strike, and clear the bowler. */
function completeOver(inn) {
  const bowler = getCurrentBowler(inn);
  if (bowler && inn.currentOverConceded === 0) bowler.maidens += 1;
  inn.lastBowlerId = inn.currentBowlerId;
  inn.currentBowlerId = null;
  inn.currentOverConceded = 0;
  rotateStrike(inn);
}

// ---------------------------------------------------------------------------
// Delivery handlers — each receives the live innings clone and mutates it
// ---------------------------------------------------------------------------

function handleRuns(inn, config, runs) {
  const scorer = getStriker(inn);
  const scorerId = scorer.id;
  const bowler = getCurrentBowler(inn);

  scorer.runs += runs;
  scorer.balls += 1;
  if (runs === 4) scorer.fours += 1;
  if (runs === 6) scorer.sixes += 1;

  inn.runs += runs;
  inn.legalBalls += 1;

  if (bowler) {
    bowler.balls += 1;
    bowler.runs += runs;
    inn.currentOverConceded += runs;
  }

  inn.timeline.push({
    kind: 'run',
    runs,
    boundary: runs === 4 || runs === 6,
    over: oversText(inn.legalBalls),
    batsmanId: scorerId,
    bowlerId: inn.currentBowlerId,
  });

  if (runs % 2 === 1) rotateStrike(inn);
  maybeRetire(inn, config, scorerId);
  if (endOfOver(inn)) completeOver(inn);
}

/**
 * Extras now carry a run amount on top of the standard 1-run penalty:
 *   • No-ball  → 1 (penalty) + runs the batter HIT off it (credited to batter)
 *   • Wide     → 1 (penalty) + extra runs the team ran (all to Extras)
 *   • Bye/Leg-bye → runs run (to Extras); a legal delivery
 * Wides & no-balls don't count as a ball; byes/leg-byes do.
 */
function handleExtra(inn, type, extraRuns = 0) {
  const bowler = getCurrentBowler(inn);
  const add = Math.max(0, Math.trunc(extraRuns) || 0);

  if (type === EXTRA.WIDE) {
    const total = 1 + add; // wide penalty + runs run
    inn.runs += total;
    inn.extras.wides += total;
    if (bowler) {
      bowler.runs += total;
      inn.currentOverConceded += total;
    }
    inn.timeline.push({
      kind: 'wide',
      runs: total,
      illegal: true,
      over: oversText(inn.legalBalls),
      bowlerId: inn.currentBowlerId,
    });
    if (add % 2 === 1) rotateStrike(inn); // they ran an odd number
    return;
  }

  if (type === EXTRA.NO_BALL) {
    // 1 no-ball to Extras + runs off the bat to the striker.
    const striker = getStriker(inn);
    inn.runs += 1 + add;
    inn.extras.noBalls += 1;
    striker.runs += add;
    if (add === 4) striker.fours += 1;
    if (add === 6) striker.sixes += 1;
    if (bowler) {
      bowler.runs += 1 + add;
      inn.currentOverConceded += 1 + add;
    }
    inn.timeline.push({
      kind: 'no_ball',
      runs: 1 + add,
      batRuns: add,
      illegal: true,
      over: oversText(inn.legalBalls),
      batsmanId: striker.id,
      bowlerId: inn.currentBowlerId,
    });
    if (add % 2 === 1) rotateStrike(inn);
    return;
  }

  // Bye / Leg-bye: a legal delivery, runs to Extras (not batter, not bowler).
  // NOT charged to the bowler — an over of byes can still be a maiden.
  const striker = getStriker(inn);
  const runs = Math.max(1, add); // a bye is at least 1 run
  striker.balls += 1; // the batter faced the ball
  inn.runs += runs;
  inn.legalBalls += 1;
  if (bowler) bowler.balls += 1;
  if (type === EXTRA.BYE) inn.extras.byes += runs;
  else inn.extras.legByes += runs;

  inn.timeline.push({
    kind: type,
    runs,
    over: oversText(inn.legalBalls),
    batsmanId: striker.id,
    bowlerId: inn.currentBowlerId,
  });

  if (runs % 2 === 1) rotateStrike(inn);
  if (endOfOver(inn)) completeOver(inn);
}

/**
 * payload = {
 *   dismissal: { id, label, fielderId? },  // fielderId = catcher / run-out / stumper
 *   outEnd: 'striker' | 'nonStriker',       // which batsman is dismissed (run-outs)
 *   nextBatsmanId: string | null,           // who walks in (chosen by the scorer)
 * }
 */
function handleWicket(inn, config, payload) {
  const { dismissal, outEnd = 'striker', nextBatsmanId = null } = payload;
  const bowler = getCurrentBowler(inn);
  const striker = getStriker(inn);

  // The striker always faces the legal delivery, whoever ends up dismissed.
  striker.balls += 1;
  inn.legalBalls += 1;
  if (bowler) bowler.balls += 1;

  // For run-outs the non-striker can be the one dismissed.
  const outId =
    outEnd === 'nonStriker' && inn.nonStrikerId ? inn.nonStrikerId : inn.strikerId;
  const out = getBatsman(inn, outId);
  const record = { ...dismissal, bowlerId: inn.currentBowlerId };
  out.status = BATSMAN_STATUS.OUT;
  out.dismissal = record;

  inn.wickets += 1;
  // Run-outs are not credited to the bowler.
  if (bowler && dismissal.id !== 'run_out') bowler.wickets += 1;

  inn.timeline.push({
    kind: 'wicket',
    runs: 0,
    dismissal: record,
    over: oversText(inn.legalBalls),
    batsmanId: outId,
    bowlerId: inn.currentBowlerId,
  });

  // Bring in the chosen batsman (or collapse to a lone batter under LMS).
  if (inn.wickets < maxWickets(config)) {
    bringInSpecific(inn, outId, nextBatsmanId);
  }

  if (endOfOver(inn)) completeOver(inn);
}

// ---------------------------------------------------------------------------
// Innings / match finalisation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Test format — each side bats up to twice, no over limit. Reuses the same
// delivery handlers; only the innings sequencing and result logic differ.
// ---------------------------------------------------------------------------

const otherTeam = (id) => (id === 'A' ? 'B' : 'A');

/** The win-determining score for an innings: real runs, or 1-point-per-delivery. */
export function inningsScore(inn, config) {
  if (!inn) return 0;
  return config?.scoring === 'survival' ? inn.timeline.length : inn.runs;
}

/** A team's cumulative score across all the innings it has batted. */
function teamTotal(state, teamId) {
  return state.innings.reduce(
    (sum, inn) =>
      inn && inn.battingTeamId === teamId ? sum + inningsScore(inn, state.config) : sum,
    0
  );
}

/** Total number of innings in this Test (2 or 4). */
const totalTestInnings = (config) => config.inningsPerSide * 2;

/** Is the given innings index the final (chasing) innings of the Test? */
function isFinalTestInnings(state) {
  return state.inningsIndex === totalTestInnings(state.config) - 1;
}

/**
 * Who bats in innings `index`. Order is t1, t2, then (4-innings) either the
 * follow-on side again or back to t1, and finally the chasing side.
 */
function testBattingTeamAt(state, index) {
  const t1 = state.battingFirstId;
  const t2 = otherTeam(t1);
  if (index <= 0) return t1;
  if (index === 1) return t2;
  if (index === 2) return state.followOnEnforced ? t2 : t1;
  return state.followOnEnforced ? t1 : t2; // index 3
}

/**
 * Can the leader enforce the follow-on right now? Only at the break after the
 * 2nd innings of a 4-innings Test, when enabled and the lead meets the gap.
 */
export function followOnAvailable(state) {
  const { config } = state;
  if (config.format !== 'test' || config.inningsPerSide !== 2) return false;
  if (!config.followOn?.enabled) return false;
  if (state.status !== 'innings-break' || state.inningsIndex !== 1) return false;
  const t1 = state.battingFirstId;
  const lead = teamTotal(state, t1) - teamTotal(state, otherTeam(t1));
  return lead >= (config.followOn.gap || 1);
}

/** Close the live Test innings and either break for the next one or finish. */
function closeTestInnings(state) {
  const idx = state.inningsIndex;
  const last = idx >= totalTestInnings(state.config) - 1;

  // Innings victory: the follow-on side, batting twice in a row, is bowled out
  // still trailing — the match ends without the leader needing to bat again.
  let inningsVictory = false;
  if (state.config.inningsPerSide === 2 && state.followOnEnforced && idx === 2) {
    const inn = currentInnings(state);
    const t1 = state.battingFirstId;
    const allOut = inn.wickets >= maxWickets(state.config);
    if (allOut && teamTotal(state, otherTeam(t1)) < teamTotal(state, t1)) {
      inningsVictory = true;
    }
  }

  if (last || inningsVictory) {
    state.status = 'complete';
    state.result = computeTestResult(state);
  } else {
    state.status = 'innings-break';
  }
  return state;
}

function finalizeTest(state) {
  const inn = currentInnings(state);
  if (!inningsIsOver(state, inn)) return state;
  return closeTestInnings(state);
}

/** Win by an innings / by runs / by wickets, in runs or survival points. */
export function computeTestResult(state) {
  const { config } = state;
  const t1 = state.battingFirstId;
  const unit = config.scoring === 'survival' ? 'point' : 'run';
  const s = (n) => (n === 1 ? '' : 's');

  // Innings victory (only via the follow-on path).
  if (config.inningsPerSide === 2 && state.followOnEnforced && state.inningsIndex === 2) {
    const margin = teamTotal(state, t1) - teamTotal(state, otherTeam(t1));
    return {
      winnerId: t1,
      type: 'win',
      text: `${config.teams[t1].name} won by an innings and ${margin} ${unit}${s(margin)}`,
    };
  }

  const lastInn = currentInnings(state);
  const chasingId = lastInn.battingTeamId;
  const defendingId = otherTeam(chasingId);
  const chasingTotal = teamTotal(state, chasingId);
  const defendingTotal = teamTotal(state, defendingId);

  if (chasingTotal > defendingTotal) {
    const wktsInHand = maxWickets(config) - lastInn.wickets;
    return {
      winnerId: chasingId,
      type: 'win',
      text: `${config.teams[chasingId].name} won by ${wktsInHand} wicket${s(wktsInHand)}`,
    };
  }
  if (chasingTotal === defendingTotal) {
    return { winnerId: null, type: 'tie', text: 'Match tied — scores level!' };
  }
  const margin = defendingTotal - chasingTotal;
  return {
    winnerId: defendingId,
    type: 'win',
    text: `${config.teams[defendingId].name} won by ${margin} ${unit}${s(margin)}`,
  };
}

function inningsIsOver(state, inn) {
  const { config } = state;
  if (inn.wickets >= maxWickets(config)) return true;
  if (config.format === 'test') {
    // No over limit. Only the final innings can end on a completed chase.
    if (isFinalTestInnings(state) && state.target != null && inningsScore(inn, config) >= state.target) {
      return true;
    }
    return false;
  }
  if (inn.legalBalls >= config.totalOvers * 6) return true;
  // Second innings: chase complete.
  if (state.inningsIndex === 1 && state.target != null && inn.runs >= state.target) {
    return true;
  }
  return false;
}

function finalize(state) {
  const inn = currentInnings(state);
  if (!inn) return state;
  if (state.config.format === 'test') return finalizeTest(state);
  if (!inningsIsOver(state, inn)) return state;

  if (state.inningsIndex === 0) {
    state.status = 'innings-break';
    state.target = inn.runs + 1;
  } else {
    state.status = 'complete';
    state.result = computeResult(state);
  }
  return state;
}

export function computeResult(state) {
  const { config } = state;
  const first = state.innings[0];
  const second = state.innings[1];
  const target = state.target;

  const chasingId = second.battingTeamId;
  const defendingId = first.battingTeamId;
  const chasingName = config.teams[chasingId].name;
  const defendingName = config.teams[defendingId].name;

  if (second.runs >= target) {
    const wktsInHand = maxWickets(config) - second.wickets;
    return {
      winnerId: chasingId,
      type: 'win',
      text: `${chasingName} won by ${wktsInHand} wicket${wktsInHand === 1 ? '' : 's'}`,
    };
  }
  if (second.runs === target - 1) {
    return { winnerId: null, type: 'tie', text: 'Match tied — scores level!' };
  }
  const margin = target - 1 - second.runs;
  return {
    winnerId: defendingId,
    type: 'win',
    text: `${defendingName} won by ${margin} run${margin === 1 ? '' : 's'}`,
  };
}

/**
 * Re-derive an innings' team total and wicket count from its (possibly hand-
 * edited) batter lines + extras. The invariant the live engine maintains is:
 *   inn.runs = Σ batter.runs + wides + noBalls + byes + legByes
 *   inn.wickets = number of batters whose status is OUT
 */
function recomputeInnings(inn) {
  if (!inn) return;
  const batRuns = inn.batsmen.reduce((s, b) => s + (Number(b.runs) || 0), 0);
  const e = inn.extras;
  const extras =
    (Number(e.wides) || 0) +
    (Number(e.noBalls) || 0) +
    (Number(e.byes) || 0) +
    (Number(e.legByes) || 0);
  inn.runs = batRuns + extras;
  inn.wickets = inn.batsmen.filter((b) => b.status === BATSMAN_STATUS.OUT).length;
}

/**
 * After an owner edits a finished scorecard, re-derive every dependent value so
 * the saved state stays internally consistent: team totals, wickets, the chase
 * target, and the final result. Returns a fresh state (input is not mutated).
 */
export function recomputeMatch(state) {
  const next = structuredClone(state);
  next.innings.forEach((inn) => recomputeInnings(inn));

  if (next.config?.format === 'test') {
    const finalInn = next.innings[totalTestInnings(next.config) - 1];
    if (finalInn) {
      const chasingId = finalInn.battingTeamId;
      next.target = teamTotal(next, otherTeam(chasingId)) - teamTotal(next, chasingId) + 1;
    }
    // A drawn result was a captain's call — editing scores doesn't undo it.
    if (next.status === 'complete' && next.result?.type !== 'draw') {
      next.result = computeTestResult(next);
    }
    return next;
  }

  const [first, second] = next.innings;
  if (first && second) {
    next.target = first.runs + 1;
    next.result = computeResult(next);
  } else if (first) {
    next.result = null;
  }
  return next;
}

// ---------------------------------------------------------------------------
// The reducer
// ---------------------------------------------------------------------------

export function setupMatch(form) {
  const config = buildConfig(form);
  // Toss winner's decision sets who bats first.
  const battingFirst =
    config.toss.decision === 'bat'
      ? config.toss.winnerId
      : config.toss.winnerId === 'A'
        ? 'B'
        : 'A';
  const bowlingFirst = battingFirst === 'A' ? 'B' : 'A';

  if (config.format === 'test') {
    const innings = new Array(totalTestInnings(config)).fill(null);
    innings[0] = makeInnings(config, battingFirst, bowlingFirst);
    return {
      status: 'live',
      config,
      inningsIndex: 0,
      battingFirstId: battingFirst,
      followOnEnforced: false,
      target: null,
      innings,
      result: null,
    };
  }

  const state = {
    status: 'live',
    config,
    inningsIndex: 0,
    target: null,
    innings: [makeInnings(config, battingFirst, bowlingFirst), null],
    result: null,
  };
  return state;
}

/**
 * Pure reducer. For delivery actions it clones the incoming state, applies the
 * change to the clone, and returns it — the original is never touched, which is
 * exactly what makes the immutable Undo stack reliable.
 */
export function matchReducer(state, action) {
  switch (action.type) {
    case 'SETUP_MATCH':
      return setupMatch(action.payload);

    case 'RESET':
      return createEmptyState();

    case 'LOAD_STATE':
      // Rehydrate a previously-saved match exactly as it was (resume).
      return action.state;

    case 'START_NEXT_INNINGS': {
      if (state.status !== 'innings-break') return state;
      const next = structuredClone(state);

      if (next.config.format === 'test') {
        const nextIdx = next.inningsIndex + 1;
        const battingId = testBattingTeamAt(next, nextIdx);
        const bowlingId = otherTeam(battingId);
        next.innings[nextIdx] = makeInnings(next.config, battingId, bowlingId);
        next.inningsIndex = nextIdx;
        next.status = 'live';
        // The final innings is a chase — set the target from the running totals.
        if (nextIdx === totalTestInnings(next.config) - 1) {
          next.target = teamTotal(next, otherTeam(battingId)) - teamTotal(next, battingId) + 1;
        }
        return next;
      }

      const prev = currentInnings(state);
      next.innings[1] = makeInnings(state.config, prev.bowlingTeamId, prev.battingTeamId);
      next.inningsIndex = 1;
      next.status = 'live';
      return next;
    }

    case 'DECLARE': {
      if (state.status !== 'live' || state.config.format !== 'test') return state;
      const inn = currentInnings(state);
      if (!inn) return state;
      const next = structuredClone(state);
      currentInnings(next).declared = true;
      return closeTestInnings(next);
    }

    case 'ENFORCE_FOLLOW_ON': {
      if (!followOnAvailable(state)) return state;
      const next = structuredClone(state);
      next.followOnEnforced = true;
      return next;
    }

    case 'DECLARE_DRAW': {
      if (state.status !== 'live' || state.config.format !== 'test') return state;
      const next = structuredClone(state);
      next.status = 'complete';
      next.result = { winnerId: null, type: 'draw', text: 'Match drawn' };
      return next;
    }

    case 'SWAP_STRIKE': {
      if (state.status !== 'live') return state;
      const inn = currentInnings(state);
      if (!inn || !inn.nonStrikerId) return state; // batting solo — nothing to swap
      const next = structuredClone(state);
      rotateStrike(currentInnings(next));
      return next;
    }

    case 'SET_OPENERS': {
      if (state.status !== 'live') return state;
      const inn = currentInnings(state);
      // Only before the innings' first delivery.
      if (!inn || inn.legalBalls !== 0 || inn.timeline.length !== 0) return state;
      const { strikerId, nonStrikerId } = action.payload;
      const striker = getBatsman(inn, strikerId);
      if (!striker) return state;
      // Non-striker is optional (last-man / solo), but if given must differ.
      if (nonStrikerId && (nonStrikerId === strikerId || !getBatsman(inn, nonStrikerId))) {
        return state;
      }
      const next = structuredClone(state);
      const ni = currentInnings(next);
      // Reset everyone to "did not bat", then mark the chosen openers not-out.
      ni.batsmen.forEach((b) => {
        if (b.status === BATSMAN_STATUS.NOT_OUT) b.status = BATSMAN_STATUS.DID_NOT_BAT;
      });
      const s = getBatsman(ni, strikerId);
      s.status = BATSMAN_STATUS.NOT_OUT;
      ni.strikerId = strikerId;
      if (nonStrikerId) {
        const n = getBatsman(ni, nonStrikerId);
        n.status = BATSMAN_STATUS.NOT_OUT;
        ni.nonStrikerId = nonStrikerId;
      } else {
        ni.nonStrikerId = null;
      }
      // The next batter to walk in is the first did-not-bat after the openers.
      const openerIdxs = ni.batsmen
        .map((b, i) => (b.status === BATSMAN_STATUS.NOT_OUT ? i : -1))
        .filter((i) => i >= 0);
      ni.nextBatsmanIndex = openerIdxs.length ? Math.max(...openerIdxs) + 1 : ni.batsmen.length;
      return next;
    }

    case 'SELECT_BOWLER': {
      if (state.status !== 'live') return state;
      const inn = currentInnings(state);
      // Only choosable at the start of an over (before any legal ball is bowled).
      if (inn.legalBalls % 6 !== 0) return state;
      if (inn.currentBowlerId === action.payload.bowlerId) return state; // no-op
      const next = structuredClone(state);
      selectBowler(currentInnings(next), next.config, action.payload.bowlerId);
      return next;
    }

    case 'SCORE_RUNS': {
      if (!canBowl(state)) return state;
      const next = structuredClone(state);
      handleRuns(currentInnings(next), next.config, action.payload.runs);
      return finalize(next);
    }

    case 'EXTRA': {
      if (!canBowl(state)) return state;
      const next = structuredClone(state);
      handleExtra(currentInnings(next), action.payload.extraType, action.payload.runs);
      return finalize(next);
    }

    case 'WICKET': {
      if (!canBowl(state)) return state;
      const next = structuredClone(state);
      handleWicket(currentInnings(next), next.config, action.payload);
      return finalize(next);
    }

    default:
      return state;
  }
}

/** A delivery can only be recorded when live and a bowler is on. */
function canBowl(state) {
  return state.status === 'live' && !!currentInnings(state)?.currentBowlerId;
}

// ---------------------------------------------------------------------------
// Selectors — derived display values (never stored in state)
// ---------------------------------------------------------------------------

export function oversText(legalBalls) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

export function runRate(runs, legalBalls) {
  if (!legalBalls) return 0;
  return runs / (legalBalls / 6);
}

export function ballsRemaining(state) {
  const inn = currentInnings(state);
  if (!inn) return 0;
  if (state.config.format === 'test') return null; // unlimited overs
  return Math.max(0, state.config.totalOvers * 6 - inn.legalBalls);
}

export function requiredRunRate(state) {
  if (state.config.format === 'test') return null; // no over limit, no required rate
  if (state.inningsIndex !== 1 || state.target == null) return null;
  const inn = currentInnings(state);
  const need = state.target - inn.runs;
  const balls = ballsRemaining(state);
  if (need <= 0 || balls <= 0) return null;
  return need / (balls / 6);
}

export function teamName(state, id) {
  return state.config?.teams?.[id]?.name ?? id;
}

/** Economy rate = runs charged ÷ overs bowled. */
export function bowlerEconomy(bowler) {
  if (!bowler || !bowler.balls) return 0;
  return bowler.runs / (bowler.balls / 6);
}

/**
 * The bowling side's full roster, flagged for the picker:
 *  - isCaptain: wears the (C)
 *  - disabled: just bowled the previous over (no two in a row)
 */
function bowlingRoster(state, inn) {
  const id = inn.bowlingTeamId;
  const roster = state.config.players?.[id] || [];
  const captainIdx = state.config.captains?.[id];
  return roster.map((name, i) => {
    const playerId = `${id}_b${i}`;
    return {
      id: playerId,
      name,
      isCaptain: i === captainIdx,
      disabled: state.config.playersPerTeam > 1 && playerId === inn.lastBowlerId,
    };
  });
}

/**
 * One tidy bundle of everything the header/scoreboard needs, derived live.
 */
export function getMatchContext(state) {
  const inn = currentInnings(state);
  if (!inn) return null;

  const wktsLeft = maxWickets(state.config) - inn.wickets;
  const currentBowler = getCurrentBowler(inn);
  const isTest = state.config.format === 'test';
  // A chase is the final innings of a Test, or the 2nd innings of a limited game.
  const chasing =
    state.target != null && (isTest ? isFinalTestInnings(state) : state.inningsIndex === 1);
  const score = inningsScore(inn, state.config); // scoring-aware (runs or survival points)
  const ctx = {
    battingTeamId: inn.battingTeamId,
    battingTeamName: teamName(state, inn.battingTeamId),
    bowlingTeamId: inn.bowlingTeamId,
    bowlingTeamName: teamName(state, inn.bowlingTeamId),
    runs: inn.runs,
    wickets: inn.wickets,
    maxWickets: maxWickets(state.config),
    wicketsLeft: wktsLeft,
    legalBalls: inn.legalBalls,
    oversText: oversText(inn.legalBalls),
    totalOvers: state.config.totalOvers,
    crr: runRate(inn.runs, inn.legalBalls),
    extras: inn.extras,
    isSecondInnings: chasing,
    target: state.target,
    ballsRemaining: ballsRemaining(state),
    rrr: requiredRunRate(state),
    runsNeeded: chasing ? Math.max(0, state.target - score) : null,
    // ---- Test format context (null for limited-overs games) ----
    test: isTest
      ? {
          scoring: state.config.scoring,
          points: inn.timeline.length, // this innings' survival points
          score, // headline score for this innings (runs or points)
          inningsNumber: state.inningsIndex + 1,
          totalInnings: totalTestInnings(state.config),
          isFinalInnings: isFinalTestInnings(state),
          battingTotal: teamTotal(state, inn.battingTeamId),
          bowlingTotal: teamTotal(state, inn.bowlingTeamId),
          lead: teamTotal(state, inn.battingTeamId) - teamTotal(state, inn.bowlingTeamId),
          canDeclare: inn.legalBalls > 0 && !isFinalTestInnings(state),
          followOnAvailable: followOnAvailable(state),
        }
      : null,
    striker: getBatsman(inn, inn.strikerId),
    nonStriker: inn.nonStrikerId ? getBatsman(inn, inn.nonStrikerId) : null,
    // Last 10 deliveries (most recent last) for the scoreboard ball-by-ball strip.
    recentBalls: inn.timeline.slice(-10),
    // The full batting lineup, for the opening-pair picker at innings start.
    lineup: inn.batsmen.map((b) => ({ id: b.id, name: b.name, isCaptain: b.isCaptain })),
    atInningsStart: inn.legalBalls === 0 && inn.timeline.length === 0,
    strikerId: inn.strikerId,
    nonStrikerId: inn.nonStrikerId,
    // Batters eligible to walk in next (not yet batted, or retired & able to return)
    availableBatsmen: inn.batsmen
      .filter(
        (b) =>
          b.status === BATSMAN_STATUS.DID_NOT_BAT ||
          b.status === BATSMAN_STATUS.RETIRED
      )
      .map((b) => ({
        id: b.id,
        name: b.name,
        isCaptain: b.isCaptain,
        retired: b.status === BATSMAN_STATUS.RETIRED,
      })),
    // ---- bowling ----
    bowling: {
      teamName: teamName(state, inn.bowlingTeamId),
      roster: bowlingRoster(state, inn),
      bowlers: inn.bowlers,
      currentBowler,
      needsBowler: !inn.currentBowlerId,
      overNumber: Math.floor(inn.legalBalls / 6) + 1,
      ballsThisOver: inn.legalBalls % 6,
    },
  };
  return ctx;
}

// ---------------------------------------------------------------------------
// Player names & dismissal lines
// ---------------------------------------------------------------------------

/** Resolve a player id (`${team}_b${i}`) to their display name. */
export function playerName(state, id) {
  if (!id) return '';
  const [team, rest] = String(id).split('_b');
  const idx = Number(rest);
  return state.config?.players?.[team]?.[idx] || id;
}

/** A real-cricket dismissal line, e.g. "c Smith b Starc", "run out (Warner)". */
export function dismissalLine(state, b) {
  if (b.status === BATSMAN_STATUS.NOT_OUT) return 'not out';
  if (b.status === BATSMAN_STATUS.RETIRED) return 'retired';
  const d = b.dismissal;
  if (!d) return 'out';
  const bowler = playerName(state, d.bowlerId);
  const fielder = playerName(state, d.fielderId);
  switch (d.id) {
    case 'bowled':
      return `b ${bowler}`;
    case 'lbw':
      return `lbw b ${bowler}`;
    case 'caught':
      return fielder ? `c ${fielder} b ${bowler}` : `c & b ${bowler}`;
    case 'stumped':
      return `st ${fielder} b ${bowler}`;
    case 'run_out':
      return fielder ? `run out (${fielder})` : 'run out';
    case 'hit_wicket':
      return `hit wkt b ${bowler}`;
    default:
      return (d.label || 'out').toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// Post-match awards
// ---------------------------------------------------------------------------

const econOf = (p) => (p.ballsBowled ? p.runsConceded / (p.ballsBowled / 6) : 0);
const fieldTotal = (p) => p.catches + p.runOuts + p.stumpings;

function impactScore(p) {
  return (
    p.runs +
    p.fours +
    p.sixes * 2 +
    p.wickets * 25 +
    p.maidens * 4 +
    fieldTotal(p) * 10
  );
}

/**
 * Aggregate every player's batting, bowling and fielding across both innings
 * and crown Man of the Match, Best Batsman, Best Bowler and Best Fielder.
 * Returns null until the match is complete.
 */
export function computeAwards(state) {
  if (state.status !== 'complete') return null;

  const players = {};
  const ensure = (id) => {
    if (!players[id]) {
      const team = String(id).split('_b')[0];
      players[id] = {
        id,
        name: playerName(state, id),
        teamName: teamName(state, team),
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        batted: false,
        wickets: 0,
        runsConceded: 0,
        ballsBowled: 0,
        maidens: 0,
        bowled: false,
        catches: 0,
        runOuts: 0,
        stumpings: 0,
      };
    }
    return players[id];
  };

  for (const inn of state.innings) {
    if (!inn) continue;
    for (const b of inn.batsmen) {
      if (b.status === BATSMAN_STATUS.DID_NOT_BAT && b.balls === 0) continue;
      const p = ensure(b.id);
      p.batted = true;
      p.runs += b.runs;
      p.ballsFaced += b.balls;
      p.fours += b.fours;
      p.sixes += b.sixes;
      const d = b.dismissal;
      if (d && d.fielderId) {
        const f = ensure(d.fielderId);
        if (d.id === 'caught') f.catches += 1;
        else if (d.id === 'run_out') f.runOuts += 1;
        else if (d.id === 'stumped') f.stumpings += 1;
      }
    }
    for (const bw of inn.bowlers) {
      const p = ensure(bw.id);
      p.bowled = true;
      p.wickets += bw.wickets;
      p.runsConceded += bw.runs;
      p.ballsBowled += bw.balls;
      p.maidens += bw.maidens;
    }
  }

  const arr = Object.values(players);
  if (arr.length === 0) return null;

  const batLine = (p) => `${p.runs} (${p.ballsFaced})`;
  const bowlLine = (p) => `${p.wickets}/${p.runsConceded} (${oversText(p.ballsBowled)})`;
  const fieldLine = (p) => {
    const bits = [];
    if (p.catches) bits.push(`${p.catches} ct`);
    if (p.runOuts) bits.push(`${p.runOuts} ro`);
    if (p.stumpings) bits.push(`${p.stumpings} st`);
    return bits.join(', ');
  };
  const wrap = (p, line) =>
    p ? { id: p.id, name: p.name, teamName: p.teamName, line } : null;

  // Best batsman: most runs, then more sixes, then fewer balls.
  const bestBat = arr
    .filter((p) => p.batted)
    .sort((a, b) => b.runs - a.runs || b.sixes - a.sixes || a.ballsFaced - b.ballsFaced)[0];

  // Best bowler: most wickets, then better economy.
  const bestBowl = arr
    .filter((p) => p.bowled && p.ballsBowled > 0)
    .sort((a, b) => b.wickets - a.wickets || econOf(a) - econOf(b))[0];

  // Best fielder: most dismissals — only if anyone fielded a dismissal.
  const bestField = arr
    .filter((p) => fieldTotal(p) > 0)
    .sort((a, b) => fieldTotal(b) - fieldTotal(a))[0];

  // Man of the match: highest all-round impact.
  const motm = arr.slice().sort((a, b) => impactScore(b) - impactScore(a))[0];

  const motmLine = (p) => {
    const bits = [];
    if (p.batted && (p.runs > 0 || p.ballsFaced > 0)) bits.push(batLine(p));
    if (p.bowled && p.ballsBowled > 0) bits.push(bowlLine(p));
    if (fieldTotal(p) > 0) bits.push(fieldLine(p));
    return bits.join(' · ') || '—';
  };

  return {
    manOfMatch: motm && impactScore(motm) > 0 ? wrap(motm, motmLine(motm)) : null,
    bestBatsman: bestBat ? wrap(bestBat, batLine(bestBat)) : null,
    bestBowler: bestBowl ? wrap(bestBowl, bowlLine(bestBowl)) : null,
    bestFielder: bestField ? wrap(bestField, fieldLine(bestField)) : null,
  };
}
