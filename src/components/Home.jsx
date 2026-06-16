import { Swords, Trophy, ListOrdered, History, ChevronRight, Clock, Users, BarChart3, Bell, Radio, Eye } from 'lucide-react';
import Logo from './Logo';
import { getMatchContext } from '../engine/matchEngine';

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
  playerCount = 0,
  historyCount = 0,
  userEmail,
  userName,
}) {
  return (
    <div className="space-y-5">
      {/* Profile avatar bar + notification bell */}
      {userEmail && (
        <div className="flex items-center justify-between pt-1 animate-pop-in [animation-fill-mode:backwards]">
          <button onClick={onOpenProfile} className="btn-press flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/15 text-neon ring-1 ring-neon/30 text-sm font-extrabold">
              {(userName || userEmail).charAt(0).toUpperCase()}
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{userName || 'Profile'}</p>
              <p className="text-[10px] text-slate-500">Tap to view profile</p>
            </div>
          </button>

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
        </div>
      )}

      {/* Hero */}
      <div
        className="glass-strong relative overflow-hidden p-7 text-center animate-pop-in [animation-fill-mode:backwards]"
        style={{ animationDelay: '60ms' }}
      >
        {/* Slow-drifting aurora behind the wordmark */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-3 h-40 w-40 rounded-full bg-neon/20 blur-3xl animate-aurora" />
          <div
            className="absolute -top-12 right-3 h-36 w-36 rounded-full bg-azure/20 blur-3xl animate-aurora"
            style={{ animationDelay: '-4.5s' }}
          />
        </div>
        <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neon/15 text-neon ring-1 ring-neon/30">
          <Logo size={34} />
        </span>
        <h1 className="relative mt-3 text-2xl font-extrabold tracking-tight text-white">
          STREET <span className="wordmark-accent">STUMPS</span>
        </h1>
        <p className="relative mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
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
              className="btn-press group flex w-full items-center gap-3 rounded-2xl border border-crimson/30 bg-crimson/[0.06] p-4 text-left shadow-glow-crimson transition hover:-translate-y-0.5"
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

      {/* Game modes */}
      <div className="space-y-3">
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
          tint="green"
          delay={150}
          description="A single head-to-head game. Set your rules, name the players, flip the toss, and play it out."
          onClick={onPlayQuick}
        />

        <ModeCard
          icon={ListOrdered}
          title="Series"
          tag="Best of 3 / 5 / 7"
          tint="azure"
          delay={190}
          description="Two teams, multiple games. Win the majority to take the series."
          onClick={onPlaySeries}
        />

        <ModeCard
          icon={Trophy}
          title="Tournament"
          tag="3–6 teams"
          tint="gold"
          delay={230}
          description="Round-robin league among several teams, then a final to crown the champion."
          onClick={onPlayTournament}
        />
      </div>

      {/* My Players + History */}
      <div className="space-y-3">
        <UtilRow
          icon={Users}
          title="My Players"
          delay={290}
          subtitle={
            playerCount > 0
              ? `${playerCount} player${playerCount === 1 ? '' : 's'} in your roster`
              : 'Add players to pick from later'
          }
          onClick={onOpenPlayers}
        />
        <UtilRow
          icon={BarChart3}
          title="Leaderboard"
          subtitle="Rankings, form & head-to-head"
          delay={330}
          onClick={onOpenLeaderboard}
        />
        <UtilRow
          icon={History}
          title="Match History"
          delay={370}
          subtitle={
            historyCount > 0
              ? `${historyCount} saved game${historyCount === 1 ? '' : 's'}`
              : 'Saved scorecards appear here'
          }
          onClick={onOpenHistory}
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

function UtilRow({ icon: Icon, title, subtitle, onClick, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="btn-press group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 animate-pop-in [animation-fill-mode:backwards]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-300 ring-1 ring-white/10">
        <Icon size={20} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="block text-xs text-slate-400">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="text-slate-500 transition group-hover:translate-x-0.5" />
    </button>
  );
}

/* Each format wears its own accent so the home screen reads at a glance. */
const MODE_TINTS = {
  green: {
    card: 'border-neon/30 bg-neon/[0.06] hover:bg-neon/10 shadow-glow-green',
    icon: 'bg-neon/15 text-neon ring-neon/30',
    tag: 'bg-neon/15 text-neon',
    chevron: 'text-neon',
  },
  azure: {
    card: 'border-azure/30 bg-azure/[0.06] hover:bg-azure/10 shadow-glow-azure',
    icon: 'bg-azure/15 text-azure ring-azure/30',
    tag: 'bg-azure/15 text-azure',
    chevron: 'text-azure',
  },
  gold: {
    card: 'border-alert/30 bg-alert/[0.06] hover:bg-alert/10 shadow-glow-amber',
    icon: 'bg-alert/15 text-alert ring-alert/30',
    tag: 'bg-alert/15 text-alert',
    chevron: 'text-alert',
  },
};

function ModeCard({ icon: Icon, title, tag, description, onClick, tint = 'green', delay = 0, comingSoon = false }) {
  const t = MODE_TINTS[tint] ?? MODE_TINTS.green;
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      style={{ animationDelay: `${delay}ms` }}
      className={`btn-press group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition animate-pop-in [animation-fill-mode:backwards] ${
        comingSoon
          ? 'cursor-not-allowed border-white/10 bg-white/[0.02] opacity-60'
          : `${t.card} hover:-translate-y-0.5`
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${
          comingSoon ? 'bg-white/5 text-slate-400 ring-white/10' : t.icon
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
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
        <ChevronRight size={20} className={`mt-1 shrink-0 transition group-hover:translate-x-0.5 ${t.chevron}`} />
      )}
    </button>
  );
}
