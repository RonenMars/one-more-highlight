import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", "examples/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    ignores: ["src/native/**", "tests/native/**"],
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { "allow": ["warn"] }],
      "no-undef": "off",
    },
  },
  {
    // React Native entry: type-aware linting against its own DOM-free project.
    files: ["src/native/**/*.{ts,tsx}", "tests/native/**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.native.json",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { "allow": ["warn"] }],
      "no-undef": "off",
    },
  },
];
