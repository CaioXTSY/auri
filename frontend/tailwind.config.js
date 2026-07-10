/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        display: ['Cinzel', 'Merriweather', 'serif'],
      },
      colors: {
        brand: {
          50: '#f4f6f8',
          100: '#e4e7eb',
          200: '#c5ced6',
          300: '#9baec0',
          400: '#6f8ba4',
          500: '#4f6d8b',
          600: '#3a536f',
          700: '#2f435a',
          800: '#28384a',
          900: '#1e293b', // Navy clássico
          950: '#0f172a',
        },
        accent: {
          50: '#fffbf0',
          100: '#fff6d6',
          200: '#ffeeb0',
          300: '#ffe080',
          400: '#ffcf4d',
          500: '#ffba1a',
          600: '#e69a00',
          700: '#8c5a08', // Gold/Bronze com contraste AA em texto e botões
          800: '#734a0d',
          900: '#593707',
        }
      }
    },
  },
  plugins: [],
}
