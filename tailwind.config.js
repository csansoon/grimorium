import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tarot: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      letterSpacing: {
        'widest-xl': '0.2em',
      },
      colors: {
        // Parchment/cream colors for good teams
        parchment: {
          50: '#FFFEF8',
          100: '#FDF8E7',
          200: '#F5EDD6',
          300: '#E8DCC0',
          400: '#D4C5A2',
          500: '#B8A77D',
        },
        // Mystical accent colors
        mystic: {
          gold: '#D4AF37',
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          crimson: '#8B0000',
          midnight: '#191970',
        },
        // Dark theme colors
        grimoire: {
          dark: '#0D0D0D',
          darker: '#080808',
          purple: '#1A0A2E',
          blood: '#2D0A0A',
        },
      },
      backgroundImage: {
        'tarot-pattern': 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 50%)',
        'parchment-texture':
          'radial-gradient(ellipse at 20% 20%, rgba(255,250,240,0.03) 0%, transparent 50%), ' +
          'radial-gradient(ellipse at 80% 80%, rgba(255,250,240,0.02) 0%, transparent 50%)',
      },
      boxShadow: {
        'tarot': '0 0 0 1px rgba(212, 175, 55, 0.3), 0 4px 20px rgba(0, 0, 0, 0.3)',
        'tarot-glow': '0 0 20px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.text-glow-gold': {
          'text-shadow': '0 0 10px rgba(212, 175, 55, 0.5)',
        },
        '.text-glow-crimson': {
          'text-shadow': '0 0 10px rgba(139, 0, 0, 0.7)',
        },
        '.min-h-app': {
          'min-height': 'var(--app-height)',
          'max-height': 'var(--app-height)',
          'overflow-y': 'auto',
        },
      });
    }),
  ],
};
