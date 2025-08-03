/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1D2430', // Existing color
        'secondary': '#2A323F', // Existing color
        'accent': '#3A8DFF', // Existing color
        'text-light': '#FFFFFF', // Existing color
        'text-dark': '#B0B5B3', // Existing color
        // Add new brand colors
        'brand-yellow': '#FFFF00',
        'brand-purple': '#8A2BE2',
        'brand-green': '#32CD32',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Change font
        'display': ['Montserrat', 'sans-serif'],
      },
      // ... rest of the config
    },
  },
  plugins: [],
}
