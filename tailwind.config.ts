import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--c-bg)",
        fg: "var(--c-text)",
        muted: "var(--c-text-muted)",
        faint: "var(--c-text-faint)",
        accent: "var(--c-accent-800)",
        panel: "var(--c-surface-2)",
        border: "var(--c-border)",
        link: "var(--c-link)",
        focus: "var(--c-focus)",
        "surface-1": "var(--c-surface-1)",
        "surface-2": "var(--c-surface-2)",
        "surface-3": "var(--c-surface-3)",
        "surface-accent": "var(--c-surface-accent)",
        "border-strong": "var(--c-border-strong)",
        "border-accent": "var(--c-border-accent)",
        "button-primary-bg": "var(--c-button-primary-bg)",
        "button-primary-text": "var(--c-button-primary-text)",
        "button-secondary-bg": "var(--c-button-secondary-bg)"
      },
      fontFamily: {
        display: ["var(--font-geist-pixel-square)", "monospace"],
        sans: ["var(--font-geist-pixel-square)", "monospace"],
        mono: ["var(--font-geist-pixel-square)", "monospace"]
      },
      boxShadow: {
        panel: "0 16px 38px var(--c-shadow), inset 0 1px 0 color-mix(in srgb, var(--c-text) 10%, transparent)"
      },
      maxWidth: {
        prosewide: "76ch"
      }
    }
  },
  plugins: []
};

export default config;
