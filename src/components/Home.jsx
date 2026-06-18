import { useState } from 'react';
import { Swords, Trophy, ListOrdered, History, ChevronRight, Clock, Users, BarChart3, Bell, Radio, Eye, X, Lock, UserPlus } from 'lucide-react';
import Logo from './Logo';
import { getMatchContext } from '../engine/matchEngine';
import StadiumBackdrop from './StadiumBackdrop';
import { useTheme } from '../hooks/useTheme';

/**
 * Home — landing page. Pick a game mode, manage your player roster, view the
 * leaderboard, or jump into the saved Match History.
 */
export default function Home({
  onPlayQuick,
  onPlaySeries,
  onPlayTournament,
  onOpenPlayers,
  onOpenLeaderboard,
  onOpenHistory,
  onOpenProfile,
  onOpenRequests,
  requestCount = 0,
  liveGames = [],
  onWatch,
  completedFriendGames = [],
  onViewCompleted,
  onDismissCompleted,
  playerCount = 0,
  historyCount = 0,
  userEmail,
  userName,
  isGuest = false,
  onSignUp,
}) {
  const isLight = useTheme();
  const [showLockSheet, setShowLockSheet] = useState(false);
  const lock = () => setShowLockSheet(true);

  return (
    <div className="space-y-5">
      {/* Profile avatar bar + notification bell */}
      {userEmail && (
        <div className="flex items-center justify-between pt-1 animate-pop-in [animation-fill-mode:backwards]">
          <button onClick={onOpenProfile} data-tour="profile-bar" className="btn-press flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/15 text-neon ring-1 ring-neon/30 text-sm font-extrabold">
              {(userName || userEmail).charAt(0).toUpperCase()}
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{userName || 'Profile'}</p>
              <p className="text-[10px] text-slate-500">Tap to view profile</p>
            </div>
          </button>

          {isGuest ? (
            <button
              onClick={lock}
              className="btn-press flex items-center gap-1.5 rounded-xl border border-neon/20 bg-neon/[0.06] px-3 py-2 text-xs font-semibold text-neon"
            >
              <UserPlus size={14} />
              Sign up
            </button>
          ) : (
            <button
              onClick={onOpenRequests}
              aria-label={requestCount > 0 ? `${requestCount} friend requests` : 'Friend requests'}
              className="btn-press relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
            >
              <Bell size={18} className={requestCount > 0 ? 'text-neon' : ''} />
              {requestCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-crimson px-1 text-[10px] font-bold text-white ring-2 ring-midnight">
                  {requestCount > 9 ? '9+' : requestCount}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Hero */}
      <div
        className="card-hero glass-box hero-float relative overflow-hidden p-7 text-center animate-pop-in [animation-fill-mode:backwards]"
        style={{ animationDelay: '60ms' }}
      >
        {/* ── Liquid glass atmosphere ─────────────────────────────────────
             Multiple light layers simulate glass refracting a stadium floodlight:
             caustic blob, off-axis highlight, two angled glass bands, a slow
             ambient sweep, and a bottom depth gradient. */}
        <div className="pointer-events-none absolute inset-0">

          {/* Layer 1: ambient green field glow drifting behind logo */}
          <div className="absolute -top-20 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-neon/15 blur-3xl animate-drift" />

          {/* Layer 2: floodlight cone from above */}
          <div
            className="absolute -top-10 left-1/2 h-44 w-80 -translate-x-1/2 opacity-40"
            style={{ background: 'radial-gradient(closest-side, rgba(191,219,254,0.20), transparent 70%)' }}
          />

          {/* Layer 3: bright caustic — intense white blob at top-centre,
               like a focused light source catching the glass face-on */}
          <div className="absolute -top-6 left-1/2 h-28 w-52 -translate-x-1/2 rounded-full bg-white/[0.06] blur-2xl" />

          {/* Layer 4: off-axis refractive highlight — upper-right,
               simulates a second light bouncing off an angled surface */}
          <div className="absolute right-4 top-2 h-16 w-16 rounded-full bg-white/[0.055] blur-xl" />

          {/* Layer 5: primary diagonal glass band — a sharp hairline
               running upper-left to centre, the main specular streak */}
          <div
            className="absolute -left-4 top-6 h-[2px] w-60 bg-white/[0.22] blur-[1.5px]"
            style={{ transform: 'rotate(22deg)', transformOrigin: 'left center' }}
          />

          {/* Layer 6: secondary diagonal band — softer, offset lower */}
          <div
            className="absolute right-0 top-16 h-[1.5px] w-36 bg-white/[0.09] blur-[1px]"
            style={{ transform: 'rotate(22deg)', transformOrigin: 'left center' }}
          />

          {/* Layer 7: slow continuous liquid sweep — a wide light band
               drifting across the surface on a 7 s loop with a long pause */}
          <div
            className="absolute inset-y-0 w-28 animate-liquid-sweep"
            style={{
              background:
                'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.045) 50%, transparent 80%)',
            }}
          />

          {/* Layer 8: bottom depth fade — glass reads thicker at the base */}
          <div
            className="absolute bottom-0 inset-x-0 h-20 rounded-b-3xl"
            style={{ background: isLight
              ? 'linear-gradient(to top, rgba(15,23,42,0.04), transparent)'
              : 'linear-gradient(to top, rgba(0,0,0,0.18), transparent)' }}
          />

          {/* Layer 9: soft lens glow — a faint cool bloom drifting slowly along
               the top-right curved edge, like a lens flare catching the glass.
               Very low opacity; the drift keeps it cinematic, never neon. */}
          <div
            className="absolute -top-4 right-2 h-20 w-20 rounded-full opacity-60 animate-drift"
            style={{
              background: 'radial-gradient(closest-side, rgba(255,255,255,0.10), rgba(191,219,254,0.05) 45%, transparent 72%)',
              animationDuration: '13s',
            }}
          />
        </div>
        <span className="relative mx-auto grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-neon/15 text-neon ring-1 ring-neon/30 shadow-glow-green">
          <Logo size={34} />
        </span>
        <h1 className="relative mt-3 text-2xl font-extrabold tracking-tight">
          {'STREET'.split('').map((letter, i) => (
            <span
              key={`st${i}`}
              className="inline-block text-white"
              style={{ animation: `letter-up 0.32s ease-out ${80 + i * 38}ms both` }}
            >
              {letter}
            </span>
          ))}
          {/* controlled inter-word gap */}
          <span className="inline-block" style={{ width: '0.33em' }} />
          {'STUMPS'.split('').map((letter, i) => (
            <span
              key={`su${i}`}
              className="inline-block wordmark-accent"
              style={{
                animation: `letter-up 0.32s ease-out ${310 + i * 38}ms both, stumps-glow 3s ease-in-out 860ms infinite`,
              }}
            >
              {letter}
            </span>
          ))}
        </h1>
        <p
          className="relative mt-1 text-xs uppercase tracking-[0.25em] text-slate-400 animate-pop-in [animation-fill-mode:backwards]"
          style={{ animationDelay: '900ms' }}
        >
          Backyard to Box Office
        </p>
      </div>

      {/* Live now — friends' in-progress games */}
      {liveGames.length > 0 && (
        <div
          className="space-y-3 animate-pop-in [animation-fill-mode:backwards]"
          style={{ animationDelay: '90ms' }}
        >
          <p className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5 text-crimson">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse-glow" />
              Live
            </span>
            now
          </p>
          {liveGames.map((g) => (
            <button
              key={g.game_id}
              onClick={() => onWatch?.(g)}
              className="btn-press lift group card-action elev-action-gold flex w-full items-center gap-3 border-crimson/30 p-4 text-left"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-crimson/15 text-crimson ring-1 ring-crimson/30">
                <Radio size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">{g.owner_name}</span>
                  <span className="rounded-full bg-crimson/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crimson-soft">
                    Live
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-400">{liveLabel(g)}</span>
              </span>
              <Eye size={18} className="shrink-0 text-crimson-soft transition group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}

      {/* Completed friend games the user was a player in */}
      {completedFriendGames.length > 0 && (
        <div
          className="space-y-3 animate-pop-in [animation-fill-mode:backwards]"
          style={{ animationDelay: '110ms' }}
        >
          <p className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <Trophy size={12} className="text-neon" />
            Played in
          </p>
          {completedFriendGames.map((g) => (
            <div
              key={g.game_id}
              className="card-action elev-action-green flex items-center gap-3 border-neon/25 p-4"
            >
              <button
                onClick={() => onViewCompleted?.(g)}
                className="btn-press flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/15 text-neon ring-1 ring-neon/30">
                  <Trophy size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">
                    {g.owner_name ? `${g.owner_name}'s game` : "Friend's game"}
                  </span>
                  <span className="block text-xs text-neon">Tap to view scorecard</span>
                </span>
              </button>
              <button
                onClick={() => onDismissCompleted?.(g.game_id)}
                aria-label="Dismiss"
                className="btn-press grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Game modes — stadium backdrop floats behind the three format cards */}
      <div className="relative">
        {/* Aerial stadium view with crowd — dark mode only */}
        {!isLight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-4 -top-6 -bottom-4 overflow-hidden rounded-3xl"
            style={{ opacity: 0.38 }}
          >
            <StadiumBackdrop />
          </div>
        )}

        <div className="relative space-y-3">
        <p
          className="px-1 text-xs font-semibold uppercase tracking-widest text-slate-500 animate-pop-in [animation-fill-mode:backwards]"
          style={{ animationDelay: '120ms' }}
        >
          Choose a format
        </p>

        <ModeCard
          icon={Swords}
          title="Quick Match"
          tag="1 v 1"
          variant="quick"
          delay={150}
          tourId="mode-quick"
          description="Fast. Sharp. One game decides it. Set your rules, flip the toss, and play."
          onClick={onPlayQuick}
        />

        <ModeCard
          icon={ListOrdered}
          title="Series"
          tag="Best of 3 / 5 / 7"
          variant="series"
          delay={190}
          tourId="mode-series"
          description="Two sides. Multiple games. Hold your nerve and win the majority."
          onClick={isGuest ? lock : onPlaySeries}
          isLocked={isGuest}
        />

        <ModeCard
          icon={Trophy}
          title="Tournament"
          tag="3–6 teams"
          variant="tournament"
          delay={230}
          tourId="mode-tournament"
          description="Round-robin league among several teams, then a knockout final."
          onClick={isGuest ? lock : onPlayTournament}
          isLocked={isGuest}
        />
        </div>{/* end relative space-y-3 */}
      </div>{/* end relative stadium wrapper */}

      {/* Guest sign-up lock sheet */}
      {showLockSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <button aria-label="Close" onClick={() => setShowLockSheet(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="glass-strong relative z-10 w-full max-w-md rounded-t-3xl p-6 pb-10 animate-slide-up space-y-4">
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
            <div className="flex flex-col items-center gap-2 pt-1 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neon/10 text-neon ring-1 ring-neon/20">
                <Lock size={26} />
              </span>
              <h3 className="text-base font-bold text-white">Create a free account</h3>
              <p className="text-xs text-slate-400">
                Sign up to unlock Series, Tournament, My Players, Leaderboard and Match History. It's free.
              </p>
            </div>
            <button
              onClick={() => { setShowLockSheet(false); onSignUp?.(); }}
              className="btn-press flex w-full items-center justify-center gap-2 rounded-2xl bg-neon py-4 text-base font-bold text-midnight shadow-glow-green"
            >
              <UserPlus size={18} strokeWidth={2.5} />
              Create free account
            </button>
            <button
              onClick={() => setShowLockSheet(false)}
              className="btn-press flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-slate-400"
            >
              Keep playing as guest
            </button>
          </div>
        </div>
      )}

      {/* My Players + History */}
      <div className="space-y-3">
        <UtilRow
          icon={Users}
          title="My Players"
          delay={290}
          tourId="util-players"
          subtitle={
            isGuest ? 'Sign up to manage your roster' :
            playerCount > 0
              ? `${playerCount} player${playerCount === 1 ? '' : 's'} in your roster`
              : 'Add players to pick from later'
          }
          onClick={isGuest ? lock : onOpenPlayers}
          isLocked={isGuest}
        />
        <UtilRow
          icon={BarChart3}
          title="Leaderboard"
          subtitle={isGuest ? 'Sign up to see rankings' : 'Rankings, form & head-to-head'}
          delay={330}
          tourId="util-leaderboard"
          onClick={isGuest ? lock : onOpenLeaderboard}
          isLocked={isGuest}
        />
        <UtilRow
          icon={History}
          title="Match History"
          delay={370}
          tourId="util-history"
          subtitle={
            isGuest ? 'Sign up to save scorecards' :
            historyCount > 0
              ? `${historyCount} saved game${historyCount === 1 ? '' : 's'}`
              : 'Saved scorecards appear here'
          }
          onClick={isGuest ? lock : onOpenHistory}
          isLocked={isGuest}
        />
      </div>
    </div>
  );
}

/** A compact "Team 45/2 (5.1)" label for a friend's live game, if available. */
function liveLabel(game) {
  const st = game?.data?.state || game?.data?.activeMatchState;
  if (!st) return 'Starting soon · tap to watch';
  try {
    const c = getMatchContext(st);
    if (!c) return 'In progress · tap to watch';
    return `${c.battingTeamName} ${c.runs}/${c.wickets} (${c.oversText})`;
  } catch {
    return 'In progress · tap to watch';
  }
}

function UtilRow({ icon: Icon, title, subtitle, onClick, delay = 0, tourId, isLocked = false }) {
  return (
    <button
      onClick={onClick}
      data-tour={tourId}
      style={{ animationDelay: `${delay}ms` }}
      className="btn-press lift group card-utility flex w-full items-center gap-3 p-4 text-left hover:border-white/15 animate-pop-in [animation-fill-mode:backwards]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10">
        <Icon size={20} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-xs text-slate-400">{subtitle}</span>
      </span>
      {isLocked
        ? <Lock size={15} className="text-slate-600" />
        : <ChevronRight size={18} className="text-slate-500 transition group-hover:translate-x-0.5" />
      }
    </button>
  );
}

/* Per-format personality: each variant has its own accent colour + glow + decoration. */
const VARIANT_CONFIG = {
  quick: {
    card: 'elev-action-green border-neon/40 hover:border-neon/60 hover:bg-neon/[0.07]',
    icon: 'bg-neon/20 text-neon ring-neon/35',
    tag: 'bg-neon/15 text-neon',
    chevron: 'text-neon',
  },
  series: {
    card: 'elev-action-teal border-teal/30 hover:border-teal/50 hover:bg-teal/[0.05]',
    icon: 'bg-teal/15 text-teal ring-teal/30',
    tag: 'bg-teal/15 text-teal',
    chevron: 'text-teal',
  },
  tournament: {
    card: 'elev-action-gold border-alert/30 hover:border-alert/50 hover:bg-alert/[0.07]',
    icon: 'bg-alert/15 text-alert ring-alert/30',
    tag: 'bg-alert/15 text-alert',
    chevron: 'text-alert',
  },
};

/* Decorative motifs painted absolutely inside each card — subtle but distinct. */
function ModeDecoration({ variant }) {
  if (variant === 'quick') {
    return (
      <>
        {/* Left energy stripe */}
        <div className="pointer-events-none absolute left-0 top-4 bottom-4 w-[2px] rounded-r-full bg-neon/55" />
        {/* Right speed streaks — motion lines suggesting fast play */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-24 overflow-hidden">
          <svg
            viewBox="0 0 96 88"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-[120%] text-neon opacity-[0.17]"
            fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"
          >
            <line x1="96" y1="12" x2="54" y2="12" />
            <line x1="96" y1="24" x2="20" y2="24" />
            <line x1="96" y1="36" x2="62" y2="36" />
            <line x1="96" y1="48" x2="28" y2="48" />
            <line x1="96" y1="60" x2="70" y2="60" />
            <line x1="96" y1="72" x2="38" y2="72" />
          </svg>
        </div>
      </>
    );
  }
  if (variant === 'series') {
    return (
      <>
        {/* Left teal stripe */}
        <div className="pointer-events-none absolute left-0 top-4 bottom-4 w-[2px] rounded-r-full bg-teal/45" />
        {/* Top-right timeline dots: game 1 filled, 2 & 3 pending */}
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 opacity-[0.32]">
          <div
            className="h-2 w-2 rounded-full bg-teal"
            style={{ boxShadow: '0 0 5px rgba(20,184,166,0.75)' }}
          />
          <div className="h-px w-4 bg-teal/55" />
          <div className="h-2 w-2 rounded-full border border-teal/60 bg-teal/20" />
          <div className="h-px w-4 bg-teal/30" />
          <div className="h-2 w-2 rounded-full border border-teal/35" />
        </div>
      </>
    );
  }
  if (variant === 'tournament') {
    return (
      <>
        {/* Left gold stripe */}
        <div className="pointer-events-none absolute left-0 top-4 bottom-4 w-[2px] rounded-r-full bg-alert/45" />
        {/* Top-right crown silhouette */}
        <div className="pointer-events-none absolute right-3 top-2.5 opacity-[0.16]">
          <svg viewBox="0 0 44 32" className="h-8 w-11 text-alert" fill="currentColor">
            <path d="M2 28 L2 20 L11 7 L17 17 L22 2 L27 17 L33 7 L42 20 L42 28 Z" />
            <rect x="2" y="28" width="40" height="3.5" rx="1.75" />
          </svg>
        </div>
      </>
    );
  }
  return null;
}

function ModeCard({ icon: Icon, title, tag, description, onClick, variant = 'quick', delay = 0, comingSoon = false, tourId, isLocked = false }) {
  const t = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.quick;
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      data-tour={tourId}
      style={{ animationDelay: `${delay}ms` }}
      className={`btn-press group card-action flex w-full items-start gap-3.5 p-4 text-left animate-pop-in [animation-fill-mode:backwards] ${
        comingSoon
          ? 'cursor-not-allowed opacity-60'
          : `lift sheenable ${t.card}`
      }`}
    >
      {!comingSoon && <ModeDecoration variant={variant} />}
      <span
        className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${
          comingSoon ? 'bg-white/5 text-slate-400 ring-white/10' : t.icon
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-bold text-white">{title}</span>
          {comingSoon ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Clock size={10} /> Soon
            </span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t.tag}`}>
              {tag}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-snug text-slate-400">{description}</span>
        {comingSoon && (
          <span className="mt-1 block text-[11px] font-medium text-slate-500">{tag}</span>
        )}
      </span>
      {!comingSoon && (
        isLocked
          ? <Lock size={16} className="relative mt-1 shrink-0 text-slate-600" />
          : <ChevronRight size={20} className={`relative mt-1 shrink-0 transition group-hover:translate-x-0.5 ${t.chevron}`} />
      )}
    </button>
  );
}
