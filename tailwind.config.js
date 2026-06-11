module.exports = {
  content: ["./**/*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', 'system-ui', 'sans-serif'],
        en: ['"Manrope"', '"Noto Sans JP"', 'sans-serif'],
        serif: ['"Noto Serif JP"', '"Hiragino Mincho ProN"', 'Georgia', 'serif'],
      },
      colors: {
        // Mirrors assets/css/renewal.css v2 primitives for this static Tailwind build.
        white: "#FBFAF5",
        slate: {
          50: "#F4F1EA",
          800: "#2A3A55",
          900: "#13243F",
        },
        gray: {
          400: "#6B7280",
          800: "#6B6557",
        },
        "brand-black": "#13243F",
        "brand-charcoal": "#13243F",
        "brand-blue": "#3E6FA8",
        "brand-cyan": "#7FA3CC",
        "brand-cyan-strong": "#36618F",
        "brand-gray": "#ECE7DB",
        "brand-slate": "#6B7280",
        flame: "#3E6FA8",
        orange: "#3E6FA8",
        "hero-bg": "#F4F1EA",
        "text-primary": "#13243F",
        "text-secondary": "#6B6557",
        "text-tertiary": "#6B7280",
        "text-quaternary": "#6B7280",
      },
      fontSize: {
        display: ["clamp(3.5rem, 8vw, 6rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        headline: ["clamp(2.25rem, 4vw, 3rem)", { lineHeight: "1.2", letterSpacing: "0" }],
        title: ["clamp(1.875rem, 3vw, 2.5rem)", { lineHeight: "1.3", letterSpacing: "0" }],
        "body-lg": ["1.125rem", { lineHeight: "1.8" }],
        body: ["1rem", { lineHeight: "1.8" }],
      },
      animation: {
        "fade-in-up": "fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 64s linear infinite",
        "marquee-reverse": "marquee-reverse 64s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)", filter: "blur(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
