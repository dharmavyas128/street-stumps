import { X } from 'lucide-react';

/**
 * ExtraRunsModal — after tapping Wide / No-Ball / Bye / Leg-Bye, choose how many
 * runs came with it (e.g. a no-ball smashed for four → No-ball + 4).
 */
const CONFIG = {
  wide: {
    title: 'Wide ball',
    hint: 'Extra runs the batters ran (the wide already counts as 1).',
    options: [0, 1, 2, 3, 4],
    badge: (n) => `+${1 + n}`,
    accent: 'alert',
  },
  no_ball: {
    title: 'No-ball',
    hint: 'Runs the batter HIT off it (the no-ball already counts as 1).',
    options: [0, 1, 2, 3, 4, 6],
    badge: (n) => `+${1 + n}`,
    accent: 'alert',
  },
  bye: {
    title: 'Byes',
    hint: 'How many byes did they run?',
    options: [1, 2, 3, 4],
    badge: (n) => `+${n}`,
    accent: 'neutral',
  },
  leg_bye: {
    title: 'Leg byes',
    hint: 'How many leg byes did they run?',
    options: [1, 2, 3, 4],
    badge: (n) => `+${n}`,
    accent: 'neutral',
  },
};

export default function ExtraRunsModal({ type, onClose, onConfirm }) {
  if (!type) return null;
  const cfg = CONFIG[type];
  if (!cfg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 m-3 w-full max-w-md animate-pop-in p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{cfg.title}</h3>
          <button
            onClick={onClose}
            className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-400">{cfg.hint}</p>

        <div className="grid grid-cols-3 gap-2.5">
          {cfg.options.map((n) => (
            <button
              key={n}
              onClick={() => onConfirm(n)}
              className="btn-press scoreboard flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.05] py-5 text-2xl font-extrabold text-white hover:border-neon/40 hover:bg-neon/10"
            >
              {n}
              <span
                className={`mt-0.5 text-[10px] font-semibold ${
                  cfg.accent === 'alert' ? 'text-alert' : 'text-slate-400'
                }`}
              >
                {cfg.badge(n)} total
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
