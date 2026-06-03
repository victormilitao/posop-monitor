/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8EDF3',
          100: '#C5D3E5',
          200: '#9AB4D1',
          300: '#6F95BD',
          400: '#4F7DAD',
          500: '#2F659D',
          600: '#275590',
          700: '#1B3A5C',
          800: '#142D47',
          900: '#0D1F33',
        },
        background: '#E6E8ED',
      },
    },
  },
  plugins: [],
}

