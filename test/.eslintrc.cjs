module.exports = {
  extends: '../.eslintrc.cjs',
  env: { mocha: true },
  rules: {
    'no-unused-expressions': 'off',

    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/require-await': 'off',
    'no-restricted-imports': 'off',
  },
};
