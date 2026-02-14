/* eslint-disable no-undef */
const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')
const nextPlugin = require('@next/eslint-plugin-next')
const unusedImports = require('eslint-plugin-unused-imports')
const reactPlugin = require('eslint-plugin-react')
const reactHooksPlugin = require('eslint-plugin-react-hooks')
const simpleImportSort = require('eslint-plugin-simple-import-sort')

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        // nodeの環境変数
        process: 'readonly',
        __dirname: 'readonly',
        // ブラウザの環境変数
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // ES6の環境変数
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@next/next': nextPlugin,
      'unused-imports': unusedImports,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unsafe-optional-chaining': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-constant-binary-expression': 'off',
      'no-unused-private-class-members': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
