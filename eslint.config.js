import tsPlugin from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',
      'test-results/**',
      'playwright-report/**',
      '.playwright/**',
    ],
  },
  ...tsPlugin.configs.recommended,
  {
    files: ['src/**/*.{js,ts}', 'tests/**/*.{js,ts}', '*.js', '*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',
    },
  },
];
