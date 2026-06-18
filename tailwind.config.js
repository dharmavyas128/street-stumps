/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Constrained palette ─────────────────────────────────────────
        // Background: deep navy. Primary: cricket green. Accent: gold.
        // Text: near-white. Only these four hues appear anywhere.
        midnight: '#0F172A', // Dark Navy — app background
        surface: '#162234', // lifted navy for panels

        // Primary — Cricket Green (token kept as `neon` so existing
        // bg-neon / text-neon classes across the app inherit the new hue).
        neon: {
          DEFAULT: '#16A34A',
          soft: '#22C55E',
          deep: '#15803D',
        },
        // Accent — Gold (token kept as `alert`).
        alert: {
          DEFAULT: '#FBBF24',
          soft: '#FCD34D',
        },
        // Series accent — blue-green teal, distinct from both primary green and gold.
        teal: {
          DEFAULT: '#14B8A6',
          soft: '#2DD4BF',
        },
        // Legacy tokens collapsed into the palette so any stragglers stay
        // on-brand: `azure` → green, `crimson` → gold.
        azure: {
          DEFAULT: '#16A34A',
          soft: '#22C55E',
          deep: '#15803D',
        },
        crimson: {
          DEFAULT: '#FBBF24',
          soft: '#FCD34D',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        ambient: '0 24px 70px -24px rgba(0, 0, 0, 0.75)',
        // Two accent glows only — green and gold.
        'glow-green': '0 0 24px -8px rgba(22, 163, 74, 0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glow-amber': '0 0 24px -8px rgba(251, 191, 36, 0.50), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glow-teal': '0 0 24px -8px rgba(20, 184, 166, 0.50), inset 0 1px 0 rgba(255,255,255,0.10)',
        // Aliases so legacy class names resolve to the palette.
        'glow-azure': '0 0 24px -8px rgba(22, 163, 74, 0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glow-crimson': '0 0 24px -8px rgba(251, 191, 36, 0.50), inset 0 1px 0 rgba(255,255,255,0.10)',
        // Liquid-glass elevation: soft ambient drop + crisp inner top sheen.
        glass: '0 10px 40px -16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(255,255,255,0.02)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // A single, slow ambient drift — used once behind the wordmark.
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.5' },
          '50%': { transform: 'translate(14px, 8px) scale(1.12)', opacity: '0.75' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(120%)' },
        },
        // Soft star twinkle — low-opacity flash + faint scale. Per-star duration
        // and delay are randomised inline so the sky shimmers out of sync.
        twinkle: {
          '0%, 100%': { opacity: '0.12', transform: 'scale(0.82)' },
          '50%':      { opacity: '0.78', transform: 'scale(1.12)' },
        },
        // Per-letter entrance — translate up + fade in, used for the wordmark stagger.
        'letter-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slow ambient liquid sweep — light band sliding across a glass surface.
        // Active for first 32% of cycle, silent the rest (natural pause between sweeps).
        'liquid-sweep': {
          '0%':   { transform: 'translateX(-160%) skewX(-14deg)', opacity: '0' },
          '6%':   { opacity: '1' },
          '32%':  { transform: 'translateX(320%) skewX(-14deg)', opacity: '0' },
          '100%': { transform: 'translateX(-160%) skewX(-14deg)', opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        drift: 'drift 10s ease-in-out infinite',
        sheen: 'sheen 1.1s ease-out',
        'liquid-sweep': 'liquid-sweep 7s ease-in-out infinite',
        twinkle: 'twinkle 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
