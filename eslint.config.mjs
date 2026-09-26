import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", ".npm-cache/**"]),
  {
    rules: {
      quotes: ["error", "double", { avoidEscape: true }],
      "semi-style": ["error", "last"],
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
