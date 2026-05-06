/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F7F6',
          100: '#B1CCC9',
          200: '#7EAAA6',
          300: '#478680',
          400: '#196861',
          500: '#005850', // Primærfarge
          600: '#004F48',
          700: '#00443D',
          800: '#003A34',
          900: '#002E29',
        }
      }
    },
  },
  plugins: [],
}
