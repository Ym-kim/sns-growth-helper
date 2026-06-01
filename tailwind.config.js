/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#F0EDFF",
          100: "#DDD6FF",
          200: "#BEB0FF",
          400: "#8B6FFF",
          500: "#6E4CF5",
          600: "#5B3CF5",
          700: "#4A2ED4",
          900: "#1E0A6E",
        },
        rose: {
          400: "#FF6B9D",
          500: "#FF4D8B",
          600: "#E83070",
        },
        ink: {
          900: "#0E0A1E",
          700: "#2D2845",
          500: "#5F5A7A",
          300: "#9B97B0",
          100: "#E8E6F0",
          50:  "#F5F4F8",
        },
        surface: "#FFFFFF",
        canvas: "#F7F6FA",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #5B3CF5 0%, #E040A0 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #EDE9FF 0%, #FFE0F4 100%)",
        "success-gradient": "linear-gradient(135deg, #00C896 0%, #00A878 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(14,10,30,0.05), 0 4px 16px rgba(14,10,30,0.07)",
        "card-hover": "0 4px 12px rgba(14,10,30,0.08), 0 12px 32px rgba(91,60,245,0.12)",
        "btn-primary": "0 4px 14px rgba(91,60,245,0.4)",
        "btn-primary-hover": "0 6px 20px rgba(91,60,245,0.5)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
    },
  },
  plugins: [],
};
