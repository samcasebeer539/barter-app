// ESLint for the app (run: npm run lint; CI fails on any error or warning).
// Expo's recommended rules for React Native + TypeScript, with a few changes
// explained below.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
// Turns off ESLint's formatting rules: Prettier does the formatting.
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'backend/*', 'coverage/*', '.expo/*', 'node_modules/*'],
  },
  {
    rules: {
      // These check code for the React Compiler, which this app doesn't use
      // (no reactCompiler in app.json). Its patterns (reading refs during
      // render, setState in effects) are fine without it.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      // A web rule: React Native shows ' and " in <Text> as written.
      'react/no-unescaped-entities': 'off',
      // An effect that leaves a dependency out on purpose says why, in an
      // eslint-disable comment next to it.
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Jest: mocks are declared before the imports they replace, and stand-in
    // components are tiny anonymous functions.
    files: ['tests/**'],
    rules: {
      'import/first': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: ['scripts/**', '*.config.js'],
    languageOptions: {
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly' },
    },
  },
]);
