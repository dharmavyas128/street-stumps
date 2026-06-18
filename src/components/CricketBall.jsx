import { useTheme } from '../hooks/useTheme';

// Decorative red test-cricket ball streaking in with pace lines — light mode only.
// Sits far behind content at low opacity; the frosted cards float above it, so
// the ball only peeks through the gaps and side margins as a subtle depth motif.
// Drifts a touch on scroll (reads --sy from :root, set by App.jsx).
export default function CricketBall() {
  const isLight = useTheme();
  if (!isLight) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute"
        style={{
          right: '-78px',
          top: '50%',
          width: '340px',
          height: '300px',
          marginTop: '-150px',
          opacity: 0.7,
          transform:
            'translate3d(calc(var(--sy, 0) * -0.018px), calc(var(--sy, 0) * 0.05px), 0)',
          willChange: 'transform',
        }}
      >
        <svg
          viewBox="0 0 340 300"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          <defs>
            {/* Spherical shading — light catches the upper-left */}
            <radialGradient id="cb-ball" cx="36%" cy="34%" r="66%">
              <stop offset="0%"   stopColor="#E66A5E" />
              <stop offset="38%"  stopColor="#C7382C" />
              <stop offset="78%"  stopColor="#A52A20" />
              <stop offset="100%" stopColor="#7C1D16" />
            </radialGradient>
            {/* Pace streaks fade in toward the ball — reach strength early so the
                 motion still reads where the gutter is open */}
            <linearGradient id="cb-pace" gradientUnits="userSpaceOnUse" x1="-30" y1="0" x2="206" y2="0">
              <stop offset="0%"   stopColor="#C0392B" stopOpacity="0" />
              <stop offset="35%"  stopColor="#C0392B" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#B83227" stopOpacity="0.95" />
            </linearGradient>
            {/* Glossy specular highlight */}
            <radialGradient id="cb-spec" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Pace lines — long tapering streaks trailing the ball to the left,
               suggesting it's been bowled fast. Strong near the ball, fading out. */}
          <g stroke="url(#cb-pace)" strokeLinecap="round" fill="none">
            <line x1="40"  y1="112" x2="200" y2="112" strokeWidth="3" />
            <line x1="-8"  y1="130" x2="204" y2="130" strokeWidth="4" />
            <line x1="-28" y1="150" x2="206" y2="150" strokeWidth="4.5" />
            <line x1="-14" y1="170" x2="204" y2="170" strokeWidth="4" />
            <line x1="34"  y1="188" x2="200" y2="188" strokeWidth="3" />
          </g>

          {/* Ball body — pushed right so only the seam-bearing left crescent
               shows in the visible margin */}
          <circle cx="272" cy="150" r="68" fill="url(#cb-ball)" />
          <circle cx="272" cy="150" r="68" fill="none" stroke="#6E1812" strokeOpacity="0.32" strokeWidth="1" />

          {/* Seam on the LEFT meridian (the visible side) — dark groove + cream stitch ladder */}
          <path
            d="M272 84 C 224 110, 224 190, 272 216"
            fill="none" stroke="#6E1812" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round"
          />
          <path
            d="M272 84 C 224 110, 224 190, 272 216"
            fill="none" stroke="#F0E2CB" strokeOpacity="0.72" strokeWidth="6"
            strokeDasharray="1.8 8.5" strokeLinecap="round"
          />

          {/* Specular highlight — upper-left curve */}
          <ellipse cx="244" cy="120" rx="17" ry="10" fill="url(#cb-spec)" transform="rotate(-30 244 120)" />
        </svg>
      </div>
    </div>
  );
}
