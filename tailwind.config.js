/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F5CEC7",
          secondary: "#9D0012",
          accent: "#9D0012",
          dark: "#370006ff",
          light: "#ffffff",
          pink: "#F5CEC7",
        },
      },
      fontFamily: {
        heading: ["var(--font-days-one)", "sans-serif"],
        body: ["var(--font-geologica)", "sans-serif"],
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
