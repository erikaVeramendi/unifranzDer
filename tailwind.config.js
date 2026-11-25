/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        unifranz: {
          orange: '#FF6B00',
          dark: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        tech: ['Space Grotesk', 'monospace'],
      },
      boxShadow: {
        'neon-orange': '0 0 18px rgba(255, 107, 0, 0.55)',
      },
    },
  },
  plugins: [],
};
