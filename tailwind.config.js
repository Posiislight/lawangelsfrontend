/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'worksans': ['"Work Sans"', 'sans-serif'],
        'crimson': ['"Crimson Text"', 'serif'],
      },
      backgroundImage: {
        'custom-gradient': 'linear-gradient(90deg, #405896 0%, #4A8EB9 100%)',
      },
      colors: {
        navy: '#1A1D3E',
      },
      
    },
  },
  plugins: [],
}