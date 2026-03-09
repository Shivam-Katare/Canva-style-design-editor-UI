export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        px: {
          canvas: "#0c0c0e",
          shell: "#111114",
          sidebar: "#16161a",
          hover: "#1e1e24",
          border: "#242430",
          accent: "#ff6b4a",
          danger: "#e8445a",
          primary: "#f0f0f5",
          muted: "#6b6b7a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
