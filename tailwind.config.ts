import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        porcelain: {
          50: "#FFFFFF",
          100: "#F5F9FD",
          200: "#EBF3FB",
          300: "#DDEAF7",
          400: "#C3D8EF",
          500: "#9FBEE3",
          DEFAULT: "#F5F9FD",
        },
        cobalt: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#5EA2FF",
          500: "#0B4FBA",
          600: "#093E94",
          700: "#072E70",
          800: "#051F4D",
          900: "#03112E",
          DEFAULT: "#0B4FBA",
        },
        azure: {
          50: "#F0F7FF",
          100: "#E0EFFE",
          200: "#BAE0FD",
          300: "#7CC2FC",
          400: "#5EA2FF",
          500: "#2B82F6",
          600: "#1362D9",
          DEFAULT: "#5EA2FF",
        },
        surface: {
          primary: "var(--surface-primary)",
          secondary: "var(--surface-secondary)",
          elevated: "var(--surface-elevated)",
        },
        border: {
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        accent: {
          indigo: "var(--accent-indigo)",
          cyan: "var(--accent-cyan)",
          violet: "var(--accent-violet)",
        },
        status: {
          success: "var(--status-success)",
          "success-subtle": "var(--status-success-subtle)",
          warning: "var(--status-warning)",
          "warning-subtle": "var(--status-warning-subtle)",
          error: "var(--status-error)",
          "error-subtle": "var(--status-error-subtle)",
          inactive: "var(--status-inactive)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "'Jeju Gothic'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        serif: ["var(--font-serif)", "Italiana", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
