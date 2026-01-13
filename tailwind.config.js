/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          rose: '#fecdd3',
          'rose-dark': '#fda4af',
          lavender: '#ddd6fe',
          'lavender-dark': '#c4b5fd',
          mint: '#a7f3d0',
          'mint-dark': '#6ee7b7',
          sky: '#bae6fd',
          'sky-dark': '#7dd3fc',
          peach: '#fed7aa',
          'peach-dark': '#fdba74',
          lilac: '#e9d5ff',
          'lilac-dark': '#d8b4fe',
          cream: '#fef7f0',
          'cream-dark': '#fef3e8',
        },
        deep: {
          charcoal: '#1e1b4b',
          slate: '#334155',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'gradient': 'gradient 8s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.9' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'pastel-rose': '0 10px 40px -10px rgba(254, 205, 211, 0.5)',
        'pastel-lavender': '0 10px 40px -10px rgba(221, 214, 254, 0.5)',
        'pastel-mint': '0 10px 40px -10px rgba(167, 243, 208, 0.5)',
        'pastel-sky': '0 10px 40px -10px rgba(186, 230, 253, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
      },
    },
  },
  plugins: [],
}
