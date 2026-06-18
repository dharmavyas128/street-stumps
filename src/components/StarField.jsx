// Fixed, full-viewport twinkling star layer — purely decorative.
// Dense base sky lives in `body::before` (index.css); these animated
// glints layer on top so stars pulse out-of-sync across the whole screen.
// Silenced under prefers-reduced-motion (see index.css).

const STARS = [
  // ── Top band (0–20% from top) ──────────────────────────────────────
  { left:  4, top:  3,  size: 1.5, dur: 4.2, delay: 0.0 },
  { left: 13, top:  8,  size: 2.0, dur: 5.8, delay: 2.1 },
  { left: 22, top:  4,  size: 1.2, dur: 3.9, delay: 0.7 },
  { left: 31, top: 11,  size: 1.7, dur: 6.4, delay: 3.3 },
  { left: 39, top:  6,  size: 1.3, dur: 4.8, delay: 1.5 },
  { left: 48, top: 14,  size: 1.9, dur: 5.2, delay: 0.3 },
  { left: 57, top:  5,  size: 1.4, dur: 4.0, delay: 2.8 },
  { left: 65, top: 10,  size: 2.2, dur: 6.0, delay: 1.0 },
  { left: 73, top:  3,  size: 1.1, dur: 5.5, delay: 3.9 },
  { left: 82, top: 12,  size: 1.8, dur: 4.5, delay: 0.6 },
  { left: 90, top:  7,  size: 1.3, dur: 6.2, delay: 2.4 },
  { left: 96, top: 16,  size: 1.6, dur: 3.8, delay: 1.2 },

  // ── Upper-mid (20–40%) ──────────────────────────────────────────────
  { left:  7, top: 23,  size: 1.4, dur: 5.6, delay: 3.7 },
  { left: 17, top: 31,  size: 1.2, dur: 4.3, delay: 0.9 },
  { left: 26, top: 26,  size: 1.7, dur: 6.6, delay: 2.0 },
  { left: 36, top: 35,  size: 1.3, dur: 5.0, delay: 4.0 },
  { left: 45, top: 22,  size: 2.0, dur: 4.7, delay: 1.8 },
  { left: 54, top: 33,  size: 1.1, dur: 5.9, delay: 3.2 },
  { left: 63, top: 27,  size: 1.5, dur: 4.1, delay: 0.5 },
  { left: 71, top: 38,  size: 1.8, dur: 6.3, delay: 2.6 },
  { left: 80, top: 24,  size: 1.2, dur: 5.1, delay: 1.4 },
  { left: 88, top: 32,  size: 1.6, dur: 4.6, delay: 3.5 },
  { left: 95, top: 28,  size: 1.3, dur: 5.7, delay: 0.8 },

  // ── Mid (40–60%) ────────────────────────────────────────────────────
  { left:  2, top: 45,  size: 1.4, dur: 6.1, delay: 2.3 },
  { left: 12, top: 52,  size: 1.9, dur: 4.4, delay: 1.1 },
  { left: 28, top: 48,  size: 1.2, dur: 5.3, delay: 3.6 },
  { left: 43, top: 55,  size: 1.6, dur: 4.9, delay: 0.4 },
  { left: 59, top: 44,  size: 1.3, dur: 6.5, delay: 2.9 },
  { left: 75, top: 57,  size: 1.7, dur: 5.4, delay: 1.7 },
  { left: 91, top: 49,  size: 1.1, dur: 4.2, delay: 3.0 },

  // ── Lower half (60–90%) — sparser, smaller ──────────────────────────
  { left:  9, top: 65,  size: 1.2, dur: 5.8, delay: 0.2 },
  { left: 33, top: 72,  size: 1.4, dur: 6.0, delay: 2.5 },
  { left: 51, top: 68,  size: 1.1, dur: 4.5, delay: 3.8 },
  { left: 68, top: 76,  size: 1.3, dur: 5.6, delay: 1.3 },
  { left: 84, top: 63,  size: 1.5, dur: 4.8, delay: 0.1 },
  { left: 97, top: 71,  size: 1.0, dur: 6.2, delay: 2.7 },
  { left: 19, top: 83,  size: 1.1, dur: 5.1, delay: 1.6 },
  { left: 77, top: 88,  size: 1.2, dur: 4.3, delay: 3.4 },
];

export default function StarField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            boxShadow: `0 0 ${s.size * 2.5}px rgba(255,255,255,0.60)`,
          }}
        />
      ))}
    </div>
  );
}
