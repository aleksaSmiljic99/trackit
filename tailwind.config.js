/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        bg: '#f3f2f2',
        surface: '#eae9e9',
        ink: '#201e1d',
        divider: 'color-mix(in srgb, #201e1d 16%, transparent)',
        accent: {
          DEFAULT: '#0088b0',
          100: '#e9f8ff',
          600: '#1186ac',
          700: '#006786',
        },
        magenta: {
          700: '#aa0b56',
        },
        neutral: {
          400: '#bab6b6',
          500: '#9b9797',
          600: '#7d7979',
          700: '#605d5d',
          800: '#444141',
        },
      },
      borderRadius: {
        DEFAULT: '2px',
      },
      keyframes: {
        rest: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rest: 'rest 220ms ease-out',
      },
    },
  },
  plugins: [],
}
