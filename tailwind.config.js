/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0E14',
        surface: '#12161F',
        mint: {
          DEFAULT: '#16C683',
          light: '#2fe29c',
          dark: '#0fa369',
        },
        muted: '#8B949E',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        pulseMint: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.1)' },
        },
        wave: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '18px' },
        }
      },
      animation: {
        'pulse-mint': 'pulseMint 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave-1': 'wave 1.2s ease-in-out infinite',
        'wave-2': 'wave 1.2s ease-in-out infinite 0.2s',
        'wave-3': 'wave 1.2s ease-in-out infinite 0.4s',
        'wave-4': 'wave 1.2s ease-in-out infinite 0.1s',
      }
    },
  },
  plugins: [],
}
