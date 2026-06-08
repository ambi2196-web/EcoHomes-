/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // EcoHomes brand palette
        earth: {
          50:  "#f7f3ee",
          100: "#ede3d4",
          200: "#d9c5a8",
          300: "#c2a07a",
          400: "#ae8056",
          500: "#9e6b3e",
          600: "#875534",
          700: "#6d412c",
          800: "#5a3629",
          900: "#4c2f25",
        },
        forest: {
          50:  "#f0f7f0",
          100: "#dceddb",
          200: "#bbdaba",
          300: "#8fc18e",
          400: "#62a461",
          500: "#428740",
          600: "#316b30",
          700: "#285527",
          800: "#214421",
          900: "#1b381b",
        },
        sky: {
          50:  "#f0f7ff",
          500: "#3b82f6",
          600: "#2563eb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
