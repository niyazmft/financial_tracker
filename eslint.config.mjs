import js from "@eslint/js";
import globals from "globals";

export default [
  {
    // Global ignores
    ignores: [
      "**/node_modules/",
      "dist/",
      "build/",
      ".obsidian/",
      "ProjectManager/",
      "infrastructure/docker/postgres_data/"
    ]
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.mocha,
        process: "readonly",
        __dirname: "readonly"
      }
    },
    rules: {
      "no-useless-escape": "error",
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "no-console": "off",
      "no-undef": "error"
    }
  }
];
