/**
 * leaderboard.js — career stats engine.
 *
 * Aggregates per-player totals across every saved game (quick matches AND each
 * fixture of saved series/tournaments), keyed by player name. Computes a
 * weighted "Total Points" score, batting/bowling derivations, and a last-5
 * form guide. If there aren't enough real players yet, falls back to a seeded
 * demo set so the leaderboard is never empty.
 */
import { loadMatches } from './storage';
import { listFriendGames } from './data/db';

const REAL_THRESHOLD = 5; // need at least this many real players to skip demo

/**
 * Total Points formula:
 *
 * Batting:
 *   +1 / run · +1 / four (bonus) · +2 / six (bonus)
 *   HS milestone (highest tier only): 30–49 +10 · 50–99 +20 · 100+ +30
 *   −3 / duck (dismissed for 0)
 *
 * Bowling:
 *   +20 / wicket · +12 / maiden · +0.5 / dot ball
 *   Wicket haul (highest tier only): 3-wkt +10 · 4-wkt +15 · 5-wkt +25
 *   −1 / wide · −1 / no-ball
 *
 * Fielding:
 *   +10 / catch or run-out · +12 / stumping
 */
export function totalPoints(p) {
  let pts = 0;

  // Batting
  pts += p.runs ?? 0;
  pts += (p.fours ?? 0) * 1;
  pts += (p.sixes ?? 0) * 2;
  const hs = p.hs ?? 0;
  if (hs >= 100) pts += 30;
  else if (hs >= 50) pts += 20;
  else if (hs >= 30) pts += 10;
  pts -= (p.ducks ?? 0) * 3;

  // Bowling
  pts += (p.wickets ?? 0) * 20;
  pts += (p.maidens ?? 0) * 12;
  pts += (p.dotBalls ?? 0) * 0.5;
  pts += p.haulPts ?? 0;
  pts -= (p.wides ?? 0) * 1;
  pts -= (p.noBalls ?? 0) * 1;

  // Fielding
  pts += ((p.catches ?? 0) + (p.runOuts ?? 0)) * 10;
  pts += (p.stumpings ?? 0) * 12;

  return pts;
}

function blank(name) {
  return {
    id: name,
    name,
    team: null,
    matches: 0,
    won: 0,
    lost: 0,
    ties: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    hs: 0,
    outs: 0,
    ducks: 0,
    wickets: 0,
    runsConceded: 0,
    ballsBowled: 0,
    maidens: 0,
    dotBalls: 0,
    wides: 0,
    noBalls: 0,
    haulPts: 0,
    catches: 0,
    runOuts: 0,
    stumpings: 0,
    scores: [], // { at, runs } per innings, chronological
  };
}

function derive(p) {
  const ave = p.outs > 0 ? p.runs / p.outs : p.runs;
  const sr = p.balls > 0 ? (p.runs / p.balls) * 100 : 0;
  const econ = p.ballsBowled > 0 ? p.runsConceded / (p.ballsBowled / 6) : null;
  const bave = p.wickets > 0 ? p.runsConceded / p.wickets : null;
  const last5 = (p.last5 ?? p.scores.slice(-5).map((s) => s.runs)) || [];
  return { ...p, ave, sr, econ, bave, last5, points: totalPoints(p) };
}

