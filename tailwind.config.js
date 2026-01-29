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
        // Brand colors
        brand: {
          primary: '#3B82F6',
          'primary-end': '#60A5FA',
        },
        // Level accent colors (from trivyn.pen design)
        daily: {
          DEFAULT: '#FEF3E8',
          dark: '#FDE7D0',
          accent: '#F97316',
        },
        weekly: {
          DEFAULT: '#F3F0FF',
          dark: '#E9E3FF',
          accent: '#8B5CF6',
        },
        monthly: {
          DEFAULT: '#E6FAF7',
          dark: '#CCF5EF',
          accent: '#14B8A6',
        },
        // Semantic colors
        surface: {
          page: '#FFFFFF',
          card: '#F4F4F5',
          elevated: '#E4E4E7',
          warm: '#FEF9F6',
        },
        border: {
          DEFAULT: '#D4D4D8',
          subtle: '#F0EFED',
        },
        content: {
          primary: '#18181B',
          secondary: '#71717A',
          tertiary: '#A1A1AA',
          muted: '#D4D4D8',
        },
        // For dark mode
        'surface-dark': {
          page: '#18181B',
          card: '#27272A',
          elevated: '#3F3F46',
        },
        'content-dark': {
          primary: '#FAFAFA',
          secondary: '#A1A1AA',
          tertiary: '#71717A',
        },
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(28, 25, 23, 0.06)',
        'elevated': '0 12px 32px -4px rgba(45, 42, 38, 0.08), 0 2px 6px rgba(45, 42, 38, 0.04)',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans JP"', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
