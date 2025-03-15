module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 100,
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  useTabs: false,
  endOfLine: 'lf',
  // React Native specific
  jsxBracketSameLine: false,
  // Additional configurations
  importOrder: [
    '^react$',
    '^react-native$',
    '^@react-navigation',
    '^@reduxjs',
    '<THIRD_PARTY_MODULES>',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  // Overrides for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        parser: 'json',
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'always',
      },
    },
  ],
};
