import sharedPreset from "@assertquest/shared/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [sharedPreset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/shared/src/**/*.{ts,tsx}"],
};
