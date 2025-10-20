import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F4B400",
          secondary: "#8C4A2F",
          accent: "#FCE6C2",
          dark: "#2F1B16",
          light: "#FFF8F0",
        },
      },
      fontFamily: {
        heading: ["'Playfair Display'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      spacing: {
        nav: "4.5rem",
        section: "6rem",
      },
      borderRadius: {
        card: "1.5rem",
      },
      boxShadow: {
        card: "0 20px 45px -25px rgba(47, 27, 22, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
