import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const compat = new FlatCompat({ filename: __filename });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Suppress errors about unused variables starting with underscore
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_', 
        'varsIgnorePattern': '^_', 
        'ignoreRestSiblings': true 
      }],
      // Reduce severity for any types
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable prefer-const as we're working with mutable game state
      'prefer-const': 'warn',
    },
  },
];

export default eslintConfig;
