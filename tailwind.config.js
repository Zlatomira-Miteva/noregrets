/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F4B400",
          secondary: "#8C4A2F",
          accent: "#FCE6C2",
          dark: "#2F1B16",
          light: "#FFF1EB",
          pink: "#F5C0C0",
        },
      },
      fontFamily: {
        heading: ["'Playfair Display'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      spacing: {
        section: "6rem",
      },
      borderRadius: {
        card: "1.5rem",
      },
      boxShadow: {
        card: "0 30px 45px -25px rgba(47, 27, 22, 0.3)",
      },
    },
  },
  plugins: [],
};
