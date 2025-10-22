/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // << habilita dark via classe .dark no <html>
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F1A",
        surface: "#121826",
        primary: "#1E3A8A",
        accent: "#A3E635",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
