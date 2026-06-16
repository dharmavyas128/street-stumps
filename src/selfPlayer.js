/**
 * selfPlayer.js — turn the account profile into a pickable "self" player so the
 * user can tap themselves into a team. Shared by the 1v1/series and tournament
 * pickers. Uses a fixed id ('self') since there's only ever one of you.
 */
export function selfAsPlayer(profile) {
  if (!profile) return null;
  return {
    id: 'self',
    name: profile.name,
    battingHand: profile.battingHand,
    bowlingStyle: profile.bowlingStyle,
    isSelf: true,
  };
}

/** Roster with the self profile prepended (if there is one). */
export function withSelf(roster, profile) {
  const self = selfAsPlayer(profile);
  return self ? [self, ...roster] : roster;
}
