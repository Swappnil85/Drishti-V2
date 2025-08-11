/**
 * PrivacyScreen Component
 * Privacy consent & retention settings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SettingsStackScreenProps } from '../../types/navigation';
import { apiService } from '../../services/api/ApiService';
import {
  PrivacyConsentService,
  Consent,
} from '../../services/privacy/PrivacyConsentService';

type Props = SettingsStackScreenProps<'Privacy'>;

const service = new PrivacyConsentService(apiService);

const PrivacyScreen: React.FC<Props> = () => {
  const [loading, setLoading] = useState(true);
  const [consent, setConsent] = useState<Consent>({
    analytics: true,
    marketing: false,
    personalization: false,
  });
  const [policyUrl, setPolicyUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const policyRes = await service.getPolicy();
        if (policyRes.success)
          setPolicyUrl((policyRes.data as any)?.policy?.url || null);
        const consentRes = await service.getConsent();
        if (consentRes.success)
          setConsent((consentRes.data as any)?.consent || consent);
      } catch (e) {
        // no-op
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateToggle = async (key: keyof Consent, value: boolean) => {
    try {
      const next = { ...consent, [key]: value };
      setConsent(next);
      await service.updateConsent(next);
    } catch {
      Alert.alert('Error', 'Failed to update consent');
    }
  };

  const scheduleDeletion = async () => {
    Alert.alert('Schedule Deletion', 'Delete your data after 30 days?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          try {
            await service.scheduleDeletion(30);
            Alert.alert('Scheduled', 'Your data will be deleted in 30 days.');
          } catch {
            Alert.alert('Error', 'Failed to schedule deletion');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy</Text>
          {policyUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(policyUrl)}>
              <Text style={styles.link}>View Privacy Policy</Text>
            </TouchableOpacity>
          )}

          {termsUrl && (
            <TouchableOpacity
              onPress={() => {
                const anyWin = globalThis as any;
                if (anyWin?.open) anyWin.open(termsUrl, '_blank');
                else Linking.openURL(termsUrl);
              }}
            >
              <Text style={styles.link}>View Terms of Service</Text>
            </TouchableOpacity>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Consent</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Analytics</Text>
              <Switch
                value={!!consent.analytics}
                onValueChange={v => updateToggle('analytics', v)}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Marketing</Text>
              <Switch
                value={!!consent.marketing}
                onValueChange={v => updateToggle('marketing', v)}
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Personalization</Text>
              <Switch
                value={!!consent.personalization}
                onValueChange={v => updateToggle('personalization', v)}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.paragraph}>
              Schedule automatic deletion of your account data.
            </Text>
            <TouchableOpacity style={styles.button} onPress={scheduleDeletion}>
              <Text style={styles.buttonText}>
                Schedule deletion in 30 days
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 16 },
  paragraph: { color: '#666' },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: 'white', fontWeight: '600' },
  link: { color: '#007AFF' },
});

export default PrivacyScreen;
