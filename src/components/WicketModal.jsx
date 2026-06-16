import { useState, useEffect } from 'react';
import { X, Skull, Crown, ChevronLeft } from 'lucide-react';
import { DISMISSAL_TYPES } from '../engine/matchEngine';

const NEEDS_FIELDER = new Set(['caught', 'run_out', 'stumped']);
const fielderPrompt = {
  caught: 'Who took the catch?',
  stumped: 'Stumped by?',
  run_out: 'Who ran them out?',
};

/**
 * WicketModal — a guided flow that captures a real-cricket dismissal:
 *   type → (which batsman, for run-outs) → (fielder) → (who's in next)
 * then hands a single payload to onConfirm.
 */
export default function WicketModal({ open, onClose, onConfirm, context }) {
  const [stack, setStack] = useState(['type']);
  const [draft, setDraft] = useState({});

  // Reset whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setStack(['type']);
      setDraft({});
    }
  }, [open]);

  if (!open || !context) return null;

  const screen = stack[stack.length - 1];
  const hasNonStriker = !!context.nonStriker;
  const inningsContinues = context.wickets + 1 < context.maxWickets;
  const needNext = inningsContinues && context.availableBatsmen.length > 0;

  const ORDER = ['type', 'outEnd', 'fielder', 'next'];
  const required = (s, d) => {
    if (s === 'outEnd') return d.id === 'run_out' && hasNonStriker;
    if (s === 'fielder') return NEEDS_FIELDER.has(d.id);
    if (s === 'next') return needNext;
    return false;
  };
  const nextScreen = (current, d) => {
    for (let i = ORDER.indexOf(current) + 1; i < ORDER.length; i += 1) {
      if (required(ORDER[i], d)) return ORDER[i];
    }
    return null; // → confirm
  };

  // Advance through the flow, or finalise.
  const advance = (patch) => {
    const d = { ...draft, ...patch };
    setDraft(d);
    const next = nextScreen(screen, d);
    if (next) setStack((s) => [...s, next]);
    else finish(d);
  };

  const finish = (d) => {
    onConfirm({
      dismissal: { id: d.id, label: d.label, fielderId: d.fielderId ?? null },
      outEnd: d.outEnd || 'striker',
      nextBatsmanId: d.nextBatsmanId ?? null,
    });
  };

  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 m-3 w-full max-w-md animate-pop-in p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {screen !== 'type' ? (
              <button
                onClick={back}
                className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-crimson/15 text-crimson ring-1 ring-crimson/30">
                <Skull size={18} />
              </span>
            )}
            <h3 className="text-base font-bold text-white">{titleFor(screen, draft)}</h3>
          </div>
          <button
            onClick={onClose}
            className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {screen === 'type' && (
          <div className="grid grid-cols-2 gap-2">
            {DISMISSAL_TYPES.map((d) => (
              <button
                key={d.id}
                onClick={() => advance({ id: d.id, label: d.label })}
                className="btn-press rounded-xl border border-crimson/30 bg-crimson/10 py-4 text-sm font-semibold text-crimson-soft hover:bg-crimson/20"
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {screen === 'outEnd' && (
          <div className="grid grid-cols-1 gap-2">
            <PickRow
              label={`${context.striker?.name} (striker)`}
              onClick={() => advance({ outEnd: 'striker' })}
            />
            <PickRow
              label={`${context.nonStriker?.name} (non-striker)`}
              onClick={() => advance({ outEnd: 'nonStriker' })}
            />
          </div>
        )}

        {screen === 'fielder' && (
          <div className="grid grid-cols-2 gap-2">
            {context.bowling.roster.map((p) => (
              <button
                key={p.id}
                onClick={() => advance({ fielderId: p.id })}
                className="btn-press flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-slate-100 hover:border-neon/40 hover:bg-neon/10"
              >
                <span className="truncate">{p.name}</span>
                {p.isCaptain && <Crown size={12} className="shrink-0 text-amber-300" fill="currentColor" />}
              </button>
            ))}
            {draft.id !== 'stumped' && (
              <button
                onClick={() => advance({ fielderId: null })}
                className="btn-press col-span-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-400"
              >
                Not sure / unattributed
              </button>
            )}
          </div>
        )}

        {screen === 'next' && (
          <div className="grid grid-cols-2 gap-2">
            {context.availableBatsmen.map((p) => (
              <button
                key={p.id}
                onClick={() => advance({ nextBatsmanId: p.id })}
                className="btn-press flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-slate-100 hover:border-neon/40 hover:bg-neon/10"
              >
                <span className="truncate">{p.name}</span>
                {p.isCaptain && <Crown size={12} className="shrink-0 text-amber-300" fill="currentColor" />}
                {p.retired && <span className="text-[10px] text-slate-500">(rtd)</span>}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-press mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function titleFor(screen, draft) {
  if (screen === 'type') return 'How was the batter out?';
  if (screen === 'outEnd') return 'Which batter is out?';
  if (screen === 'fielder') return fielderPrompt[draft.id] || 'Fielder?';
  if (screen === 'next') return "Who's in next?";
  return '';
}

function PickRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn-press w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-semibold text-slate-100 hover:border-neon/40 hover:bg-neon/10"
    >
      {label}
    </button>
  );
}
