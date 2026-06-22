/**
 * storage.js — the app's data API. Backed by Supabase (see data/db.js) so every
 * signed-in user has their own private, cloud-synced matches and roster.
 *
 * NOTE: these functions are ASYNC now (they hit the network). Callers must
 * `await` them. The batting/bowling option lists below are plain constants.
 */
import {
  listGames,
  insertGame,
  updateGame,
  deleteGame,
  listPlayers,
  insertPlayer,
  deletePlayerRow,
} from './data/db';

// ---------------------------------------------------------------------------
// Matches & competitions
// ---------------------------------------------------------------------------

/** Every saved game (completed + in-progress), newest first. */
export function loadMatches() {
  return listGames();
}

/** Save a completed match. */
export function saveMatch(state) {
  return insertGame({ kind: 'match', status: 'completed', data: { state } });
}

/** Overwrite a saved completed match (used by the owner's scorecard editor). */
export function updateMatch(id, state) {
  return updateGame(id, { kind: 'match', status: 'completed', data: { state } });
}

/** Save a completed series/tournament. */
export function saveCompetition(comp) {
  return insertGame({ kind: comp.kind, status: 'completed', data: { comp } });
}

/** Overwrite a saved series/tournament (used by the owner's scorecard editor). */
export function updateCompetition(id, comp) {
  return updateGame(id, { kind: comp.kind, status: 'completed', data: { comp } });
}

/**
 * Save a game's progress so it can be resumed later from Match History.
 * Pass an existing `id` to overwrite that in-progress save, or omit it to start
 * a new one. Returns the saved record (use `.id` to keep overwriting it).
 */
export function saveProgress({ id, kind, data }) {
  if (id) return updateGame(id, { kind, status: 'in_progress', data });
  return insertGame({ kind, status: 'in_progress', data });
}

export function deleteMatch(id) {
  return deleteGame(id);
}

// ---------------------------------------------------------------------------
// My Players — a personal roster (name + batting hand + bowling style)
// ---------------------------------------------------------------------------

export const BATTING_HANDS = [
  { id: 'right', label: 'Right-hand' },
  { id: 'left', label: 'Left-hand' },
];

export const BOWLING_STYLES = [
  'Right-arm fast',
  'Right-arm medium',
  'Right-arm off-spin',
  'Right-arm leg-spin',
  'Left-arm fast',
  'Left-arm medium',
  'Left-arm orthodox',
  'Left-arm wrist-spin',
  "Doesn't bowl",
];

export function loadPlayers() {
  return listPlayers();
}

/** Add a player to the roster. Returns { list, player }. */
export async function addPlayer({ name, battingHand, bowlingStyle }) {
  const safeStyle = BOWLING_STYLES.includes(bowlingStyle) ? bowlingStyle : "Doesn't bowl";
  const player = await insertPlayer({ name, battingHand, bowlingStyle: safeStyle });
  const list = await listPlayers();
  return { list, player };
}

export async function deletePlayer(id) {
  await deletePlayerRow(id);
  return listPlayers();
}
