import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface IntegrityIndicator {
  id: string;
  label: string;
  passed: boolean;
  details?: string;
}

export interface IntegrityReport {
  isCompromised: boolean;
  riskScore: number; // 0-100 (higher = more risky)
  indicators: IntegrityIndicator[];
  recommendations: string[];
  generatedAt: string;
}

export class SecurityIntegrityService {
  async checkIntegrity(): Promise<IntegrityReport> {
    const indicators: IntegrityIndicator[] = [];

    // 1) Emulator/simulator detection
    const isEmulator = await Device.isDevice ? false : true; // expo-device indicates Device.isDevice (true for real device)
    indicators.push({ id: 'emulator', label: 'Running on real device', passed: Device.isDevice ?? false, details: isEmulator ? 'Emulator/Simulator detected' : undefined });

    // 2) Root/Jailbreak heuristics (non-invasive)
    const suspiciousPaths = Platform.OS === 'ios'
      ? ['/Applications/Cydia.app', '/Library/MobileSubstrate/MobileSubstrate.dylib', '/bin/bash']
      : ['/system/app/Superuser.apk', '/system/xbin/su', '/sbin/su'];

    let jailbreakHint = false;
    for (const p of suspiciousPaths) {
      try {
        const info = await FileSystem.getInfoAsync(p);
        if (info.exists) {
          jailbreakHint = true; break;
        }
      } catch (_e) { /* ignore */ }
    }
    indicators.push({ id: 'jailbreak', label: 'No jailbreak/root artifacts', passed: !jailbreakHint, details: jailbreakHint ? 'Suspicious file path present' : undefined });

    // 3) Writable system dir check (attempts are limited to metadata; no writes)
    // We avoid writing to system directories; rely on path existence checks only.

    // 4) Developer options / Debug hints (best-effort, platform limited)
    // With Expo, limited. Assume not determinable; leave as neutral.

    // Score calculation: weight key indicators
    let riskScore = 0;
    if (!Device.isDevice) riskScore += 20;
    if (jailbreakHint) riskScore += 60;
    // Clamp 0..100
    riskScore = Math.max(0, Math.min(100, riskScore));

    const isCompromised = riskScore >= 50;

    const recommendations: string[] = [];
    if (jailbreakHint) recommendations.push('Remove jailbreak/root and restore factory settings.');
    if (!Device.isDevice) recommendations.push('Use a physical device for best security.');
    if (!recommendations.length) recommendations.push('Keep your OS updated and enable device lock with biometrics.');

    return {
      isCompromised,
      riskScore,
      indicators,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const securityIntegrityService = new SecurityIntegrityService();

