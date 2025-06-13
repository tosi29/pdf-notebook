/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
        '500': '500px',
        '580': '580px',
        '650': '650px',
      }
    },
  },
  plugins: [],
}