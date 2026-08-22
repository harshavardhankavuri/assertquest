/**
 * Ocean Breeze design tokens (AssertQuest PRD §6), shared by every app's Tailwind config.
 * Foam/mist light surfaces, teal primary, coral secondary, navy headings, one dark
 * "porthole" surface for contrast grounding (terminal / self-host card style elements).
 * Typography and motion lean minimal/high-contrast (Linear/Vercel-inspired): one sans
 * family throughout, crisp borders over drop shadows, hover states that shift color
 * rather than translate/bounce.
 */
export default {
  theme: {
    extend: {
      colors: {
        foam: {
          DEFAULT: "#F4FBFA",
          50: "#FBFEFD",
          100: "#F4FBFA",
          200: "#E7F2F1",
        },
        mist: {
          DEFAULT: "#E7F2F1",
          100: "#EFF6F5",
          200: "#DCEAE9",
          300: "#C7DBD9",
        },
        teal: {
          50: "#EAFBFA",
          100: "#CFF3F1",
          200: "#9FE6E2",
          300: "#66D2CC",
          400: "#31B8B1",
          500: "#0E8A8C",
          600: "#0B6F71",
          700: "#0A5A5C",
          800: "#0A484A",
          900: "#0A3B3C",
        },
        coral: {
          50: "#FFF1EE",
          100: "#FFDDD5",
          200: "#FFB8A8",
          300: "#FF9179",
          400: "#FF7A5C",
          500: "#FF6F59",
          600: "#E6573F",
          700: "#C0442F",
          800: "#973627",
          900: "#742B20",
        },
        navy: {
          50: "#EEF2F7",
          100: "#D3DEEA",
          200: "#A7BDD5",
          300: "#7796B9",
          400: "#4C6E93",
          500: "#2E4E71",
          600: "#1C3856",
          700: "#12314D",
          800: "#0E2740",
          900: "#0B1F33",
        },
        porthole: {
          DEFAULT: "#0A1826",
          surface: "#0F2436",
          border: "#1B3448",
          glow: "#1A6E70",
        },
      },
      fontFamily: {
        // Kept as an alias (not a second typeface) so existing `font-display` usage
        // still resolves — the redesign standardizes on one sans family throughout.
        display: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(10, 31, 51, 0.12)",
        porthole: "0 0 0 1px rgba(26, 110, 112, 0.4), 0 8px 24px rgba(0, 0, 0, 0.4)",
        lift: "0 20px 40px -12px rgba(10, 31, 51, 0.25)",
      },
      backgroundImage: {
        "harbor-gradient": "radial-gradient(circle at 15% 0%, rgba(14,138,140,0.28), transparent 42%), linear-gradient(180deg, #0B1F33 0%, #0A1826 100%)",
        "harbor-grid": "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        "foam-gradient": "linear-gradient(180deg, #F4FBFA 0%, #E7F2F1 100%)",
        // Soft diagonal split (minrims.com-style product-page hero): a near-white
        // plane meeting a faint mist wedge, no color saturation, just a shadow line.
        "diagonal-fade": "linear-gradient(122deg, #FBFEFD 0%, #FBFEFD 42%, #EAF2F1 43%, #F4FBFA 100%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        // Slow, subtle drift for background geometric line-art — never bounce/scale,
        // consistent with the "hover states shift color, not translate" motion rule.
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        marquee: "marquee 28s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "spin-slow": "spin-slow 40s linear infinite",
      },
    },
  },
};
