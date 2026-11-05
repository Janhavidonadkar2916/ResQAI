/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0A1128',
          navy: '#0F172A',
          surface: '#1E293B',
          teal: '#0D9488',
          tealLight: '#14B8A6',
          tealDark: '#0F766E',
        },
        status: {
          normal: '#10B981',   // Emerald
          warning: '#F59E0B',  // Amber
          critical: '#EF4444', // Rose / Red
          offline: '#64748B',  // Slate
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

