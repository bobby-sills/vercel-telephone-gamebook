export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["warn", "single"],
      "no-trailing-spaces": "warn",
      "eol-last": "warn",
      "no-multiple-empty-lines": ["warn", { "max": 2 }],
      "no-console": "off", // Allow console for server logging
      "no-unreachable": "error"
    }
  }
];