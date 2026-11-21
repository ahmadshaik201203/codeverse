import type { Config } from "tailwindcss";

/**
 * CodeVerse design tokens — Tailwind surface.
 * Values are semantic aliases over the CSS custom properties in globals.css.
 * Never hardcode brand hex values in components; use these tokens.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#252827",
          soft: "#3C4340",
          muted: "#5B625E",
          faint: "#656C68",
        },
        ivory: {
          DEFAULT: "#F4F2ED",
          warm: "#FBFAF6",
          deep: "#E9E5DB",
          shade: "#DCD7CA",
        },
        forest: {
          DEFAULT: "#536B58",
          deep: "#3F5245",
          soft: "#6E8472",
          tint: "#E3E8DF",
        },
        sage: {
          DEFAULT: "#89978A",
          light: "#A9B3A7",
          pale: "#CBD2C6",
          mist: "#EDEFE9",
        },
        paper: "var(--color-surface)",
        hairline: "var(--color-border)",
      },
      fontFamily: {
        // One global family: Bodoni Moda. All three utilities alias to it so
        // existing font-sans / font-serif / font-mono classes stay Bodoni.
        sans: ["var(--font-bodoni)", '"Bodoni Moda"', "serif"],
        serif: ["var(--font-bodoni)", '"Bodoni Moda"', "serif"],
        mono: ["var(--font-bodoni)", '"Bodoni Moda"', "serif"],
      },
      borderRadius: {
        control: "10px",
        card: "18px",
        panel: "26px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(37,40,39,0.04), 0 14px 34px -20px rgba(37,40,39,0.35)",
        lift: "0 2px 4px rgba(37,40,39,0.05), 0 28px 52px -28px rgba(37,40,39,0.45)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.55)",
      },
      letterSpacing: {
        label: "0.22em",
      },
      maxWidth: {
        reading: "68ch",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "ink-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-6px,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 500ms ease-out both",
        "ink-drift": "ink-drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