/** Pull every COMPLETED match state out of saved history, oldest first. */
async function collectStates(loadFn = loadMatches) {
  const out = [];
  for (const r of await loadFn()) {
    if (r.status === 'in_progress') continue; // half-finished games don't count
    const at = r.savedAt || '';
    if (r.state) out.push({ state: r.state, at });
    else if (r.comp) {
      for (const f of r.comp.fixtures || []) {
        if (f.matchState) out.push({ state: f.matchState, at });
      }
    }
  }
  return out.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

/**
 * Aggregate a set of match states into a derived player array.
 * `byTeam` keys players by side+name (so two different "Batter 1"s on opposing
 * teams stay distinct) and records each player's team name — used for the
 * per-series leaderboard. The global career view keys by name only.
 */
function aggregateStates(entries, { byTeam = false } = {}) {
  const players = {};
  const ensure = (key, name, team) => {
    const p = (players[key] ||= { ...blank(name), id: key });
    if (team) p.team = team;
    return p;
  };

  for (const { state, at, teamMap } of entries) {
    const idName = {};
    for (const inn of state.innings || []) {
      if (!inn) continue;
      (inn.batsmen || []).forEach((b) => (idName[b.id] = b.name));
      (inn.bowlers || []).forEach((b) => (idName[b.id] = b.name));
    }
    // teamMap (side -> { id, name }) maps a match side to its real competition
    // team, so the same side ('A') across different tournament fixtures stays
    // distinct. Falls back to the match's own team names.
    const teamNameOf = (side) => teamMap?.[side]?.name || state.config?.teams?.[side]?.name || side;
    const teamKey = (side) => teamMap?.[side]?.id || side;
    const keyFor = (side, name) => (byTeam ? `${teamKey(side)}|${name}` : name);

    // Which match side(s) each player turned out for this game, so we can credit
    // matches-played and a win/loss/tie exactly once from the final result.
    const seenSides = {};
    const noteSide = (key, side) => {
      (seenSides[key] ||= new Set()).add(side);
    };

    for (const inn of state.innings || []) {
      if (!inn) continue;
      const batSide = inn.battingTeamId;
      const bowlSide = inn.bowlingTeamId;

      for (const b of inn.batsmen || []) {
        if (b.balls === 0 && b.runs === 0 && b.status !== 'out') continue;
        const key = keyFor(batSide, b.name);
        const p = ensure(key, b.name, teamNameOf(batSide));
        noteSide(key, batSide);
        p.innings += 1;
        p.runs += b.runs;
        p.balls += b.balls;
        p.fours += b.fours;
        p.sixes += b.sixes;
        p.hs = Math.max(p.hs, b.runs);
        if (b.status === 'out') {
          p.outs += 1;
          if (b.runs === 0) p.ducks += 1;
        }
        p.scores.push({ at, runs: b.runs });
        if (b.dismissal && b.dismissal.fielderId) {
          const fname = idName[b.dismissal.fielderId];
          if (fname) {
            const fkey = keyFor(bowlSide, fname);
            const f = ensure(fkey, fname, teamNameOf(bowlSide));
            noteSide(fkey, bowlSide);
            if (b.dismissal.id === 'caught') f.catches += 1;
            else if (b.dismissal.id === 'run_out') f.runOuts += 1;
            else if (b.dismissal.id === 'stumped') f.stumpings += 1;
          }
        }
      }

      for (const bw of inn.bowlers || []) {
        const key = keyFor(bowlSide, bw.name);
        const p = ensure(key, bw.name, teamNameOf(bowlSide));
        noteSide(key, bowlSide);
        p.wickets += bw.wickets;
        p.runsConceded += bw.runs;
        p.ballsBowled += bw.balls;
        p.maidens += bw.maidens;
        // Wicket haul bonus — highest tier only, calculated per innings.
        if (bw.wickets >= 5) p.haulPts += 25;
        else if (bw.wickets >= 4) p.haulPts += 15;
        else if (bw.wickets >= 3) p.haulPts += 10;
      }

      // Per-delivery stats from the timeline.
      for (const d of inn.timeline || []) {
        if (!d.bowlerId || !idName[d.bowlerId]) continue;
        const bowlerName = idName[d.bowlerId];
        const bp = ensure(keyFor(bowlSide, bowlerName), bowlerName, teamNameOf(bowlSide));
        const dot = (d.kind === 'run' || d.kind === 'wicket') && (d.runs || 0) === 0;
        if (dot) bp.dotBalls += 1;
        if (d.kind === 'wide') bp.wides += 1;
        if (d.kind === 'no_ball') bp.noBalls += 1;
      }
    }

    // Tally one match per player who appeared, plus W/L/T from the result
    // (result.winnerId is the winning SIDE 'A'/'B', or null for a tie).
    const winnerSide = state.result?.winnerId ?? null;
    for (const [key, sides] of Object.entries(seenSides)) {
      const p = players[key];
      if (!p) continue;
      p.matches += 1;
      if (!state.result) continue;
      if (winnerSide && sides.has(winnerSide)) p.won += 1;
      else if (winnerSide) p.lost += 1;
      else p.ties += 1;
    }
  }

  return Object.values(players).map(derive);
}

export async function careerStats() {
  return aggregateStates(await collectStates());
}

/** Career stats for a friend — derived from their own saved games. */
export async function friendCareerStats(userId) {
  return aggregateStates(await collectStates(() => listFriendGames(userId)));
}

/** Real career stats, or demo data when there isn't enough yet. */
export async function getLeaderboard() {
  const real = await careerStats();
  if (real.length >= REAL_THRESHOLD) {
    return { players: real, isDemo: false };
  }
  return { players: DEMO_PLAYERS.map(derive), isDemo: true };
}

/**
 * Per-competition leaderboard — only that series/tournament's played games.
 * Each match side is mapped to its real competition team (home → A, away → B),
 * so players are kept distinct per team even across a tournament's fixtures.
 */
export function competitionLeaderboard(comp) {
  const nameOf = (id) => (comp.teams.find((t) => t.id === id) || {}).name || id;
  const entries = (comp.fixtures || [])
    .filter((f) => f.played && f.matchState)
    .map((f) => ({
      state: f.matchState,
      at: '',
      teamMap: {
        A: { id: f.homeId, name: nameOf(f.homeId) },
        B: { id: f.awayId, name: nameOf(f.awayId) },
      },
    }));
  return aggregateStates(entries, { byTeam: true });
}

// ---------------------------------------------------------------------------
// Demo roster — varied so sorting, milestones, sparklines and compare all pop.
// ---------------------------------------------------------------------------
const DEMO_PLAYERS = [
  { id: 'd1', name: 'Rohit', matches: 9, innings: 9, runs: 412, balls: 268, fours: 38, sixes: 19, hs: 101, outs: 7, ducks: 1, wickets: 0, runsConceded: 0, ballsBowled: 0, maidens: 0, dotBalls: 0, wides: 0, noBalls: 0, haulPts: 0, catches: 5, runOuts: 1, stumpings: 0, last5: [101, 12, 64, 8, 73] },
  { id: 'd2', name: 'Kohli', matches: 9, innings: 9, runs: 458, balls: 351, fours: 41, sixes: 9, hs: 88, outs: 6, ducks: 0, wickets: 1, runsConceded: 14, ballsBowled: 12, maidens: 0, dotBalls: 4, wides: 2, noBalls: 1, haulPts: 0, catches: 7, runOuts: 2, stumpings: 0, last5: [88, 55, 41, 67, 9] },
  { id: 'd3', name: 'Bumrah', matches: 9, innings: 5, runs: 34, balls: 41, fours: 2, sixes: 1, hs: 16, outs: 3, ducks: 1, wickets: 22, runsConceded: 198, ballsBowled: 216, maidens: 6, dotBalls: 121, wides: 8, noBalls: 3, haulPts: 35, catches: 3, runOuts: 0, stumpings: 0, last5: [4, 0, 16, 2, 8] },
  { id: 'd4', name: 'Jadeja', matches: 8, innings: 7, runs: 176, balls: 132, fours: 14, sixes: 6, hs: 52, outs: 5, ducks: 0, wickets: 14, runsConceded: 174, ballsBowled: 192, maidens: 3, dotBalls: 88, wides: 5, noBalls: 2, haulPts: 20, catches: 9, runOuts: 4, stumpings: 1, last5: [52, 31, 8, 44, 12] },
  { id: 'd5', name: 'Warner', matches: 7, innings: 7, runs: 289, balls: 198, fours: 33, sixes: 11, hs: 76, outs: 6, ducks: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, maidens: 0, dotBalls: 0, wides: 0, noBalls: 0, haulPts: 0, catches: 4, runOuts: 1, stumpings: 0, last5: [9, 14, 22, 6, 18] },
  { id: 'd6', name: 'Starc', matches: 7, innings: 4, runs: 41, balls: 33, fours: 3, sixes: 2, hs: 21, outs: 2, ducks: 1, wickets: 18, runsConceded: 176, ballsBowled: 168, maidens: 4, dotBalls: 92, wides: 11, noBalls: 4, haulPts: 25, catches: 2, runOuts: 0, stumpings: 0, last5: [21, 6, 0, 11, 3] },
  { id: 'd7', name: 'Smith', matches: 8, innings: 8, runs: 334, balls: 281, fours: 29, sixes: 4, hs: 64, outs: 7, ducks: 1, wickets: 2, runsConceded: 36, ballsBowled: 30, maidens: 0, dotBalls: 9, wides: 1, noBalls: 0, haulPts: 0, catches: 6, runOuts: 1, stumpings: 0, last5: [64, 38, 51, 12, 29] },
  { id: 'd8', name: 'Pant', matches: 8, innings: 8, runs: 301, balls: 176, fours: 26, sixes: 21, hs: 79, outs: 7, ducks: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, maidens: 0, dotBalls: 0, wides: 0, noBalls: 0, haulPts: 0, catches: 11, runOuts: 3, stumpings: 2, last5: [79, 4, 33, 61, 17] },
];
