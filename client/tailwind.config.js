/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': 'calc(0.75rem * 0.935)',
        'sm': 'calc(0.875rem * 0.935)',
        'base': 'calc(1rem * 0.935)',
        'lg': 'calc(1.125rem * 0.935)',
        'xl': 'calc(1.25rem * 0.935)',
        '2xl': 'calc(1.5rem * 0.935)',
        '3xl': 'calc(1.875rem * 0.935)',
        '4xl': 'calc(2.25rem * 0.935)',
        '5xl': 'calc(3rem * 0.935)',
        '6xl': 'calc(3.75rem * 0.935)',
        '7xl': 'calc(4.5rem * 0.935)',
        '8xl': 'calc(6rem * 0.935)',
        '9xl': 'calc(8rem * 0.935)',
      }
    },
  },
  plugins: [],
}
