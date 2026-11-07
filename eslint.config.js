// Configuración base: reglas recomendadas. Es la que corre `pnpm lint` y la CI.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'coverage/**', 'legacy/**', 'docs/**', 'data/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
  {
    rules: {
      // En la versión inicial hay `any`: se reporta como advertencia (deuda a pagar).
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
