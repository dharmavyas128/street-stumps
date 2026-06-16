import { useState, useEffect } from 'react';
import { X, UserPlus, Check, ChevronLeft, Hand, Disc3 } from 'lucide-react';
import PlayerForm from './PlayerForm';

/**
 * PlayerPickerModal — choose a roster player for a team slot, clear it, or
 * "Add new player" (which saves to the roster and selects them immediately).
 */
export default function PlayerPickerModal({ open, roster, takenIds, currentId, onPick, onCreate, onClear, onClose }) {
  const [mode, setMode] = useState('list'); // list | add

  useEffect(() => {
    if (open) setMode(roster.length === 0 ? 'add' : 'list');
  }, [open, roster.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-strong relative z-10 m-3 flex max-h-[80vh] w-full max-w-md flex-col p-5 animate-pop-in">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'add' && roster.length > 0 && (
              <button
                onClick={() => setMode('list')}
                className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h3 className="text-base font-bold text-white">
              {mode === 'add' ? 'New player' : 'Pick a player'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-press grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {mode === 'add' ? (
          <PlayerForm autoFocus onSubmit={(data) => onCreate(data)} submitLabel="Add & select" />
        ) : (
          <>
            <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 scroll-slim">
              {roster.map((p) => {
                const taken = takenIds.has(p.id) && p.id !== currentId;
                const selected = p.id === currentId;
                return (
                  <button
                    key={p.id}
                    disabled={taken}
                    onClick={() => onPick(p)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-neon/40 bg-neon/10'
                        : taken
                          ? 'border-white/10 bg-white/[0.02] opacity-40'
                          : 'btn-press border-white/10 bg-white/[0.04] hover:border-neon/40 hover:bg-neon/10'
                    }`}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon/10 text-neon ring-1 ring-neon/20 text-sm font-bold">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-slate-100">{p.name}</span>
                        {p.isSelf && (
                          <span className="shrink-0 rounded-full bg-neon/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon">
                            You
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Hand size={10} />
                        {p.battingHand === 'left' ? 'LHB' : 'RHB'}
                        <span className="text-slate-600">·</span>
                        <Disc3 size={10} />
                        {p.bowlingStyle}
                      </span>
                    </span>
                    {selected && <Check size={18} className="shrink-0 text-neon" />}
                    {taken && <span className="shrink-0 text-[10px] text-slate-500">in XI</span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              <button
                onClick={() => setMode('add')}
                className="btn-press flex w-full items-center justify-center gap-2 rounded-xl border border-neon/30 bg-neon/10 py-3 text-sm font-bold text-neon"
              >
                <UserPlus size={16} />
                Add a new player
              </button>
              {currentId && (
                <button
                  onClick={onClear}
                  className="btn-press w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-400"
                >
                  Clear this slot
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
