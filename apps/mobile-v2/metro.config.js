const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo SDK 53 in apps/mobile-v2.
 * - disableHierarchicalLookup prevents Metro from walking up and picking
 *   hoisted copies from the workspace root (e.g., React 19.1.x), which
 *   can break TurboModules like PlatformConstants.
 * - We keep defaults otherwise.
 */
const config = getDefaultConfig(__dirname);

// Prevent hoisted/upper-level module pickup that breaks TurboModules
config.resolver.disableHierarchicalLookup = true;

// Ensure blockList exists even if not used, to make future guards easy
config.resolver.blockList = config.resolver.blockList || [];

module.exports = config;

