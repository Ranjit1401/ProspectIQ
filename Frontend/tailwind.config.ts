import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "#262626",
        input: "#262626",
        ring: "#8a8a8a",
        background: "#090909",
        foreground: "#ffffff",
        surface: {
          DEFAULT: "#111111",
          raised: "#151515",
          sunken: "#0c0c0c",
        },
        muted: {
          DEFAULT: "#1a1a1a",
          foreground: "#9a9a9a",
        },
        accent: {
          DEFAULT: "#c9c9c9",
          silver: "#c9c9c9",
          platinum: "#e5e4e2",
          foreground: "#090909",
        },
        primary: {
          DEFAULT: "#ffffff",
          foreground: "#090909",
        },
        secondary: {
          DEFAULT: "#151515",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        popover: {
          DEFAULT: "#111111",
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "#111111",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
        xl: "20px",
        "2xl": "24px",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.85", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.25)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "fade-up": "fade-up 0.5s ease-out",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      boxShadow: {
        premium: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.6)",
        glow: "0 0 40px -10px rgba(255,255,255,0.15)",
        "glow-cyan": "0 0 30px -5px rgba(6, 182, 212, 0.25)",
        "glow-emerald": "0 0 30px -5px rgba(16, 185, 129, 0.25)",
        "glow-amber": "0 0 30px -5px rgba(245, 158, 11, 0.25)",
        "card-hover": "0 1px 0 0 rgba(255,255,255,0.08) inset, 0 24px 60px -15px rgba(0,0,0,0.75)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
