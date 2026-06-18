/**
 * Returns true when `myName` appears in the player roster of `gameData`.
 * Handles match (`gameData.state`), in-progress competition (`activeMatchState`),
 * and saved competitions (`comp.fixtures[*].matchState`).
 */
export function wasPlayerInGame(gameData, myName) {
  if (!myName || !gameData) return false;

  const checkPlayers = (players) => {
    if (!players) return false;
    const all = [...(players.A || []), ...(players.B || [])];
    return all.some((p) => (typeof p === 'string' ? p : p?.name) === myName);
  };

  const checkState = (st) =>
    st?.config?.players ? checkPlayers(st.config.players) : false;

  if (checkState(gameData.state)) return true;
  if (checkState(gameData.activeMatchState)) return true;
  if (gameData.comp?.fixtures) {
    return gameData.comp.fixtures.some((f) => checkState(f.matchState));
  }
  return false;
}
