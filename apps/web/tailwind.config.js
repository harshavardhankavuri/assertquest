/**
 * SwiftCargo's own brand tokens — deliberately NOT the shared Ocean Breeze preset.
 * Flat enterprise-SaaS look drawn from the product's design mockups: near-black ink,
 * a single indigo brand accent, cool-gray surfaces, small (8-12px) radii, no gradients
 * or motion flourishes. AssertQuest (apps/th-web) keeps its own separate teal/coral theme.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/shared/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#101418",
          900: "#101418",
          700: "#1c2226",
          600: "#3d464e",
          500: "#5b6670",
        },
        muted: "#7f8992",
        faint: "#9aa3ab",
        hairline: "#e2e6ea",
        surface: {
          DEFAULT: "#f6f7f9",
          card: "#ffffff",
          subtle: "#f8f9fa",
          row: "#f7f8fa",
        },
        brand: {
          50: "#eef1fa",
          100: "#dbe1f4",
          200: "#b7c3e9",
          300: "#93a5de",
          400: "#5a74bf",
          500: "#3550a8",
          600: "#2c4390",
          700: "#233570",
          800: "#1b284f",
          900: "#141d38",
        },
        positive: {
          50: "#eaf6f0",
          600: "#2c6b4f",
          700: "#1f4d39",
        },
        negative: {
          50: "#fdf3ef",
          100: "#f4d9cd",
          600: "#bd4020",
          700: "#8f3a18",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 20, 24, 0.04)",
      },
    },
  },
};
