// noinspection JSUnresolvedReference

import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// noinspection JSUnresolvedReference
export default tseslint.config([
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettierConfig,
    ],
    ...jsxA11y.flatConfigs.recommended,
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      sonarjs,
      security,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      prettier,
    },
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...security.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Import 관련 규칙
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      // React 관련 규칙 조정
      'react/react-in-jsx-scope': 'off', // React 17+ 불필요
      'react/prop-types': 'off', // TypeScript 사용시 불필요
    },
  },
]);
