module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0A2540", blue: "#1B4F8A", sky: "#2E79B5",
          gold: "#C9932A", amber: "#F5A623", light: "#EDF2F7",
          border: "#C7D3E0", success: "#1A7340", danger: "#8B1A1A", text: "#1A2B3C"
        }
      },
      fontFamily: {
        heading: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Source Serif 4'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      }
    }
  },
  plugins: []
};
