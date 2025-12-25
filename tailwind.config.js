/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        daily: {
          DEFAULT: 'hsl(29, 75%, 95%)',
          dark: 'hsl(29, 75%, 85%)',
          accent: 'hsl(29, 75%, 60%)',
        },
        weekly: {
          DEFAULT: 'hsl(270, 55%, 85%)',
          dark: 'hsl(270, 55%, 75%)',
          accent: 'hsl(270, 55%, 60%)',
        },
        monthly: {
          DEFAULT: 'hsl(173, 60%, 75%)',
          dark: 'hsl(173, 60%, 65%)',
          accent: 'hsl(173, 60%, 50%)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
