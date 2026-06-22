/**
 * competition.js — pure logic for multi-game formats that sit ON TOP of the
 * single-match engine:
 *   • Series    — 2 teams, best-of 3/5/7.
 *   • Tournament — N teams, round-robin league + a final between the top two.
 *
 * A competition holds `teams`, shared `rules`, and a list of `fixtures`. Each
 * fixture is played as a normal match (home → match side 'A', away → 'B'); the
 * result summary is folded back in here to drive standings/progression.
 */

import { recomputeMatch } from './engine/matchEngine';

let _seq = 0;
const fxId = () => `fx_${Date.now().toString(36)}_${_seq++}`;

function newFixture(homeId, awayId, extra = {}) {
  return {
    id: fxId(),
    homeId,
    awayId,
    played: false,
    result: null, // { winnerId | null, text }
    home: null, // { runs, wkts }
    away: null,
    matchState: null, // full match state for the scorecard
    stage: 'league',
    ...extra,
  };
}

export function makeTeams(names, rosters = [], captains = []) {
  return names.map((name, i) => ({
    id: `t${i}`,
    name: (name || `Team ${i + 1}`).trim() || `Team ${i + 1}`,
    players: rosters[i] || [],
    captain: captains[i] ?? null,
  }));
}

export function teamById(comp, id) {
  return comp.teams.find((t) => t.id === id) || null;
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export function createSeries({ teams, rules, bestOf }) {
  const [a, b] = teams;
  const games = bestOf || 3;
  const fixtures = Array.from({ length: games }, (_, i) =>
    newFixture(a.id, b.id, { game: i + 1 })
  );
  return {
    kind: 'series',
    teams,
    rules,
    bestOf: games,
    fixtures,
    activeFixtureId: null,
    done: false,
    champion: null,
  };
}

/** Round-robin: every pair meets once. */
export function createTournament({ teams, rules }) {
  const fixtures = [];
  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      fixtures.push(newFixture(teams[i].id, teams[j].id));
    }
  }
  return {
    kind: 'tournament',
    teams,
    rules,
    fixtures,
    activeFixtureId: null,
    done: false,
    champion: null,
  };
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

/**
 * Fold a finished match into the competition. `summary` comes from the engine:
 *   { winnerSide: 'A'|'B'|null, aRuns, aWkts, bRuns, bWkts, text, matchState }
 * where 'A' = home, 'B' = away for the active fixture.
 */
