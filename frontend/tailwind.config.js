/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Slate/ink background family — keeps the app calm and readable
        ink: {
          950: "#0B1120",
          900: "#111827",
        },
        // Primary brand accent used for the main action button and links
        flow: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
        },
      },
      fontFamily: {
        // Display/UI face
        sans: ["Inter", "system-ui", "sans-serif"],
        // Used for sequence numbers / dependency chips — gives a "data" feel
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
