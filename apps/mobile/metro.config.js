const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Platform-specific resolver for web builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclude SQLite dependencies and native database files for web builds
config.resolver.blockList = [
  /node_modules\/better-sqlite3\/.*/,
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/.*/,
  /node_modules\/victory-native\/.*/,
  /.*sqlite.*/,
  /.*makeDispatcher.*/,
  /.*DatabaseBridge.*/,
  /.*database\.native\.ts$/,
];

// Platform-specific file extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.ts',
  'web.tsx',
];

module.exports = config;