export function recordResult(comp, summary) {
  const next = structuredClone(comp);
  const fx = next.fixtures.find((f) => f.id === next.activeFixtureId);
  if (!fx) return next;

  fx.played = true;
  fx.home = { runs: summary.aRuns, wkts: summary.aWkts };
  fx.away = { runs: summary.bRuns, wkts: summary.bWkts };
  fx.result = {
    winnerId:
      summary.winnerSide === 'A'
        ? fx.homeId
        : summary.winnerSide === 'B'
          ? fx.awayId
          : null,
    text: summary.text,
  };
  fx.matchState = summary.matchState || null;
  next.activeFixtureId = null;

  if (next.kind === 'series') {
    // Every game is played out (dead rubbers included). The series is only
    // over once all fixtures are done; the winner is whoever has more wins.
    if (next.fixtures.every((f) => f.played)) {
      next.done = true;
      const s = seriesStatus(next);
      next.champion =
        s.aWins === s.bWins
          ? null
          : s.aWins > s.bWins
            ? next.teams[0].id
            : next.teams[1].id;
    }
  } else if (next.fixtures.filter((f) => f.stage === 'league').every((f) => f.played)) {
    // Tournament playoffs — derived from the fixtures so each round is added
    // exactly once. Higher seed (home) advances if a knockout is tied.
    const table = standings(next);
    const find = (st) => next.fixtures.find((f) => f.stage === st);
    const winnerOf = (f) => f.result?.winnerId ?? f.homeId;
    const final = find('final');

    if (table.length >= 4) {
      // Semi-finals: 1 v 3 and 2 v 4, then a final between the winners.
      const semis = next.fixtures.filter((f) => f.stage === 'semi');
      if (semis.length === 0) {
        next.fixtures.push(newFixture(table[0].id, table[2].id, { stage: 'semi', label: 'Semi-final 1' }));
        next.fixtures.push(newFixture(table[1].id, table[3].id, { stage: 'semi', label: 'Semi-final 2' }));
      } else if (!final && semis.every((f) => f.played)) {
        next.fixtures.push(newFixture(winnerOf(semis[0]), winnerOf(semis[1]), { stage: 'final', label: 'Final' }));
      } else if (final?.played) {
        next.done = true;
        next.champion = winnerOf(final);
      }
    } else if (table.length === 3) {
      // Page playoff: Qualifier 1 = 1 v 2 (winner → final). Eliminator =
      // Q1 loser v 3 (winner → final). Then the final.
      const q1 = find('q1');
      const q2 = find('q2');
      if (!q1) {
        next.fixtures.push(newFixture(table[0].id, table[1].id, { stage: 'q1', label: 'Qualifier 1' }));
      } else if (q1.played && !q2) {
        const q1Loser = winnerOf(q1) === q1.homeId ? q1.awayId : q1.homeId;
        next.fixtures.push(newFixture(q1Loser, table[2].id, { stage: 'q2', label: 'Eliminator' }));
      } else if (q2?.played && !final) {
        next.fixtures.push(newFixture(winnerOf(q1), winnerOf(q2), { stage: 'final', label: 'Final' }));
      } else if (final?.played) {
        next.done = true;
        next.champion = winnerOf(final);
      }
    } else if (table.length >= 2) {
      if (!final) {
        next.fixtures.push(newFixture(table[0].id, table[1].id, { stage: 'final', label: 'Final' }));
      } else if (final.played) {
        next.done = true;
        next.champion = winnerOf(final);
      }
    } else {
      next.done = true;
      next.champion = table[0]?.id ?? null;
    }
  }
  return next;
}

/**
 * End a series before all games are played. We drop the unplayed fixtures and
 * crown whoever is leading; a level score is a draw (no champion). The games
 * already played keep their scorecards, so they still feed career stats.
 */
export function endSeriesEarly(comp) {
  const next = structuredClone(comp);
  next.fixtures = next.fixtures.filter((f) => f.played);
  next.activeFixtureId = null;
  next.done = true;
  const s = seriesStatus(next);
  next.champion =
    s.aWins === s.bWins
      ? null
      : s.aWins > s.bWins
        ? next.teams[0].id
        : next.teams[1].id;
  return next;
}

/**
 * Re-apply an owner-edited scorecard to an already-played fixture. The match
 * result is recomputed from the edited innings, the fixture's stored totals are
 * refreshed, and the competition outcome is re-derived: a series re-crowns the
 * leader (or declares a draw); a finished tournament re-reads its final.
 * Tournament league standings are derived live, so the table updates on its own.
 */
export function recordEditedFixture(comp, fixtureId, newState) {
  const next = structuredClone(comp);
  const fx = next.fixtures.find((f) => f.id === fixtureId);
  if (!fx) return next;

  const recomputed = recomputeMatch(newState);
  const a = recomputed.innings.find((i) => i && i.battingTeamId === 'A');
  const b = recomputed.innings.find((i) => i && i.battingTeamId === 'B');
  const winnerSide = recomputed.result?.winnerId ?? null;

  fx.matchState = recomputed;
  fx.home = { runs: a?.runs ?? 0, wkts: a?.wickets ?? 0 };
  fx.away = { runs: b?.runs ?? 0, wkts: b?.wickets ?? 0 };
  fx.result = {
    winnerId: winnerSide === 'A' ? fx.homeId : winnerSide === 'B' ? fx.awayId : null,
    text: recomputed.result?.text ?? '',
  };

  if (next.done) {
    if (next.kind === 'series') {
      const s = seriesStatus(next);
      next.champion =
        s.aWins === s.bWins
          ? null
          : s.aWins > s.bWins
            ? next.teams[0].id
            : next.teams[1].id;
    } else {
      const final = next.fixtures.find((f) => f.stage === 'final');
      if (final?.played) next.champion = final.result?.winnerId ?? final.homeId;
    }
  }
  return next;
}

