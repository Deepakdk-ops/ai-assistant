import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef2ff", 100: "#e0e7ff", 600: "#4f46e5", 700: "#3730a3", 800: "#312e81" },
        teal: { 600: "#0d9488" }
      },
      boxShadow: { soft: "0 8px 30px rgba(15, 23, 42, 0.06)" }
    }
  },
  plugins: []
} satisfies Config;
