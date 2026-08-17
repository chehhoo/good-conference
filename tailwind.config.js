/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        navy: {
          950: '#060E1F',
          900: '#0B1629',
          800: '#16264A',
          700: '#1E3060',
        },
        vermillion: {
          DEFAULT: '#C8341A',
          dim: 'rgba(200,52,26,0.18)',
        },
        gold: {
          DEFAULT: '#EFA020',
          dim: 'rgba(239,160,32,0.15)',
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom, 1.5rem)',
        },
      })
    },
  ],
}
