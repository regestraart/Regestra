/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layout/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rg-purple':  '#7c3aed',
        'rg-purple2': '#6d28d9',
        'rg-purple3': '#5b21b6',
        'rg-teal':    '#0d9488',
        'rg-teal2':   '#0f766e',
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter:  '-0.025em',
        tight:    '-0.02em',
        snug:     '-0.015em',
      },
      lineHeight: {
        'display': '1.02',
        'heading': '1.1',
      },
    }
  },
  plugins: [],
}
