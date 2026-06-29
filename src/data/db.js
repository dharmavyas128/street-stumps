/**
 * db.js — async data layer backed by Supabase (Postgres).
 *
 * Two tables, both row-level-secured to `auth.uid()` so every user only ever
 * sees their own rows (see supabase/schema.sql):
 *
 *   games(id, user_id, kind, status, data jsonb, created_at, updated_at)
 *     kind   : 'match' | 'series' | 'tournament'
 *     status : 'completed' | 'in_progress'
 *     data   : { state } for a match, { comp, activeMatchState? } for a comp
 *
 *   players(id, user_id, name, batting_hand, bowling_style, created_at)
 *
 * Rows are mapped back to the in-app record shapes the UI already expects:
 *   match  → { id, kind:'match', status, savedAt, state }
 *   comp   → { id, kind:'series'|'tournament', status, savedAt, comp, activeMatchState }
 */
import { supabase, isSupabaseConfigured } from '../supabase';

function ensure() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
}

// ---------------------------------------------------------------------------
// Games (matches + competitions, completed or in-progress)
// ---------------------------------------------------------------------------

function rowToRecord(row) {
  const data = row.data || {};
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    savedAt: row.updated_at || row.created_at,
    sharedScorerId: row.shared_scorer_id ?? null,
    ...data, // spreads state / comp / activeMatchState
  };
}

/**
 * All of the signed-in user's OWN saved games, newest first. The games table's
 * RLS also lets you read friends' games (for live-score watching), so we must
 * explicitly scope to our own user_id here — otherwise a friend's finished games
 * would leak into Match History and career stats.
 */
export async function listGames() {
  if (!isSupabaseConfigured) return [];
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', uid)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToRecord);
}

/** All completed games for a specific user (RLS allows reading accepted friends' games). */
export async function listFriendGames(friendUserId) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', friendUserId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToRecord);
}

/** Insert a new game row; returns its record. */
export async function insertGame({ kind, status, data }) {
  ensure();
  const { data: row, error } = await supabase
    .from('games')
    .insert({ kind, status, data })
    .select()
    .single();
  if (error) throw error;
  return rowToRecord(row);
}

/** Update an existing game row (used to overwrite an in-progress save). */
export async function updateGame(id, { kind, status, data }) {
  ensure();
  const patch = { data, updated_at: new Date().toISOString() };
  if (kind != null) patch.kind = kind;
  if (status != null) patch.status = status;
  const { data: row, error } = await supabase
    .from('games')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToRecord(row);
}

export async function deleteGame(id) {
  ensure();
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Profile (the account's own "self" player — one row per user)
// ---------------------------------------------------------------------------

function rowToProfile(row) {
  return {
    userId: row.user_id,
    name: row.name,
    battingHand: row.batting_hand === 'left' ? 'left' : 'right',
    bowlingStyle: row.bowling_style,
    avatar: row.avatar ?? null,
  };
}

/** The signed-in user's profile, or null if they haven't set one up yet. */
export async function getProfile() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) throw error;
  return data ? rowToProfile(data) : null;
}

/** Create or update the signed-in user's profile. */
export async function upsertProfile({ userId, name, battingHand, bowlingStyle, avatar }) {
  ensure();
  const patch = {
    user_id: userId,
    name: (name || '').trim() || 'Me',
    batting_hand: battingHand === 'left' ? 'left' : 'right',
    bowling_style: bowlingStyle,
    updated_at: new Date().toISOString(),
  };
  // Only touch the avatar column when a value was supplied, so saving other
  // fields never wipes a previously-chosen picture.
  if (avatar !== undefined) patch.avatar = avatar;
  const { data, error } = await supabase
    .from('profiles')
    .upsert(patch, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return rowToProfile(data);
}

// ---------------------------------------------------------------------------
// Players (personal roster)
// ---------------------------------------------------------------------------

function rowToPlayer(row) {
  return {
    id: row.id,
    name: row.name,
    battingHand: row.batting_hand === 'left' ? 'left' : 'right',
    bowlingStyle: row.bowling_style,
  };
}

export async function listPlayers() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToPlayer);
}

