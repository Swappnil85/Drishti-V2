module.exports = {
  extends: ['../../.eslintrc.json'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['src/__tests__/**', 'src/tests/**'],
};
