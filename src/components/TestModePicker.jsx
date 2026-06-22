import { ChevronLeft, ChevronRight, Users, UserPlus, User, Clock, Hourglass } from 'lucide-react';

/**
 * TestModePicker — after tapping the Test format, choose how the sides are
 * built: full Team mode (live now), or Pairs / Single (coming soon).
 */
export default function TestModePicker({ onBack, onPick }) {
  return (
    <div className="space-y-4 animate-pop-in">
      <button onClick={onBack} className="btn-press flex items-center gap-1 text-sm font-semibold text-slate-300">
        <ChevronLeft size={18} />
        Home
      </button>

      <div className="card-hero glass-box relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-white/[0.06] blur-3xl" />
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-slate-100 ring-1 ring-white/25">
          <Hourglass size={26} />
        </span>
        <h2 className="relative mt-3 text-lg font-bold text-white">Test Match</h2>
        <p className="relative mt-1 text-xs text-slate-400">
          Two innings a side, unlimited overs. How do you want to play it?
        </p>
      </div>

      <div className="space-y-3">
        <ModeOption
          icon={Users}
          title="Team"
          subtitle="Full sides bat & bowl — the classic Test."
          onClick={() => onPick('team')}
        />
        <ModeOption
          icon={UserPlus}
          title="Pairs"
          subtitle="Two-a-side — every pair bats until both are out. Highest total wins."
          onClick={() => onPick('pairs')}
        />
        <ModeOption
          icon={User}
          title="Single"
          subtitle="Everyone for themselves — each player bats solo. Highest score wins."
          onClick={() => onPick('single')}
        />
      </div>
    </div>
  );
}

function ModeOption({ icon: Icon, title, subtitle, onClick, comingSoon = false }) {
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      className={`btn-press group card-action flex w-full items-center gap-3.5 p-4 text-left ${
        comingSoon
          ? 'cursor-not-allowed opacity-60'
          : 'lift sheenable border-white/25 hover:border-white/45 hover:bg-white/[0.05]'
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${
          comingSoon ? 'bg-white/5 text-slate-400 ring-white/10' : 'bg-white/10 text-slate-100 ring-white/25'
        }`}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-bold text-white">{title}</span>
          {comingSoon && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Clock size={10} /> Soon
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-snug text-slate-400">{subtitle}</span>
      </span>
      {!comingSoon && (
        <ChevronRight size={20} className="shrink-0 text-slate-200 transition group-hover:translate-x-0.5" />
      )}
    </button>
  );
}
