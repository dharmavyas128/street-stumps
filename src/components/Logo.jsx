/**
 * Logo — bat, ball & stumps emblem (a nod to "Street Stumps").
 * Single-colour via `currentColor`, so it inherits the neon green of its badge
 * and stays crisp at small sizes. The glowing two-tone version is the
 * standalone brand lockup; this is the compact in-app mark.
 */
export default function Logo({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* stumps */}
      <rect x="24.6" y="25" width="2.8" height="21" rx="1.4" />
      <rect x="30.6" y="25" width="2.8" height="21" rx="1.4" />
      <rect x="36.6" y="25" width="2.8" height="21" rx="1.4" />
      {/* bails */}
      <rect x="23.6" y="21.6" width="16.8" height="2.6" rx="1.3" />
      {/* base line */}
      <rect x="22.5" y="48" width="19" height="2.4" rx="1.2" opacity="0.85" />

      {/* bat — dark blade edged toward the ball, taped handle */}
      <path
        transform="translate(45.6 14.5) rotate(35)"
        d="M -3.8 2 Q -4.5 2 -4.5 4 L -4.5 25 L -1.6 29 L -1.6 40 Q -1.6 42 0 42 Q 1.6 42 1.6 40 L 1.6 29 L 4.5 25 L 4.5 4 Q 4.5 2 3.8 2 Z"
      />

      {/* ball — just off the bat face */}
      <circle cx="49.5" cy="12.5" r="4.4" />
    </svg>
  );
}
