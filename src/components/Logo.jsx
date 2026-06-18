import { useState } from 'react';

/**
 * Logo — the Street Stumps brand mark.
 *
 * Primary: the brand icon at `public/brand-icon.png` (the glossy "SS" cricket
 * emblem), rendered to fill its badge via object-cover so its own dark/green
 * artwork covers the badge cleanly. If that file is missing it falls back to a
 * built-in SVG "ball-over-wicket" emblem, so the UI never shows a broken image.
 *
 * Call sites wrap this in a sized, rounded, `overflow-hidden` badge — the mark
 * fills that badge at every size, from the 18px header to the 64px hero.
 */
const SRC = '/brand-icon.png';

export default function Logo({ size = 24, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src={SRC}
        alt="Street Stumps"
        draggable="false"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  // Fallback emblem (inherits currentColor for the wicket; white ball).
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={`h-full w-full ${className}`}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeLinecap="round" fill="none">
        <line x1="44" y1="11" x2="57" y2="6" strokeWidth="2.6" opacity="0.8" />
        <line x1="43.5" y1="16.5" x2="54" y2="13" strokeWidth="2.2" opacity="0.5" />
        <line x1="45" y1="7.5" x2="53" y2="4" strokeWidth="1.8" opacity="0.35" />
      </g>
      <rect x="22.6" y="27" width="3.4" height="27" rx="1.7" />
      <rect x="30.3" y="27" width="3.4" height="27" rx="1.7" />
      <rect x="38" y="27" width="3.4" height="27" rx="1.7" />
      <rect x="22" y="23.2" width="9" height="2.8" rx="1.4" />
      <rect x="33.5" y="23.2" width="9" height="2.8" rx="1.4" />
      <rect x="19.5" y="56" width="25" height="2.8" rx="1.4" opacity="0.85" />
      <circle cx="41" cy="14.5" r="6.6" fill="#F8FAFC" />
      <g stroke="#15803D" strokeLinecap="round" fill="none">
        <path d="M 41 8.4 Q 37.2 14.5 41 20.6" strokeWidth="1.4" />
        <line x1="38.7" y1="10.6" x2="40.4" y2="10.9" strokeWidth="1" />
        <line x1="37.8" y1="14.4" x2="39.6" y2="14.4" strokeWidth="1" />
        <line x1="38.7" y1="18.3" x2="40.4" y2="18" strokeWidth="1" />
      </g>
    </svg>
  );
}
