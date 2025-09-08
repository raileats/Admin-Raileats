/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",      // app router
    "./pages/**/*.{js,ts,jsx,tsx}",    // pages router (if used)
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          300: '#FCD34D',
          400: '#FFD400',
          600: '#FFC400',
        }
      },
      boxShadow: {
        'card': '0 10px 30px rgba(2,6,23,0.06)',
        'btn': '0 6px 18px rgba(2,6,23,0.08)'
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
