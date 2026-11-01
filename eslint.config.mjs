import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

// The block eslint-config-next uses for react-hooks. Scoping to it keeps react-hooks rules off tests/*.cjs,
// where the plugin is not registered and `eslint .` would crash.
const REACT_HOOKS_FILES = ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];

export default defineConfig([
  ...nextVitals,
  // Next only applies the plugin's `recommended` preset; `recommended-latest` adds the rules React ships ahead of it.
  // See docs/research/eslint-plugin-react-hooks-rules.md.
  { ...reactHooks.configs.flat["recommended-latest"], files: REACT_HOOKS_FILES },
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", ".npm-cache/**"]),
  {
    rules: {
      quotes: ["error", "double", { avoidEscape: true }],
      "semi-style": ["error", "last"],
    },
  },
]);
