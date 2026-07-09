/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./projeto.html", "./criacao-de-sites-*.html"],
  theme: {
    extend: {
      colors: {
        dark: "#000000",
        gold: "#FFB800",
        "gold-dark": "#CC9200",
        soft: "#FFFFFF"
      },
      boxShadow: {
        gold: "0 0 40px rgba(255, 184, 0, 0.35), 0 20px 60px -24px rgba(255, 184, 0, 0.25)",
        glass: "0 10px 40px rgba(0,0,0,0.5)"
      }
    }
  },
  plugins: []
};
