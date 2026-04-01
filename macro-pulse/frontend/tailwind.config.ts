import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0a",
          card: "#111111",
          "card-hover": "#1a1a1a",
        },
        border: "#222222",
        regime: {
          red: "#ef4444",
          green: "#22c55e",
          yellow: "#eab308",
          blue: "#3b82f6",
          "red-dim": "rgba(239, 68, 68, 0.15)",
          "green-dim": "rgba(34, 197, 94, 0.15)",
          "yellow-dim": "rgba(234, 179, 8, 0.15)",
          "blue-dim": "rgba(59, 130, 246, 0.15)",
        },
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
