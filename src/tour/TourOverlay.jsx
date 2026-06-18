import { useLayoutEffect, useState } from 'react';
import { Sparkles, ChevronRight, X } from 'lucide-react';

/**
 * TourOverlay — a spotlight coach-mark layer. It dims + blurs everything except
 * the highlighted element (found via its `data-tour` attribute), leaving a hole
 * the user can tap through. The surrounding frame swallows clicks, so the only
 * reachable control is the highlighted one — which keeps the guided flow on rails.
 *
 * Props:
 *   step    — the active step object from tourSteps.js
 *   index   — zero-based position of this step
 *   total   — total number of steps
 *   onNext  — advance (used by info steps' Next button)
 *   onSkip  — end the tour
 */
const PAD = 8; // breathing room around the highlighted element

export default function TourOverlay({ step, index, total, onNext, onSkip }) {
  const [rect, setRect] = useState(null);

  // Track the target's position every frame so the spotlight follows scrolling,
  // sheet animations and layout shifts. Cheap enough for a short-lived tour.
  useLayoutEffect(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    let raf;
    const tick = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step?.key, step?.target]);

  if (!step) return null;

  const isInfo = step.advance === 'next';
  const isLast = index === total - 1;

  // Centered card when there's no target (intro) or the target isn't on screen yet.
  const centered = !step.target || !rect;

  // Spotlight cutout (clamped to the viewport).
  const cut = rect && {
    top: Math.max(rect.top - PAD, 0),
    left: Math.max(rect.left - PAD, 0),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Tooltip placement relative to the hole.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const TIP_W = Math.min(320, vw - 24);
  let tipStyle = {};
  if (!centered) {
    const centerX = cut.left + cut.width / 2;
    const left = Math.max(12, Math.min(centerX - TIP_W / 2, vw - TIP_W - 12));
    if (step.placement === 'top') {
      tipStyle = { left, top: cut.top - 12, transform: 'translateY(-100%)', width: TIP_W };
    } else {
      tipStyle = { left, top: cut.top + cut.height + 12, width: TIP_W };
    }
  }

  const Card = (
    <div className="glass-strong pointer-events-auto rounded-2xl border border-neon/30 p-4 shadow-glow-green">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neon">
          <Sparkles size={12} />
          {index + 1} / {total}
        </span>
        <button
          onClick={onSkip}
          className="btn-press flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
        >
          Skip tour
          <X size={12} />
        </button>
      </div>
      <h3 className="text-sm font-bold text-white">{step.title}</h3>
      <p className="mt-1 text-xs leading-snug text-slate-300">{step.body}</p>

      {isInfo ? (
        <button
          onClick={onNext}
          className="btn-press mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-neon py-2.5 text-sm font-bold text-midnight shadow-glow-green"
        >
          {isLast ? 'Finish' : 'Next'}
          {!isLast && <ChevronRight size={16} strokeWidth={2.5} />}
        </button>
      ) : (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-neon/30 bg-neon/[0.08] py-2 text-xs font-semibold text-neon">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
          </span>
          Tap the highlighted area
        </p>
      )}
    </div>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="App tour">
      {centered ? (
        // Full dim + blur, card centered.
        <>
          <div className="pointer-events-auto absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div style={{ width: TIP_W }}>{Card}</div>
          </div>
        </>
      ) : (
        <>
          {/* Four frames dim + blur everything except the hole. They also catch
              clicks, so only the highlighted element underneath stays tappable. */}
          <div className="pointer-events-auto absolute left-0 right-0 top-0 bg-black/60 backdrop-blur-[2px]" style={{ height: cut.top }} />
          <div className="pointer-events-auto absolute left-0 right-0 bottom-0 bg-black/60 backdrop-blur-[2px]" style={{ top: cut.top + cut.height }} />
          <div className="pointer-events-auto absolute left-0 bg-black/60 backdrop-blur-[2px]" style={{ top: cut.top, width: cut.left, height: cut.height }} />
          <div className="pointer-events-auto absolute right-0 bg-black/60 backdrop-blur-[2px]" style={{ top: cut.top, left: cut.left + cut.width, height: cut.height }} />

          {/* For info-only steps, block clicks on the hole — only Next/Skip are reachable. */}
          {isInfo && (
            <div
              className="pointer-events-auto absolute"
              style={{ top: cut.top, left: cut.left, width: cut.width, height: cut.height }}
            />
          )}

          {/* Neon ring around the highlighted element. */}
          <div
            className="pointer-events-none absolute rounded-2xl ring-2 ring-neon ring-offset-0 animate-pulse"
            style={{
              top: cut.top,
              left: cut.left,
              width: cut.width,
              height: cut.height,
              boxShadow: '0 0 24px rgba(34,255,136,0.45)',
            }}
          />

          {/* Tooltip near the hole. */}
          <div className="absolute" style={tipStyle}>
            {Card}
          </div>
        </>
      )}
    </div>
  );
}
