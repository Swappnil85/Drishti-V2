export default {
  expo: {
    name: 'Drishti',
    slug: 'drishti',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#007AFF',
    },
    web: {
      bundler: 'metro',
      favicon: './assets/icon.png',
    },
    plugins: ['expo-font', 'expo-sqlite'],
  },
};
