import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import perfectionist from "eslint-plugin-perfectionist";

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      perfectionist,
    },
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            "type-import",
            ["value-builtin", "value-external"],
            "type-internal",
            "value-internal",
            ["type-parent", "type-sibling", "type-index"],
            ["value-parent", "value-sibling", "value-index"],
            "ts-equals-import",
            "unknown",
          ],
          internalPattern: ["^@/.+"],
          newlinesBetween: 1,
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-jsx-props": [
        "error",
        {
          customGroups: [
            { elementNamePattern: "^key$", groupName: "key" },
            { elementNamePattern: "^on.+", groupName: "callback" },
          ],
          groups: ["key", "unknown", "callback"],
          type: "alphabetical",
        },
      ],
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  globalIgnores([
    ".cypress-cache/**",
    ".next/**",
    "build/**",
    "coverage/**",
    "cypress/screenshots/**",
    "cypress/videos/**",
    "next-env.d.ts",
    "node_modules/**",
    "out/**",
  ]),
]);
