import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#047B8B",
          transparent: "#047b8bc2",
          light: "#3d97a3",
          lightTransparent: "#3d97a39a",
          dark: "#145058",
          darkTransparent: "#145058b7",
        },
        secondary: {
          DEFAULT: "#e7af39",
          light: "#f8c862",
          dark: "#bb8f30",
        },
        tertiary: {
          DEFAULT: "#3BBFAD",
          light: "#51C6B7",
          dark: "#2D9C95",
        },
        danger: {
          DEFAULT: "#ed544f",
          light: "#f7736f",
          dark: "#9b2c28",
        },
        gray: {
          DEFAULT: "#6d6d6d",
          light: "#a8a8a8",
          dark: "#4a4a4a",
        },
        green: "#31b36b",
      },
    },
  },
  plugins: [],
} satisfies Config;
