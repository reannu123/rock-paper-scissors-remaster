/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-18px)" },
          "50%": { transform: "translateY(0)" },
          "75%": { transform: "translateY(-9px)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out 3",
        pop: "pop 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
