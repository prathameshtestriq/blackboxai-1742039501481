const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
    // Add any additional configuration options here
    maxWorkers: 2, // Limit the number of workers to improve performance
    resetCache: false, // Set to true to reset Metro's cache
    cacheVersion: '1.0', // Update this when you need to invalidate the cache
    // Configure the watchFolders to include any external dependencies
    watchFolders: [
      // Add paths to any external dependencies that should be watched
    ],
  };
})();
