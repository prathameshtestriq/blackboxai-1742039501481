module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
  // Enable Hermes JavaScript engine
  enableHermes: true,
  // Configure the Metro bundler
  metro: {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  },
  // Configure the packager
  packagerOpts: {
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf'],
  },
};
