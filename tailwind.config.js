/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Values come from CSS custom properties in index.css so the light/dark
        // themes can swap them at runtime.
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-text)',
        divider: 'var(--color-divider)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          100: 'var(--color-accent-100)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
        },
        magenta: {
          700: 'var(--color-accent-2-700)',
        },
        neutral: {
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
      },
      keyframes: {
        rest: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        fade: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rest: 'rest 220ms ease-out',
        fade: 'fade 180ms ease-out',
      },
    },
  },
  plugins: [],
}
