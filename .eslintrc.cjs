module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  rules: {
    // allow jsx extensions
    'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
    // React 17+ JSX transform (no need to import React in scope)
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    // TypeScript handles props typing
    'react/prop-types': 'off',
    // allow apostrophes/quotes in JSX text
    'react/no-unescaped-entities': 'off',
    // optional rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};
