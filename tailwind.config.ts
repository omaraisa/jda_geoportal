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
          DEFAULT: "var(--primary)", 
          transparent: "var(--primary-transparent)", 
          light: "var(--primary-light)", 
          lightTransparent: "var(--primary-light-transparent)", 
          dark: "var(--primary-dark)", 
          darkTransparent: "var(--primary-dark-transparent)", 
        },
        secondary: {
          DEFAULT: "var(--secondary)", 
          transparent: "var(--secondary-transparent)", 
          light: "var(--secondary-light)", 
          lightTransparent: "var(--secondary-light-transparent)", 
          dark: "var(--secondary-dark)",
          darkTransparent: "var(--secondary-dark-transparent)",
        },
        tertiary: {
          DEFAULT: "var(--tertiary)",
          light: "var(--tertiary-light)",
          dark: "var(--tertiary-dark)",
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
