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
          DEFAULT: "#149295",
          light: "#1FAAA8",
          dark: "#0D706A",
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
          DEFAULT: "#ca5551",
          light: "#f1a5a2",
          dark: "#a3302c",
        },
        yellow: {
          DEFAULT: "var(--yellow)",
          light: "var(--yellow-light)",
          dark: "var(--yellow-dark)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
