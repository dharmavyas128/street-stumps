/**
 * Sparkline — last-5 form guide. Draws a polyline of recent scores. Stroke is
 * neon-green when the player's last-3 average beats their lifetime average,
 * otherwise red — an at-a-glance "in form / out of form" cue.
 */
export default function Sparkline({ scores = [], ave = 0, width = 64, height = 20 }) {
  if (!scores || scores.length < 2) {
    return <span className="text-[10px] text-slate-600">—</span>;
  }

  const last3 = scores.slice(-3);
  const recentAvg = last3.reduce((a, b) => a + b, 0) / last3.length;
  const inForm = recentAvg >= ave;

  const pad = 2;
  const max = Math.max(...scores, 1);
  const points = scores
    .map((s, i) => {
      const x = pad + (i / (scores.length - 1)) * (width - 2 * pad);
      const y = height - pad - (s / max) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = scores
    .at(-1)
    ? (() => {
        const i = scores.length - 1;
        const x = pad + (i / (scores.length - 1)) * (width - 2 * pad);
        const y = height - pad - (scores[i] / max) * (height - 2 * pad);
        return { x, y };
      })()
    : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={inForm ? 'text-neon' : 'text-red-400'}
      aria-label={`Last ${scores.length} scores, ${inForm ? 'in form' : 'out of form'}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last.x} cy={last.y} r="1.8" fill="currentColor" />}
    </svg>
  );
}
