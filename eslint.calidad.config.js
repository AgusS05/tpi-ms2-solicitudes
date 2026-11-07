// Configuración de CALIDAD INTERNA: umbrales objetivos para medir deuda técnica.
// No se usa en la CI: se usa para generar la evidencia antes/después (`pnpm metricas`).
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(...tseslint.configs.recommended, {
  plugins: { sonarjs },
  rules: {
    complexity: ['warn', { max: 8 }], // complejidad ciclomática por función
    'sonarjs/cognitive-complexity': ['warn', 12], // qué tan difícil es leer la función
    'max-lines-per-function': ['warn', { max: 30, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 4],
    'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
    'max-depth': ['warn', 3],
    '@typescript-eslint/no-explicit-any': 'warn',
    'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/no-collapsible-if': 'warn',
    'no-magic-numbers': ['warn', { ignore: [0, 1, -1], ignoreArrayIndexes: true }],
    'no-empty': 'warn',
    eqeqeq: 'warn',
  },
});
