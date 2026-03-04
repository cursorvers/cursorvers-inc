module.exports = {
  content: ["./**/*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Hiragino Kaku Gothic ProN"', '"Hiragino Sans"', 'Meiryo', 'sans-serif'],
        en: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'sans-serif'],
      },
      colors: {
        "brand-black": "#1d1d1f",
        "brand-charcoal": "#1d1d1f",
        "brand-blue": "#0071e3",
        "brand-cyan": "#66FCF1",
        "brand-cyan-strong": "#0077ED",
        "brand-gray": "#f5f5f7",
        "brand-slate": "#6e6e73",
        "hero-bg": "#FFFFFF",
        "text-primary": "#1d1d1f",
        "text-secondary": "#424245",
        "text-tertiary": "#6e6e73",
        "text-quaternary": "#86868b",
      },
      fontSize: {
        display: ["clamp(3.5rem, 8vw, 6rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        headline: ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        title: ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "body-lg": ["1.5rem", { lineHeight: "1.52" }],
        body: ["1.25rem", { lineHeight: "1.52" }],
      },
      animation: {
        "fade-in-up": "fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 40s linear infinite",
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
