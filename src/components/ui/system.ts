import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// DApp-wide button tweaks: more horizontal padding on every size (the default recipe
// felt cramped) and a visible outline (the base recipe reserves a 1px border but leaves
// its color transparent). Applied globally so every Button gets it, not per-instance.
const config = defineConfig({
  theme: {
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
