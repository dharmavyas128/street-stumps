import { useState, useEffect } from 'react';
import { X, Edit2, Check, LogOut, UserPlus, Hand, Disc3, Search, Trash2, User, Users, Palette, Moon, Sun, Clock, UserCheck, Loader2, Sparkles, Mail, Shuffle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { careerStatsByFormat } from '../leaderboard';
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
import PlayerStatsCard from './PlayerStatsCard';
import PlayerStatsSheet from './PlayerStatsSheet';
import DiceBearAvatar from './DiceBearAvatar';
import {
  BG_OPTIONS, SKIN_OPTIONS, SHIRT_OPTIONS, HAIR_COLOR_OPTIONS,
  BEARD_COLOR_OPTIONS, TOP_OPTIONS, BEARD_OPTIONS,
  isHatTop, makeConfig, randomizeConfig, configToString, parseConfig,
} from '../avatars';

const TABS = [
  { id: 'profile', label: 'Personal Info', icon: User },
  { id: 'friends', label: 'Friends',       icon: Users },
  { id: 'theme',   label: 'Theme',         icon: Palette },
];

export default function ProfileSheet({ open, onClose, initialTab = 'profile', onRequestsChange, refreshSignal = 0, onPlayersChanged, onStartTutorial }) {
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
  const [avatarCfg, setAvatarCfg] = useState(() => parseConfig(profile?.avatar));

  // Stats — per-format ({ all, limited, test }) for the format toggle.
  const [myStats, setMyStats] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null); // { name, subtitle, avatar } | null

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

  // Keep the editable avatar in sync with the saved profile.
  useEffect(() => { setAvatarCfg(parseConfig(profile?.avatar)); }, [profile?.avatar, editing]);

  useEffect(() => {
    if (!open) { setEditing(false); return; }
    careerStatsByFormat()
      .then((sets) => {
        const pick = (arr) => arr.find((p) => p.name === profile?.name) || null;
        setMyStats({ all: pick(sets.all), limited: pick(sets.limited), test: pick(sets.test) });
      })
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
          {parseConfig(profile?.avatar) ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl ring-1 ring-neon/30">
              <DiceBearAvatar config={profile.avatar} size={48} className="h-full w-full" />
            </div>
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neon/15 text-xl font-extrabold text-neon ring-1 ring-neon/30">
              {initials}
            </span>
          )}
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
          <div data-tour="profile-tabs" className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
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
                <div className="glass animate-pop-in space-y-4 rounded-2xl p-4">
                  {/* Avatar builder */}
                  <div className="space-y-4">
                    <SectionLabel>Profile picture</SectionLabel>

                    {/* Preview + action buttons */}
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-neon/40">
                        {avatarCfg ? (
                          <DiceBearAvatar config={avatarCfg} size={80} className="h-full w-full" />
                        ) : (
                          <div className="grid h-full w-full place-items-center bg-neon/15 text-2xl font-extrabold text-neon">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setAvatarCfg(randomizeConfig())}
                          className="btn-press flex w-full items-center justify-center gap-1.5 rounded-xl border border-neon/30 bg-neon/10 py-2 text-xs font-bold text-neon"
                        >
                          <Shuffle size={13} /> Randomize
                        </button>
                        {avatarCfg ? (
                          <button
                            type="button"
                            onClick={() => setAvatarCfg(null)}
                            className="btn-press flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-slate-400"
                          >
                            Use initials
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAvatarCfg(makeConfig())}
                            className="btn-press flex w-full items-center justify-center rounded-xl border border-neon/30 bg-neon/10 py-2 text-xs font-bold text-neon"
                          >
                            Create avatar
                          </button>
                        )}
                      </div>
                    </div>

                    {avatarCfg && (
                      <>
                        {/* Skin tone */}
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Skin Tone</p>
                          <div className="flex flex-wrap gap-2">
                            {SKIN_OPTIONS.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setAvatarCfg((c) => ({ ...c, skin: s.id }))}
                                style={{ background: s.hex }}
                                aria-label={s.id}
                                className={`h-8 w-8 rounded-full ring-2 transition ${avatarCfg.skin === s.id ? 'scale-110 ring-neon' : 'ring-white/20 hover:ring-white/40'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Background */}
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Background</p>
                          <div className="flex gap-2">
                            {BG_OPTIONS.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setAvatarCfg((c) => ({ ...c, bg: b.id }))}
                                style={{ background: b.hex }}
                                aria-label={b.id}
                                className={`h-8 w-8 rounded-full ring-2 transition ${avatarCfg.bg === b.id ? 'scale-110 ring-neon' : 'ring-white/20 hover:ring-white/40'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* T-shirt colour */}
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">T-Shirt</p>
                          <div className="flex flex-wrap gap-2">
                            {SHIRT_OPTIONS.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setAvatarCfg((c) => ({ ...c, shirt: s.id }))}
                                style={{ background: s.hex }}
                                aria-label={s.id}
                                className={`h-8 w-8 rounded-full ring-2 transition ${avatarCfg.shirt === s.id ? 'scale-110 ring-neon' : 'ring-white/20 hover:ring-white/40'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Hair style — horizontal scroll with mini avatar previews */}
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Hair / Style</p>
                          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                            {TOP_OPTIONS.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setAvatarCfg((c) => ({ ...c, top: t.id }))}
                                className={`flex flex-none flex-col items-center gap-1 rounded-xl px-1 py-1.5 ring-2 transition ${
                                  avatarCfg.top === t.id ? 'bg-neon/5 ring-neon' : 'ring-transparent hover:ring-white/20'
                                }`}
                              >
                                <div className="h-12 w-12 overflow-hidden rounded-full">
                                  <DiceBearAvatar config={{ ...avatarCfg, top: t.id }} size={48} className="h-full w-full" />
                                </div>
                                <span className="whitespace-nowrap text-[9px] text-slate-400">{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hair color — hidden for hats/hijab/turban */}
                        {!isHatTop(avatarCfg.top) && (
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Hair Color</p>
                            <div className="flex flex-wrap gap-2">
                              {HAIR_COLOR_OPTIONS.map((h) => (
                                <button
                                  key={h.id}
                                  type="button"
                                  onClick={() => setAvatarCfg((c) => ({ ...c, hair: h.id }))}
                                  style={{ background: h.hex }}
                                  aria-label={h.id}
                                  className={`h-8 w-8 rounded-full ring-2 transition ${avatarCfg.hair === h.id ? 'scale-110 ring-neon' : 'ring-white/20 hover:ring-white/40'}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Beard style + colour — hidden for hats/hijab/turban */}
                        {!isHatTop(avatarCfg.top) && (
                          <>
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Beard</p>
                              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                                {/* Clean-shaven option */}
                                <button
                                  type="button"
                                  onClick={() => setAvatarCfg((c) => ({ ...c, beard: false }))}
                                  className={`flex flex-none flex-col items-center gap-1 rounded-xl px-1 py-1.5 ring-2 transition ${
                                    !avatarCfg.beard ? 'bg-neon/5 ring-neon' : 'ring-transparent hover:ring-white/20'
                                  }`}
                                >
                                  <div className="h-12 w-12 overflow-hidden rounded-full">
                                    <DiceBearAvatar config={{ ...avatarCfg, beard: false }} size={48} className="h-full w-full" />
                                  </div>
                                  <span className="whitespace-nowrap text-[9px] text-slate-400">None</span>
                                </button>
                                {BEARD_OPTIONS.map((b) => (
                                  <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => setAvatarCfg((c) => ({ ...c, beard: b.id }))}
                                    className={`flex flex-none flex-col items-center gap-1 rounded-xl px-1 py-1.5 ring-2 transition ${
                                      avatarCfg.beard === b.id ? 'bg-neon/5 ring-neon' : 'ring-transparent hover:ring-white/20'
                                    }`}
                                  >
                                    <div className="h-12 w-12 overflow-hidden rounded-full">
                                      <DiceBearAvatar config={{ ...avatarCfg, beard: b.id }} size={48} className="h-full w-full" />
                                    </div>
                                    <span className="whitespace-nowrap text-[9px] text-slate-400">{b.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Beard colour — only when a beard is selected */}
                            {avatarCfg.beard && (
                              <div>
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Beard Color</p>
                                <div className="flex flex-wrap gap-2">
                                  {BEARD_COLOR_OPTIONS.map((h) => (
                                    <button
                                      key={h.id}
                                      type="button"
                                      onClick={() => setAvatarCfg((c) => ({ ...c, beardColor: h.id }))}
                                      style={{ background: h.hex }}
                                      aria-label={h.id}
                                      className={`h-8 w-8 rounded-full ring-2 transition ${avatarCfg.beardColor === h.id ? 'scale-110 ring-neon' : 'ring-white/20 hover:ring-white/40'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <PlayerForm
                    initial={profile}
                    submitLabel="Save changes"
                    busy={busy}
                    onSubmit={async (data) => {
                      setBusy(true);
                      try { await saveProfile({ ...data, avatar: configToString(avatarCfg) }); setEditing(false); }
                      finally { setBusy(false); }
                    }}
                  />
                </div>
              )}

              {/* Career stats, recent form, best performances & achievements */}
              <PlayerStatsCard byFormat={myStats} emptyMessage="Play a match to see your stats here" />

              {/* Tutorial */}
              <button
                onClick={onStartTutorial}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-neon/20 bg-neon/[0.06] py-3.5 text-sm font-semibold text-neon"
              >
                <Sparkles size={15} />
                Start Tutorial
              </button>

              {/* Contact */}
              <a
                href="mailto:dharmavyas128@gmail.com?subject=Street%20Stumps%20Feedback"
                className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-slate-300 hover:border-white/20 hover:text-white"
              >
                <Mail size={15} />
                Contact us
              </a>

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
                      {parseConfig(r.avatar) ? (
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-azure/30">
                          <DiceBearAvatar config={r.avatar} size={36} className="h-full w-full" />
                        </div>
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-azure/10 text-sm font-bold text-azure ring-1 ring-azure/30">
                          {(r.name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
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
                      {parseConfig(searchResult.data.avatar) ? (
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-neon/20">
                          <DiceBearAvatar config={searchResult.data.avatar} size={36} className="h-full w-full" />
                        </div>
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-sm font-bold text-neon ring-1 ring-neon/20">
                          {searchResult.data.name.charAt(0).toUpperCase()}
                        </span>
                      )}
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
                        <button
                          onClick={() =>
                            setViewPlayer({
                              name: f.name,
                              subtitle: `${f.batting_hand === 'left' ? 'LHB' : 'RHB'} · ${f.bowling_style}`,
                              avatar: f.avatar,
                              userId: f.friend_id,
                            })
                          }
                          className="btn-press flex min-w-0 flex-1 items-center gap-2.5 text-left"
                        >
                          {parseConfig(f.avatar) ? (
                            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-neon/20">
                              <DiceBearAvatar config={f.avatar} size={36} className="h-full w-full" />
                            </div>
                          ) : (
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/10 text-sm font-bold text-neon ring-1 ring-neon/20">
                              {(f.name || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-100">{f.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {f.batting_hand === 'left' ? 'LHB' : 'RHB'} · {f.bowling_style}
                            </p>
                          </div>
                        </button>
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

      {/* Tap a friend to see their career record */}
      <PlayerStatsSheet
        open={!!viewPlayer}
        name={viewPlayer?.name}
        subtitle={viewPlayer?.subtitle}
        avatar={viewPlayer?.avatar}
        userId={viewPlayer?.userId}
        onClose={() => setViewPlayer(null)}
      />
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

