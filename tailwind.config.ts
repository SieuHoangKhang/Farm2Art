import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* 🌱 Farm2Art Color Palette */
        /* Primary: Emerald Green - Tái chế, Thiên nhiên */
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#10b981", // Main primary
          600: "#059669", // Hover/Dark
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c1e",
        },
        /* Secondary: Earth Brown - Nông trại, Đất */
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24", // Golden yellow accent
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e", // Dark brown for headings
          900: "#78350f", // Darker brown
          950: "#451a03",
        },
        /* Shade/Custom Colors */
        sage: {
          50: "#f8faf6",
          100: "#f1f3ed",
          200: "#e7ebdd",
          300: "#d9dfcb",
          400: "#c4cdb1",
          500: "#a8b896", // Sage green accent
          600: "#8a9a74",
          700: "#6b7d50", // Muted green
          800: "#5a6947",
          900: "#4a563a",
        },
        /* Neutral Colors */
        stone: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c", // Body text
          600: "#57534e",
          700: "#44403c",
          800: "#292524", // Dark headings
          900: "#1c1917",
          950: "#0f0f0e",
        },
        /* Custom warm cream for backgrounds */
        cream: {
          50: "#fefce8",
          100: "#fffbeb",
          200: "#fef3c7",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
        "5xl": ["48px", { lineHeight: "48px" }],
        "6xl": ["60px", { lineHeight: "60px" }],
      },
      spacing: {
        "safe-top": "max(env(safe-area-inset-top), 0.5rem)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        base: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.12)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
        glow: "0 0 16px rgba(16, 185, 129, 0.25)",
        "glow-amber": "0 0 16px rgba(245, 158, 11, 0.2)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
