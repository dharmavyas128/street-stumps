import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * AnimatedNumber — tweens from the previously-shown value to the new one with
 * an ease-out roll, so scores and stats "count up" on load and on every change.
 * Renders bare text so it inherits the parent's typography (use inside a span).
 */
export default function AnimatedNumber({ value, decimals = 0, duration = 520 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(0); // count up from 0 on first paint

  useEffect(() => {
    const from = prevRef.current;
    const to = Number(value) || 0;
    prevRef.current = to;

    if (from === to || prefersReducedMotion()) {
      setDisplay(to);
      return;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{decimals > 0 ? Number(display).toFixed(decimals) : Math.round(display)}</>;
}
