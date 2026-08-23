/**
 * "Skill Track" design tokens — redesigned taking inspiration from HackerRank's
 * practice-platform look: light surfaces, a near-black nav bar, and a vivid
 * signature-green primary accent, organized around icon+label card grids.
 * Same token *names* as before (foam/mist/navy/teal/coral/porthole) so every
 * consuming component keeps working:
 *   foam  = page canvas (near-white)
 *   mist  = card/surface/border scale
 *   navy  = foreground/text scale (900 darkest/heading, 500 muted body)
 *   teal  = primary accent — HackerRank-style green
 *   coral = secondary/danger accent, warm
 *   porthole = the one deliberately dark surface — nav bar, code blocks —
 *              echoing HackerRank's black nav on a white page
 */
export default {
  theme: {
    extend: {
      colors: {
        foam: {
          DEFAULT: "#F7FAF8",
          50: "#FCFEFD",
          100: "#F7FAF8",
          200: "#EBF3EE",
        },
        mist: {
          DEFAULT: "#EBF3EE",
          100: "#F1F7F3",
          200: "#DEEBE3",
          300: "#C8DDCE",
        },
        teal: {
          50: "#EBFBF1",
          100: "#CFF3DC",
          200: "#9FE6B8",
          300: "#66D28C",
          400: "#31B85F",
          500: "#12A24A",
          600: "#0E8A3C",
          700: "#0B6F30",
          800: "#0A5828",
          900: "#0A461F",
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
          50: "#EEF2F0",
          100: "#D3DEDA",
          200: "#A7BDB3",
          300: "#77967F",
          400: "#4C6E51",
          500: "#334A38",
          600: "#22331F",
          700: "#1A2818",
          800: "#131F13",
          900: "#0D1710",
        },
        porthole: {
          DEFAULT: "#0A0F0C",
          surface: "#131914",
          border: "#232B24",
          glow: "#12A24A",
        },
      },
      fontFamily: {
        // Kept as an alias (not a second typeface) so existing `font-display` usage
        // still resolves — IBM Plex Sans/Mono pairing throughout.
        display: ["\"IBM Plex Sans\"", "system-ui", "-apple-system", "sans-serif"],
        sans: ["\"IBM Plex Sans\"", "system-ui", "-apple-system", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(13, 23, 16, 0.12)",
        porthole: "0 0 0 1px rgba(18, 162, 74, 0.35), 0 8px 24px rgba(0, 0, 0, 0.45)",
        lift: "0 20px 40px -12px rgba(13, 23, 16, 0.2)",
      },
      backgroundImage: {
        "harbor-gradient": "radial-gradient(circle at 15% 0%, rgba(18,162,74,0.22), transparent 42%), linear-gradient(180deg, #131914 0%, #0A0F0C 100%)",
        "harbor-grid": "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        "foam-gradient": "linear-gradient(180deg, #F7FAF8 0%, #EBF3EE 100%)",
        // Soft diagonal split: a near-white plane meeting a faint mist wedge, no
        // color saturation, just a shadow line — same treatment as before.
        "diagonal-fade": "linear-gradient(122deg, #FCFEFD 0%, #FCFEFD 42%, #EDF5F0 43%, #F7FAF8 100%)",
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
