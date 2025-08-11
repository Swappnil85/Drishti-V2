import { Platform } from 'react-native';
import {
  securityIntegrityService,
  IntegrityReport,
} from './SecurityIntegrityService';
import { attestationService } from './AttestationService';

export interface SecurityScoreData {
  score: number; // 0-100 (higher = more secure)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    name: string;
    impact: number; // -50 to +50
    description: string;
  }>;
  recommendations: string[];
  lastUpdated: string;
}

export class DeviceIntegrityEnhanced {
  private cachedScore: SecurityScoreData | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getSecurityScore(forceRefresh = false): Promise<SecurityScoreData> {
    const now = Date.now();

    if (
      !forceRefresh &&
      this.cachedScore &&
      now - this.lastCheck < this.CACHE_DURATION
    ) {
      return this.cachedScore;
    }

    // Get basic integrity report
    const integrityReport = await securityIntegrityService.checkIntegrity();

    // Attempt attestation if enabled
    let attestationScore = 0;
    const attestationEnabled =
      process.env.EXPO_PUBLIC_DEVICE_ATTESTATION_ENABLED === 'true';

    if (attestationEnabled) {
      try {
        const token = await this.getAttestationToken();
        if (token) {
          const result =
            Platform.OS === 'ios'
              ? await attestationService.verifyIOS(token)
              : await attestationService.verifyAndroid(token);

          if (result.success && (result.data as any)?.verified) {
            const risk = (result.data as any)?.riskScore ?? 50;
            attestationScore = Math.max(0, 100 - risk);
          }
        }
      } catch (error) {
        console.warn('Attestation failed:', error);
      }
    }

    // Calculate composite security score
    const baseScore = Math.max(0, 100 - integrityReport.riskScore);
    const finalScore = attestationEnabled
      ? Math.round(baseScore * 0.6 + attestationScore * 0.4)
      : baseScore;

    // Determine risk level
    let riskLevel: SecurityScoreData['riskLevel'] = 'low';
    if (finalScore < 30) riskLevel = 'critical';
    else if (finalScore < 50) riskLevel = 'high';
    else if (finalScore < 70) riskLevel = 'medium';

    // Build factors array
    const factors: SecurityScoreData['factors'] = [];

    integrityReport.indicators.forEach(indicator => {
      const impact = indicator.passed ? 10 : -20;
      factors.push({
        name: indicator.label,
        impact,
        description:
          indicator.details ||
          (indicator.passed
            ? 'Security check passed'
            : 'Security concern detected'),
      });
    });

    if (attestationEnabled && attestationScore > 0) {
      factors.push({
        name: 'Device Attestation',
        impact: Math.round((attestationScore - 50) / 5),
        description: 'Hardware-backed device verification',
      });
    }

    // Enhanced recommendations
    const recommendations = [...integrityReport.recommendations];

    if (finalScore < 50) {
      recommendations.push('Consider using Drishti on a more secure device');
      recommendations.push('Enable automatic security updates');
    }

    if (!attestationEnabled) {
      recommendations.push('Enable device attestation for enhanced security');
    }

    this.cachedScore = {
      score: finalScore,
      riskLevel,
      factors,
      recommendations,
      lastUpdated: new Date().toISOString(),
    };

    this.lastCheck = now;
    return this.cachedScore;
  }

  private async getAttestationToken(): Promise<string | null> {
    // Placeholder for platform-specific attestation token acquisition
    // In production, this would use:
    // - Android: Play Integrity API or SafetyNet
    // - iOS: DeviceCheck or App Attest

    if (Platform.OS === 'android') {
      // TODO: Implement Play Integrity API token acquisition
      return 'android_attestation_token_placeholder';
    } else if (Platform.OS === 'ios') {
      // TODO: Implement DeviceCheck/App Attest token acquisition
      return 'ios_attestation_token_placeholder';
    }

    return null;
  }

  async shouldDegradeFeatures(): Promise<boolean> {
    const score = await this.getSecurityScore();
    return score.riskLevel === 'critical' || score.score < 30;
  }

  async getSecurityEducationContent(): Promise<
    Array<{
      title: string;
      content: string;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    const score = await this.getSecurityScore();
    const content = [];

    if (score.riskLevel === 'critical' || score.riskLevel === 'high') {
      content.push({
        title: 'Device Security Alert',
        content:
          'Your device may be compromised. Consider using Drishti on a more secure device for financial data.',
        priority: 'high' as const,
      });
    }

    content.push({
      title: 'Keep Your Device Updated',
      content:
        'Regular security updates protect against known vulnerabilities. Enable automatic updates when possible.',
      priority: 'medium' as const,
    });

    content.push({
      title: 'Use Strong Device Lock',
      content:
        'Enable biometric authentication or a strong PIN/password to protect your device if lost or stolen.',
      priority: 'medium' as const,
    });

    return content;
  }
}

export const deviceIntegrityEnhanced = new DeviceIntegrityEnhanced();
