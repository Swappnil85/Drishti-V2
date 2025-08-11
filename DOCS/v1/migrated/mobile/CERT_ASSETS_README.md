# Mobile Certificate Assets & Pinning

This guide explains how to bundle and rotate certificate/public key assets for mobile pinning.

## Asset Placement
- iOS: Place .cer/.der in ios/Drishti/Resources (or per library vendor instructions)
- Android: Place .cer/.der in android/app/src/main/res/raw/
- Expo: Ensure assets are included during prebuild and referenced correctly by react-native-ssl-pinning

## Configuration
- Pin IDs in code: PinningConfig.certIds = ['drishti', 'drishti-backup']
- Env: EXPO_PUBLIC_USE_PINNED_CLIENT=true, EXPO_PUBLIC_API_URL
- Domains: Update allowedHosts to include production and staging hosts

## Rotation Procedure
1. Generate new certificate/public key asset (backup pin)
2. Add file to both platform asset paths (without removing old one)
3. Add new id to PinningConfig.certIds (keep old id as backup)
4. Release app update with both pins present
5. Update server certificate to new pin
6. After 1-2 app release cycles, remove old pin id from PinningConfig

## Validation Checklist
- Pinned transport enabled in staging
- Requests succeed with active pin; fail with invalid cert
- Backup pin acceptance verified
- Violation reporting hits /security/pinning/violation on failure

## Troubleshooting
- Ensure correct file names (without extensions in config)
- Confirm Expo prebuild includes assets
- Verify Android raw resource naming conventions

