import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          card: "#16161f",
          "card-hover": "#1c1c28",
        },
        border: {
          DEFAULT: "#2a2a3a",
          active: "#ff3b5c",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8888a0",
          muted: "#55556a",
        },
        accent: {
          DEFAULT: "#ff3b5c",
          hover: "#ff5577",
          glow: "rgba(255, 59, 92, 0.15)",
        },
        success: "#00d4aa",
        warning: "#ffaa00",
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
