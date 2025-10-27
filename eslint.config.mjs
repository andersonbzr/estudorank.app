// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";

export default [
  // Ignorar diretórios gerados
  { ignores: ["node_modules/**", ".next/**", "dist/**", "build/**"] },

  // Presets recomendados
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,

  // 👇 Regras personalizadas
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "prefer-const": "warn",
    },
  },
];
