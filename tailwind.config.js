/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep midnight / charcoal stadium backdrop
        midnight: '#0B0F19',
        surface: '#0F1424',
        // Accents
        neon: {
          DEFAULT: '#00E676', // Primary / boundaries / positive flow
          soft: '#34F08C',
          deep: '#00B85E',
        },
        alert: {
          DEFAULT: '#FFA726', // Wides, no-balls, warnings
          soft: '#FFC266',
        },
        azure: {
          DEFAULT: '#00C2FF', // Series / second accent
          soft: '#5FD6FF',
          deep: '#00A3DB',
        },
        crimson: {
          DEFAULT: '#FF1744', // Wickets / danger
          soft: '#FF5C7A',
        },
      },
      fontFamily: {
        // Geometric sans for UI text
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // High-contrast monospace for the digital scoreboard
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        // Soft ambient glows instead of harsh black shadows
        ambient: '0 24px 70px -24px rgba(0, 0, 0, 0.75)',
        'glow-green': '0 0 28px -6px rgba(0, 230, 118, 0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-amber': '0 0 28px -6px rgba(255, 167, 38, 0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-azure': '0 0 28px -6px rgba(0, 194, 255, 0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-crimson': '0 0 28px -6px rgba(255, 23, 68, 0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        glass: '0 8px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
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
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.55' },
          '50%': { transform: 'translate(18px, 10px) scale(1.18)', opacity: '0.95' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.18s ease-out',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        aurora: 'aurora 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
