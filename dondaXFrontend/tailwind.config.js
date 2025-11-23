/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors : {
        green: {
          DEFAULT: '#77ff00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      borderWidth: {
        '0.2': '0.2px',
        '0.5': '0.5px',
        '1': '1px',
      },
    },
  },
  plugins: [],
}

