/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1DB954",
          "primary-hover": "#1ed760",
          surface: "#0f0f0f",
          "surface-elevated": "#18181b",
          "surface-muted": "#27272a",
          background: "#0a0a0a",
          "text-muted": "#a1a1aa",
          "text-subtle": "#71717a",
          border: "#27272a",
        },
        "spotify-green": "#1DB954",
        surface: "#0f0f0f",
        "surface-elevated": "#18181b",
        "surface-muted": "#27272a",
      },
      fontFamily: {
        display: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
