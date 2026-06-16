import { useState, useEffect } from 'react';
import { X, Edit2, Check, LogOut, UserPlus, Hand, Disc3, Search, Trash2, User, Users, Palette, Moon, Sun, Clock, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { careerStats } from '../leaderboard';
import {
  findUserByEmail,
  listFriends,
  listFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  insertPlayer,
  listPlayers,
} from '../data/db';
import PlayerForm from './PlayerForm';

const TABS = [
  { id: 'profile', label: 'Personal Info', icon: User },
  { id: 'friends', label: 'Friends',       icon: Users },
  { id: 'theme',   label: 'Theme',         icon: Palette },
];

const BADGES = [
  { id: 'first_match',  label: 'First Match',     emoji: '🏏', check: (s) => s.innings >= 1 },
  { id: 'half_century', label: 'Half-Century',     emoji: '⚡', check: (s) => s.hs >= 50 },
  { id: 'centurion',    label: 'Centurion',        emoji: '💯', check: (s) => s.hs >= 100 },
  { id: 'wicket_taker', label: 'Wicket Taker',     emoji: '🎳', check: (s) => s.wickets >= 1 },
  { id: 'five_for',     label: 'Five-For',         emoji: '🔥', check: (s) => s.wickets >= 5 },
  { id: 'six_machine',  label: 'Six Machine',      emoji: '💥', check: (s) => s.sixes >= 5 },
  { id: 'veteran',      label: '10-Match Veteran', emoji: '🏆', check: (s) => s.innings >= 10 },
];

export default function ProfileSheet({ open, onClose, initialTab = 'profile', onRequestsChange, refreshSignal = 0, onPlayersChanged }) {
  const { user, profile, saveProfile, signOut } = useAuth();

  const [tab, setTab] = useState('profile');
  const [theme, setTheme] = useState(() => localStorage.getItem('ss_theme') || 'dark');

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('ss_theme', theme);
  }, [theme]);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Stats
  const [myStats, setMyStats] = useState(null);

  // Friends + requests
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [playerNames, setPlayerNames] = useState(new Set()); // roster names (lowercased)
  const [addingPlayer, setAddingPlayer] = useState(null);     // friend_id being added

  // Open to the requested tab each time the sheet is shown.
  useEffect(() => { if (open) setTab(initialTab); }, [open, initialTab]);

  useEffect(() => {
    if (!open) { setEditing(false); return; }
    careerStats()
      .then((all) => setMyStats(all.find((p) => p.name === profile?.name) || null))
      .catch(() => {});
    refreshFriends();
    refreshRequests();
    refreshPlayerNames();
    // refreshSignal bumps on a realtime change so an open sheet stays in sync.
  }, [open, profile?.name, refreshSignal]);

  async function refreshFriends() {
    try { setFriends(await listFriends()); } catch {}
  }

  async function refreshPlayerNames() {
    try {
      const ps = await listPlayers();
      setPlayerNames(new Set(ps.map((p) => (p.name || '').trim().toLowerCase())));
    } catch {}
  }

  const handleAddAsPlayer = async (f) => {
    if (addingPlayer) return;
    setAddingPlayer(f.friend_id);
    try {
      await insertPlayer({
        name: f.name,
        battingHand: f.batting_hand === 'left' ? 'left' : 'right',
        bowlingStyle: f.bowling_style,
      });
      setPlayerNames((prev) => new Set(prev).add((f.name || '').trim().toLowerCase()));
      onPlayersChanged?.();
    } catch {} finally {
      setAddingPlayer(null);
    }
  };

  async function refreshRequests() {
    try {
      const r = await listFriendRequests();
      setRequests(r);
      onRequestsChange?.(r.length);
    } catch {}
  }

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const found = await findUserByEmail(searchEmail.trim());
      setSearchResult({ found: !!found, data: found });
    } catch {
      setSearchResult({ found: false });
    } finally {
      setSearching(false);
    }
  };

  // Search-result action: send a request, or accept if they already asked me.
  const handleResultAction = async () => {
    const r = searchResult?.data;
    if (!r || actioning) return;
    setActioning(true);
    try {
      if (r.status === 'incoming') {
        await acceptFriendRequest(r.user_id);
        setSearchResult({ found: true, data: { ...r, status: 'friends' } });
        await refreshFriends();
        await refreshRequests();
      } else if (r.status === 'none') {
        const res = await sendFriendRequest(r.user_id);
        const next = res === 'accepted' || res === 'friends' ? 'friends' : 'outgoing';
        setSearchResult({ found: true, data: { ...r, status: next } });
        if (next === 'friends') await refreshFriends();
      }
    } catch {} finally {
      setActioning(false);
    }
  };

  const handleAccept = async (otherId) => {
    try {
      await acceptFriendRequest(otherId);
      setRequests((prev) => {
        const next = prev.filter((r) => r.user_id !== otherId);
        onRequestsChange?.(next.length);
        return next;
      });
      await refreshFriends();
    } catch {}
  };

  const handleDecline = async (otherId) => {
    try {
      await removeFriend(otherId);
      setRequests((prev) => {
        const next = prev.filter((r) => r.user_id !== otherId);
        onRequestsChange?.(next.length);
        return next;
      });
    } catch {}
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId);
      setFriends((prev) => prev.filter((f) => f.friend_id !== friendId));
    } catch {}
  };

  if (!open) return null;

  const initials = (profile?.name || user?.email || '?').charAt(0).toUpperCase();
  const last5 = myStats?.last5 || [];
  const achievements = BADGES.map((b) => ({ ...b, earned: myStats ? b.check(myStats) : false }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl animate-slide-up">

        {/* ── Drag handle ── */}
        <div className="flex shrink-0 justify-center pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* ── Profile header (always visible) ── */}
        <div className="shrink-0 flex items-center gap-3 px-5 pb-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neon/15 text-xl font-extrabold text-neon ring-1 ring-neon/30">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{profile?.name || 'You'}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="btn-press grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="shrink-0 px-5 pb-3">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const showBadge = id === 'friends' && requests.length > 0;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`btn-press relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    active
                      ? 'bg-neon/15 text-neon ring-1 ring-neon/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  {showBadge && (
                    <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-crimson px-1 text-[9px] font-bold text-white">
                      {requests.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable tab content ── */}
        <div className="scroll-slim flex-1 overflow-y-auto px-5 pb-10">

          {/* ═══ TAB 1: Personal Info ═══ */}
          {tab === 'profile' && (
            <div className="space-y-5">

              {/* Batting / bowling row + edit toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[12px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Hand size={11} />
                    {profile?.battingHand === 'left' ? 'Left-hand bat' : 'Right-hand bat'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1">
                    <Disc3 size={11} />
                    {profile?.bowlingStyle}
                  </span>
                </div>
                <button
                  onClick={() => setEditing((v) => !v)}
                  className={`btn-press flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    editing
                      ? 'border-neon/40 bg-neon/10 text-neon'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {editing ? <Check size={12} /> : <Edit2 size={12} />}
                  {editing ? 'Done' : 'Edit'}
                </button>
              </div>

              {/* Edit form */}
              {editing && (
                <div className="glass animate-pop-in rounded-2xl p-4">
                  <PlayerForm
                    initial={profile}
                    submitLabel="Save changes"
                    busy={busy}
                    onSubmit={async (data) => {
                      setBusy(true);
                      try { await saveProfile(data); setEditing(false); }
                      finally { setBusy(false); }
                    }}
                  />
                </div>
              )}

              {/* Career Stats */}
              <section>
                <SectionLabel>Career Stats</SectionLabel>
                {myStats ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Innings', value: myStats.innings, decimals: 0 },
                      { label: 'Runs',    value: myStats.runs, decimals: 0 },
                      { label: 'Wkts',    value: myStats.wickets, decimals: 0 },
                      { label: 'Avg',     value: myStats.outs > 0 ? myStats.runs / myStats.outs : null, decimals: 1 },
                    ].map(({ label, value, decimals }) => (
                      <div key={label} className="glass rounded-xl p-3 text-center">
                        <p className="scoreboard text-lg font-extrabold text-neon">
                          <CountUp value={value} decimals={decimals} />
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-4 text-center text-xs text-slate-500">
                    Play a match to see your stats here
                  </div>
                )}
              </section>

              {/* Recent Form */}
              {last5.length > 0 && (
                <section>
                  <SectionLabel>Recent Form — last {last5.length} innings</SectionLabel>
                  <div className="flex gap-2">
                    {last5.map((runs, i) => {
                      const colour =
                        runs >= 50 ? 'bg-neon/15 text-neon ring-neon/30' :
                        runs >= 20 ? 'bg-amber-300/10 text-amber-300 ring-amber-300/20' :
                                     'bg-white/5 text-slate-400 ring-white/10';
                      return (
                        <div key={i} className={`scoreboard flex-1 rounded-xl py-2.5 text-center text-sm font-bold ring-1 ${colour}`}>
                          {runs}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Best Performances */}
              {myStats && (myStats.hs > 0 || myStats.wickets > 0) && (
                <section>
                  <SectionLabel>Best Performances</SectionLabel>
                  <div className="glass divide-y divide-white/[0.06] rounded-2xl">
                    {myStats.hs > 0       && <PerfRow label="Highest Score"  value={myStats.hs} />}
                    {myStats.sr > 0       && <PerfRow label="Strike Rate"    value={myStats.sr.toFixed(1)} />}
                    {myStats.wickets > 0  && <PerfRow label="Total Wickets"  value={myStats.wickets} />}
                    {myStats.econ != null && <PerfRow label="Economy Rate"   value={myStats.econ.toFixed(2)} />}
                    {myStats.sixes > 0    && <PerfRow label="Sixes Hit"      value={myStats.sixes} />}
                  </div>
                </section>
              )}

              {/* Achievements */}
              <section>
                <SectionLabel>Achievements</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {achievements.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                        b.earned
                          ? 'bg-neon/15 text-neon ring-neon/30'
                          : 'bg-white/[0.03] text-slate-600 ring-white/[0.08]'
                      }`}
                    >
                      <span className={b.earned ? '' : 'opacity-30'}>{b.emoji}</span>
                      {b.label}
                    </div>
                  ))}
                </div>
              </section>

              {/* Sign out */}
              <button
                onClick={signOut}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-crimson/30 bg-crimson/[0.08] py-3.5 text-sm font-semibold text-crimson-soft"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}

          {/* ═══ TAB 2: Friends ═══ */}
          {tab === 'friends' && (
            <div className="space-y-4">

              {/* Incoming friend requests */}
              {requests.length > 0 && (
                <section className="space-y-2">
                  <SectionLabel>
                    {requests.length} Friend Request{requests.length !== 1 ? 's' : ''}
                  </SectionLabel>
                  {requests.map((r) => (
                    <div key={r.request_id} className="glass animate-pop-in flex items-center gap-3 rounded-xl px-3 py-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-azure/10 text-sm font-bold text-azure ring-1 ring-azure/30">
                        {(r.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{r.name}</p>
                        <p className="text-[11px] text-slate-500">wants to be friends</p>
                      </div>
                      <button
                        onClick={() => handleAccept(r.user_id)}
                        aria-label="Accept request"
                        className="btn-press grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-neon/30 bg-neon/10 text-neon"
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleDecline(r.user_id)}
                        aria-label="Decline request"
                        className="btn-press grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500 hover:border-crimson/30 hover:text-crimson"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </section>
              )}

              <div className="flex gap-2">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by email address"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-neon/40 focus:ring-1 focus:ring-neon/20"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchEmail.trim()}
                  className="btn-press flex shrink-0 items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 px-4 py-2.5 text-sm font-bold text-neon disabled:opacity-40"
                >
                  <Search size={14} />
                  Find
                </button>
              </div>

              {searchResult && (
                <div className="glass animate-pop-in rounded-2xl p-3">
                  {searchResult.found ? (
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-sm font-bold text-neon ring-1 ring-neon/20">
                        {searchResult.data.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-100">{searchResult.data.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {searchResult.data.batting_hand === 'left' ? 'LHB' : 'RHB'} · {searchResult.data.bowling_style}
                        </p>
                      </div>
                      {(() => {
                        const st = searchResult.data.status;
                        if (st === 'friends') {
                          return (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 px-3 py-2 text-xs font-bold text-neon">
                              <Check size={13} strokeWidth={2.5} /> Friends
                            </span>
                          );
                        }
                        if (st === 'outgoing') {
                          return (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400">
                              <Clock size={13} /> Requested
                            </span>
                          );
                        }
                        const incoming = st === 'incoming';
                        return (
                          <button
                            onClick={handleResultAction}
                            disabled={actioning}
                            className="btn-press flex shrink-0 items-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 px-3 py-2 text-xs font-bold text-neon disabled:opacity-40"
                          >
                            {incoming ? <Check size={13} strokeWidth={2.5} /> : <UserPlus size={13} />}
                            {incoming ? 'Accept' : 'Request'}
                          </button>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="py-1 text-center text-xs text-slate-500">No user found with that email</p>
                  )}
                </div>
              )}

              {friends.length > 0 ? (
                <div className="space-y-2">
                  <SectionLabel>{friends.length} Friend{friends.length !== 1 ? 's' : ''}</SectionLabel>
                  {friends.map((f) => {
                    const added = playerNames.has((f.name || '').trim().toLowerCase());
                    const busy = addingPlayer === f.friend_id;
                    return (
                      <div key={f.friend_id} className="glass flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-sm font-bold text-neon ring-1 ring-neon/20">
                          {(f.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-100">{f.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {f.batting_hand === 'left' ? 'LHB' : 'RHB'} · {f.bowling_style}
                          </p>
                        </div>
                        {added ? (
                          <span className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                            <UserCheck size={13} /> Player
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddAsPlayer(f)}
                            disabled={busy}
                            aria-label={`Add ${f.name} as a player`}
                            className="btn-press flex shrink-0 items-center gap-1 rounded-lg border border-neon/30 bg-neon/10 px-2 py-1.5 text-[11px] font-bold text-neon disabled:opacity-50"
                          >
                            {busy ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                            Player
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFriend(f.friend_id)}
                          aria-label={`Remove ${f.name}`}
                          className="btn-press grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-500 hover:border-crimson/30 hover:text-crimson"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !searchResult && (
                  <div className="glass rounded-2xl p-6 text-center">
                    <Users size={28} className="mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">No friends yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Enter a friend's email above to find and add them
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* ═══ TAB 3: Theme ═══ */}
          {tab === 'theme' && (
            <div className="space-y-4">
              <SectionLabel>Appearance</SectionLabel>

              <div className="grid grid-cols-2 gap-3">
                {/* Dark */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`btn-press flex flex-col items-center gap-3 rounded-2xl border py-6 transition ${
                    theme === 'dark'
                      ? 'border-neon/40 bg-neon/10 shadow-glow-green'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${
                    theme === 'dark' ? 'bg-neon/20 text-neon' : 'bg-white/5 text-slate-400'
                  }`}>
                    <Moon size={24} />
                  </span>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-neon' : 'text-slate-300'}`}>Dark</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Midnight stadium</p>
                  </div>
                  {theme === 'dark' && (
                    <span className="rounded-full bg-neon/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon">
                      Active
                    </span>
                  )}
                </button>

                {/* Light */}
                <button
                  onClick={() => setTheme('light')}
                  className={`btn-press flex flex-col items-center gap-3 rounded-2xl border py-6 transition ${
                    theme === 'light'
                      ? 'border-neon/40 bg-neon/10 shadow-glow-green'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${
                    theme === 'light' ? 'bg-neon/20 text-neon' : 'bg-white/5 text-slate-400'
                  }`}>
                    <Sun size={24} />
                  </span>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${theme === 'light' ? 'text-neon' : 'text-slate-300'}`}>Light</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">Daytime pitch</p>
                  </div>
                  {theme === 'light' && (
                    <span className="rounded-full bg-neon/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon">
                      Active
                    </span>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-500">
                Neon green accents stay in both themes.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </p>
  );
}

function PerfRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="scoreboard font-bold text-neon">{value}</span>
    </div>
  );
}

/* Animates a number from 0 → value on mount (sheet open / stats load). */
function CountUp({ value, decimals = 0, fallback = '—' }) {
  const target = typeof value === 'number' ? value : NaN;
  const finite = Number.isFinite(target);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!finite) return;
    let raf;
    const start = performance.now();
    const dur = 650;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, finite]);

  if (!finite) return <>{fallback}</>;
  return <>{display.toFixed(decimals)}</>;
}
