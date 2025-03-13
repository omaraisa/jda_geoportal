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
          DEFAULT: "#ffffff",
          transparent: "#ffffffc2",
          light: "#d8d8d8",
          lightTransparent: "#d8d8d89a",
          dark: "#9c9c9c",
          darkTransparent: "#9c9c9c9a",
        },
        secondary: {
          DEFAULT: "#7c7c7c",
          light: "#949494",
          dark: "#333333",
          transparent: "#7c7c7c9a",
          lightTransparent: "#9494949a",
          darkTransparent: "#3333339a",
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
