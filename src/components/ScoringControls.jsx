import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import WicketModal from './WicketModal';
import ExtraRunsModal from './ExtraRunsModal';

/**
 * ScoringControls — the thumb-optimised, one-tap scoring grid.
 *  • Runs: 0 1 2 3 4 6  (boundaries glow neon green)
 *  • Extras: Wide  No-Ball  Bye  Leg-Bye  (amber)
 *  • Wicket (crimson) → opens dismissal modal
 *  • Undo (pops the immutable history stack)
 */
export default function ScoringControls({
  onRuns,
  onExtra,
  onWicket,
  onUndo,
  canUndo,
  EXTRA,
  context,
  disabled = false,
}) {
  const [wicketOpen, setWicketOpen] = useState(false);
  const [extraType, setExtraType] = useState(null); // which extra is being entered

  const runValues = [0, 1, 2, 3, 4, 6];

  const handleWicket = (payload) => {
    setWicketOpen(false);
    onWicket(payload);
  };

  const handleExtra = (runs) => {
    const type = extraType;
    setExtraType(null);
    onExtra(type, runs);
  };

  return (
    <div className="glass space-y-3 p-3">
      {/* Scoring inputs are locked until a bowler is selected for the over */}
      <div className={`space-y-3 transition ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
        {/* Runs grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {runValues.map((r) => {
            const boundary = r === 4 || r === 6;
            return (
              <button
                key={r}
                onClick={() => onRuns(r)}
                disabled={disabled}
                className={`btn-press scoreboard rounded-2xl py-6 text-3xl font-extrabold ${
                  boundary
                    ? 'bg-neon text-midnight shadow-glow-green'
                    : 'border border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Extras — each opens a quick "how many runs?" picker */}
        <div className="grid grid-cols-4 gap-2">
          <ExtraBtn label="Wide" onClick={() => setExtraType(EXTRA.WIDE)} disabled={disabled} />
          <ExtraBtn label="No-Ball" onClick={() => setExtraType(EXTRA.NO_BALL)} disabled={disabled} />
          <ExtraBtn label="Bye" onClick={() => setExtraType(EXTRA.BYE)} subtle disabled={disabled} />
          <ExtraBtn label="Leg-Bye" onClick={() => setExtraType(EXTRA.LEG_BYE)} subtle disabled={disabled} />
        </div>
      </div>

      {/* Wicket + Undo (Undo stays available even when scoring is locked) */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={() => setWicketOpen(true)}
          disabled={disabled}
          className="btn-press rounded-2xl bg-crimson py-4 text-lg font-bold uppercase tracking-wider text-white shadow-glow-crimson disabled:opacity-40"
        >
          Wicket
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="btn-press flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-slate-200 disabled:opacity-30"
        >
          <Undo2 size={18} />
          Undo
        </button>
      </div>

      <WicketModal
        open={wicketOpen}
        onClose={() => setWicketOpen(false)}
        onConfirm={handleWicket}
        context={context}
      />

      <ExtraRunsModal
        type={extraType}
        onClose={() => setExtraType(null)}
        onConfirm={handleExtra}
      />
    </div>
  );
}

function ExtraBtn({ label, onClick, subtle = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press rounded-xl py-3.5 text-xs font-bold uppercase tracking-wide ${
        subtle
          ? 'border border-alert/20 bg-alert/5 text-alert-soft hover:bg-alert/10'
          : 'border border-alert/40 bg-alert/15 text-alert hover:bg-alert/25'
      }`}
    >
      {label}
    </button>
  );
}
