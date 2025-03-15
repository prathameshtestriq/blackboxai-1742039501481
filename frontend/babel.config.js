module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@services': './src/services',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@theme': './src/theme',
          '@assets': './src/assets',
        },
      },
    ],
    'react-native-reanimated/plugin', // Required for react-native-reanimated
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
  env: {
    production: {
      plugins: ['transform-remove-console'], // Remove console.log in production
    },
  },
};
