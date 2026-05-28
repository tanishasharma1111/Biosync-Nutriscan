/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emerald: {
          400: '#34d399',
          500: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
