/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    "#1e2d5a",
          teal:    "#2bbfa4",
          cyan:    "#29b6e8",
          blue:    "#3b82f6",
          light:   "#e8f8f5",
          lighter: "#f0fbf9",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.07), 0 2px 12px rgba(0,0,0,0.04)",
        nav:  "0 -1px 0 #e5e7eb",
      },
    },
  },
  plugins: [],
};