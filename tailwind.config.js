/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1a202c',
        'secondary': '#2d3748',
        'accent': '#4a5568',
        'accent-2': '#718096',
        'accent-3': '#a0aec0',
        'text-dark': '#f7fafc',
        'text-light': '#e2e8f0',
      },
      fontFamily: {
        'sans': ['Varela Round', 'sans-serif'],
        'display': ['Varela Round', 'sans-serif'],
      },
      boxShadow: {
        'clay': '8px 8px 16px rgba(0, 0, 0, 0.25), -8px -8px 16px rgba(45, 55, 72, 0.5)',
        'clay-inset': 'inset 8px 8px 16px rgba(0, 0, 0, 0.25), inset -8px -8px 16px rgba(45, 55, 72, 0.5)',
      },
    },
  },
  plugins: [],
}
