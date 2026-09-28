/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./projects/index.html",
    "./src/projects.js",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        ink: '#0E0E0E',
        accent: '#FF3E00',
        cobalt: '#2400FF',
        lemon: '#FFD02F',
        line: '#E4E4E4',
        mute: '#6B6B6B',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 9vw, 8.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 6vw, 5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(1.375rem, 2.6vw, 2.25rem)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'meta': ['0.8125rem', { lineHeight: '1.6', letterSpacing: '0.08em' }],
      },
    },
  },
  plugins: [],
}
