import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// DApp-wide button tweaks: more horizontal padding on every size (the default recipe
// felt cramped) and a visible outline (the base recipe reserves a 1px border but leaves
// its color transparent). Applied globally so every Button gets it, not per-instance.
const config = defineConfig({
  theme: {
    // "ink" is the DApp's navigation colour: a deep indigo used for chrome only, so the
    // pink/green content panels stay the colourful part of the page. Chakra v3 needs the
    // full set of semantic roles below for `colorPalette="ink"` to resolve.
    tokens: {
      colors: {
        ink: {
          50: { value: "#f2f3fb" },
          100: { value: "#e2e5f6" },
          200: { value: "#c6ccec" },
          300: { value: "#9fa9dd" },
          400: { value: "#7480c9" },
          500: { value: "#515cb0" },
          600: { value: "#3c4494" },
          700: { value: "#2f3575" },
          800: { value: "#232858" },
          900: { value: "#171a3b" },
        },
      },
    },
    semanticTokens: {
      colors: {
        ink: {
          // 600 on white is 8.6:1; 500 keeps ~5.9:1 once the surface goes dark.
          solid: { value: { base: "{colors.ink.600}", _dark: "{colors.ink.500}" } },
          contrast: { value: "white" },
          fg: { value: { base: "{colors.ink.700}", _dark: "{colors.ink.300}" } },
          muted: { value: { base: "{colors.ink.100}", _dark: "{colors.ink.800}" } },
          subtle: { value: { base: "{colors.ink.50}", _dark: "{colors.ink.900}" } },
          emphasized: { value: { base: "{colors.ink.200}", _dark: "{colors.ink.700}" } },
          focusRing: { value: { base: "{colors.ink.600}", _dark: "{colors.ink.400}" } },
        },
      },
    },
    recipes: {
      button: {
        base: {
          // base already sets borderWidth: "1px" with borderColor: "transparent".
          borderColor: "border",
        },
        variants: {
          size: {
            sm: { px: "5" },
            md: { px: "5" },
            lg: { px: "6" },
            xl: { px: "6" },
          },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