export function seriesStatus(comp) {
  const [a, b] = comp.teams;
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  for (const f of comp.fixtures) {
    if (!f.played || !f.result) continue;
    if (f.result.winnerId === a.id) aWins += 1;
    else if (f.result.winnerId === b.id) bWins += 1;
    else ties += 1;
  }
  const needed = Math.floor(comp.bestOf / 2) + 1;
  const decided = aWins >= needed || bWins >= needed;
  const winnerId = aWins >= needed ? a.id : bWins >= needed ? b.id : null;
  return { aWins, bWins, ties, needed, decided, winnerId, played: aWins + bWins + ties };
}

const allOutLimit = (config) =>
  Math.max(1, config.lastManStanding ? config.playersPerTeam : config.playersPerTeam - 1);

/**
 * League table (league fixtures only). Win = 2 pts, tie = 1. Sorted by points,
 * then Net Run Rate, then runs scored.
 *
 * NRR = (runs scored / overs faced) − (runs conceded / overs bowled), using the
 * standard rule that a side bowled out counts its FULL quota of overs, not the
 * overs it actually used.
 */
export function standings(comp) {
  const rows = {};
  comp.teams.forEach((t) => {
    rows[t.id] = {
      id: t.id, name: t.name, P: 0, W: 0, L: 0, T: 0, Pts: 0,
      RF: 0, RA: 0, oversFor: 0, oversAgainst: 0, nrr: 0,
    };
  });

  for (const f of comp.fixtures) {
    if (f.stage !== 'league' || !f.played || !f.result) continue;
    const h = rows[f.homeId];
    const a = rows[f.awayId];
    if (!h || !a) continue;

    h.P += 1;
    a.P += 1;

    // Runs + overs (for NRR) from the stored scorecard.
    const state = f.matchState;
    if (state) {
      const totalOvers = state.config.totalOvers;
      const maxW = allOutLimit(state.config);
      for (const inn of state.innings || []) {
        if (!inn) continue;
        const bat = inn.battingTeamId === 'A' ? h : a;
        const bowl = inn.battingTeamId === 'A' ? a : h;
        const allOut = inn.wickets >= maxW;
        const overs = allOut ? totalOvers : inn.legalBalls / 6;
        bat.RF += inn.runs;
        bat.oversFor += overs;
        bowl.RA += inn.runs;
        bowl.oversAgainst += overs;
      }
    } else {
      // Fallback if a scorecard wasn't stored: run totals only.
      h.RF += f.home.runs;
      h.RA += f.away.runs;
      a.RF += f.away.runs;
      a.RA += f.home.runs;
    }

    if (f.result.winnerId === f.homeId) {
      h.W += 1;
      a.L += 1;
      h.Pts += 2;
    } else if (f.result.winnerId === f.awayId) {
      a.W += 1;
      h.L += 1;
      a.Pts += 2;
    } else {
      h.T += 1;
      a.T += 1;
      h.Pts += 1;
      a.Pts += 1;
    }
  }

  for (const r of Object.values(rows)) {
    const forRate = r.oversFor > 0 ? r.RF / r.oversFor : 0;
    const againstRate = r.oversAgainst > 0 ? r.RA / r.oversAgainst : 0;
    r.nrr = forRate - againstRate;
  }

  return Object.values(rows).sort(
    (x, y) => y.Pts - x.Pts || y.nrr - x.nrr || y.RF - x.RF
  );
}

/** The next fixture still to be played (in order), or null. */
export function nextFixture(comp) {
  return comp.fixtures.find((f) => !f.played) || null;
}
