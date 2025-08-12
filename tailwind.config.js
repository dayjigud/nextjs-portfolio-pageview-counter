/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#F3E8FF', // Light Lavender
        'secondary': '#E9D5FF', // Deeper Lavender
        'accent': '#D4F8E8', // Mint Green
        'accent-2': '#D1E8FF', // Baby Blue
        'accent-3': '#FFD6D6', // Soft Pink
        'text-dark': '#4A4A4A',
        'text-light': '#FFFFFF',
      },
      fontFamily: {
        'sans': ['Varela Round', 'sans-serif'],
        'display': ['Varela Round', 'sans-serif'],
      },
      boxShadow: {
        'clay': '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7), inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.7)',
        'clay-inset': 'inset 8px 8px 16px rgba(0, 0, 0, 0.1), inset -8px -8px 16px rgba(255, 255, 255, 0.7)',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'bounce-in': 'bounce-in 0.6s ease-out forwards',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
    },
  },
  plugins: [],
}
