/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f7ff',
          100: '#dce8ff',
          200: '#bfd4ff',
          300: '#93b6ff',
          400: '#6290ff',
          500: '#3b6df2',
          600: '#2955d0',
          700: '#2144a8',
          800: '#213d86',
          900: '#213567',
        },
        ink: '#0f172a',
        sand: '#f8f5ef',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.12)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      backgroundImage: {
        glow:
          'radial-gradient(circle at top left, rgba(59,109,242,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(255,149,0,0.16), transparent 28%)',
      },
    },
  },
  plugins: [],
}
