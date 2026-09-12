import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#151F33", 800: "#1C2A45", 700: "#24365C", 600: "#334671" },
        paper: { DEFAULT: "#F6F3EC", 100: "#FBF9F4" },
        ink: { DEFAULT: "#232A36", 600: "#4C5566", 400: "#7B8494" },
        saffron: { DEFAULT: "#C1832B", 600: "#A76F22", 100: "#F4E4C6" },
        forest: { DEFAULT: "#2F6B4F", 100: "#DDEBE3" },
        line: "#DDD6C5",
        rust: "#B44B3D",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
