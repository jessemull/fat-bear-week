import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import perfectionist from "eslint-plugin-perfectionist";
import unusedImports from "eslint-plugin-unused-imports";

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      perfectionist,
      "unused-imports": unusedImports,
    },
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "no-unused-vars": "off",
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
      "perfectionist/sort-interfaces": [
        "error",
        {
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
      "perfectionist/sort-named-imports": [
        "error",
        {
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-object-types": [
        "error",
        {
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-objects": [
        "error",
        {
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-union-types": [
        "error",
        {
          type: "alphabetical",
        },
      ],
      "prefer-const": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  globalIgnores([
    ".cypress-cache/**",
    ".lighthouseci/**",
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
