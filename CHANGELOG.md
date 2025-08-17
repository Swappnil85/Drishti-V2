# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [mvp-e5-batch1] - 2025-08-17

### feat: E5 Batch-1 (S1 Onboarding, S2 Preferences) – gated onboarding, QA resets in Settings, reduced-motion tri-state, dark-mode contrast (PR #34)

Epic 5 Batch-1 implements deterministic onboarding gating and enhanced Settings with QA tools. This release includes router-level first-run gate that blocks initial render until storage is read, ensuring fresh installs always show onboarding Step 1 without tabs flicker. Settings screen enhanced with QA tools section containing "Reset Onboarding (QA)" and "Reset ALL Preferences (QA)" buttons with immediate navigation. Tri-state reduced motion control allows user override of system setting (System/Force ON/Force OFF) with platform-specific detection (native AccessibilityInfo + web matchMedia). Web dark mode contrast fixed with explicit high-contrast colors (#FFFFFF on dark, #0A0A0A on light) for AA compliance. **Tag:** [`mvp-e5-batch1`](https://github.com/Swappnil85/Drishti-V2/releases/tag/mvp-e5-batch1) **PR:** [#34](https://github.com/Swappnil85/Drishti-V2/pull/34)

## [mvp-e4-complete] - 2025-08-17

### Epic 4: Navigation & Core UI Framework - COMPLETE

Epic 4 establishes the foundational navigation structure, theming system, and core UI components that all other features build upon. This release includes bottom tab navigation with 5 core sections, light/dark theme system with design tokens, common UI patterns (loading, empty states, modals), accessibility baseline with haptic feedback, and deep linking foundation for user acquisition. All 10 stories (E4-S1 through E4-S10) have been successfully implemented with comprehensive test coverage (71.76% overall) and WCAG 2.1 AA compliance. The implementation includes deep link routing (`drishti://` scheme), production-ready error boundary with crash reporting, and accessibility utilities for currency/date formatting. **Tag:** [`mvp-e4-complete`](https://github.com/Swappnil85/Drishti-V2/releases/tag/mvp-e4-complete) **PR:** [#31](https://github.com/Swappnil85/Drishti-V2/pull/31)

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
