/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#F97316", // CTA buttons
          orangeHover: "#EA580C",
          dark: "#1C1F26", // dark policy card background
          green: "#16A34A", // upload/download actions
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 10px 30px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        xl: "12px",
      },
      maxWidth: {
        container: "80rem", // ~1280px
      },
    },
  },
  plugins: [],
};
