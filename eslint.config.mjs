import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

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
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.js", "**/*.mjs", "**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
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
      "no-undef": "error",
      "vue/multi-word-component-names": "off", // Common in this project
      "vue/no-v-html": "off" // Use with caution
    }
  }
];
