# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Mobile App Setup**: Fixed Expo SDK version mismatch preventing QR code scanning
- **Web App Rendering**: Fixed blank screen issue on web platform
- **Component Registration**: Implemented proper app entry point with `registerRootComponent`
- **Dependencies**: Updated core dependencies to SDK 53 compatible versions
- **Assets**: Added missing icon assets for proper app initialization

### Changed
- **Entry Point**: Changed main entry from `App.tsx` to `index.js` for proper registration
- **SDK Version**: Upgraded to Expo SDK 53 for latest compatibility
- **React Version**: Updated to React 19.0.0 and React Native 0.79.5
- **Web Support**: Added react-native-web@0.19.13 for proper web rendering

### Added
- **Troubleshooting Guide**: Comprehensive guide for common development issues
- **Setup Documentation**: Enhanced mobile setup instructions with SDK requirements
- **Error Handling**: Better error messages and debugging information

### Technical Details
- Fixed "main" has not been registered error
- Resolved Expo Router static rendering conflicts
- Added proper Metro bundler configuration
- Implemented cross-platform asset management

## Previous Versions

### [1.0.0] - Initial Release
- Initial project setup with React Native and Expo
- Basic authentication system
- Camera integration for document capture
- API backend with PostgreSQL database
- Mobile app with navigation and state management
