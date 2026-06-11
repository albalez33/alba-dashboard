import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0c12",
        card: "#11141d",
        cardBorder: "#1d2230",
        accent: "#a855f7",
        accent2: "#ec4899",
      },
    },
  },
  plugins: [],
};
export default config;
