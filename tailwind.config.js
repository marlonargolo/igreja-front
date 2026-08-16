/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#172536',
          800: '#203B59',
          700: '#315C86',
          500: '#4B739B',
          300: '#667789',
          100: '#DCE7F1',
          50: '#F5F8FB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(23,37,54,0.06), 0 1px 3px 0 rgba(23,37,54,0.08)',
        soft: '0 4px 16px -4px rgba(23,37,54,0.10)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [],
}