export async function insertPlayer({ name, battingHand, bowlingStyle }) {
  ensure();
  const { data: row, error } = await supabase
    .from('players')
    .insert({
      name: (name || '').trim() || 'Unnamed',
      batting_hand: battingHand === 'left' ? 'left' : 'right',
      bowling_style: bowlingStyle,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToPlayer(row);
}

export async function deletePlayerRow(id) {
  ensure();
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Friends — request → accept → mutual friendship (see supabase/schema.sql)
// ---------------------------------------------------------------------------

/**
 * Search for another user by email. Returns their profile plus my relationship
 * to them: `status` ∈ 'none' | 'outgoing' | 'incoming' | 'friends'.
 */
export async function findUserByEmail(email) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('find_profile_by_email', { lookup_email: email });
  if (error) throw error;
  return data?.[0] || null;
}

/** The current user's accepted friends (either direction) with their profile. */
export async function listFriends() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_my_friends');
  if (error) throw error;
  return data || [];
}

/** Incoming pending friend requests, with the requester's profile. */
export async function listFriendRequests() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_friend_requests');
  if (error) throw error;
  return data || [];
}

/**
 * Send a friend request to another user. If they already requested me, this
 * accepts instead. Returns 'requested' | 'accepted' | 'outgoing' | 'friends'.
 */
export async function sendFriendRequest(addresseeId) {
  ensure();
  const { data, error } = await supabase.rpc('send_friend_request', { addressee: addresseeId });
  if (error) throw error;
  return data;
}

/** Accept an incoming request from a given user. */
export async function acceptFriendRequest(otherId) {
  ensure();
  const { error } = await supabase.rpc('accept_friend_request', { other_id: otherId });
  if (error) throw error;
}

/** Remove any relationship with a user — unfriend, decline, or cancel. */
export async function removeFriend(otherId) {
  ensure();
  const { error } = await supabase.rpc('remove_friendship', { other_id: otherId });
  if (error) throw error;
}

/**
 * Subscribe to realtime changes on the friendships table. RLS limits the stream
 * to rows that involve the current user, so `onChange` fires when a request
 * arrives, is accepted, or is removed. Returns an unsubscribe function.
 */
export function subscribeToFriendships(onChange) {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel('friendships-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships' },
      onChange
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Friends' currently-live games (in-progress, recent) with owner name + data. */
export async function listFriendsLiveGames() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_friends_live_games');
  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// Shared scoring — owner grants ONE friend co-scoring rights on a live game
// ---------------------------------------------------------------------------

/** Owner: grant an accepted friend co-scoring rights on an in-progress game. */
export async function shareMatchScoring(gameId, friendId) {
  ensure();
  const { error } = await supabase.rpc('share_match_scoring', {
    p_game_id: gameId,
    p_friend: friendId,
  });
  if (error) throw error;
}

/** Owner: revoke co-scoring on a game. */
export async function unshareMatchScoring(gameId) {
  ensure();
  const { error } = await supabase.rpc('unshare_match_scoring', { p_game_id: gameId });
  if (error) throw error;
}

/**
 * Co-scorer: push a score update to the shared row. Goes through a security
 * definer RPC that only touches the score data (never ownership), so it safely
 * enforces "co-scorer can't save/delete/own". Returns the new updated_at.
 */
export async function coScoreUpdate(gameId, data) {
  ensure();
  const { data: ts, error } = await supabase.rpc('co_score_update', {
    p_game_id: gameId,
    p_data: data,
  });
  if (error) throw error;
  return ts;
}

/** Games shared WITH me to co-score (in-progress), with owner name + data. */
export async function listMatchesSharedWithMe() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_matches_shared_with_me');
  if (error) throw error;
  return data || [];
}

/**
 * Subscribe to realtime changes on the games table. RLS scopes the stream to
 * the user's own games plus accepted friends' games, so `onChange(payload)`
 * fires as a friend scores ball-by-ball. Returns an unsubscribe function.
 */
export function subscribeToGames(onChange) {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel('games-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'games' },
      onChange
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
