/** @type {import('tailwindcss').Config} */
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
          DEFAULT: "#934B96",
          light: "#cb69ce",
          dark: "#5b245d",
        },
        secondary: {
          DEFAULT: "#149295",
          light: "#1FAAA8",
          dark: "#0D706A",
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
      },
    },
  },
  plugins: [],
};
