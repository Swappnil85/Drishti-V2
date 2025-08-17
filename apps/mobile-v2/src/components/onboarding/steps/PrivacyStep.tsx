/**
 * Privacy Step for E5-S1 Onboarding
 * Allows user to choose privacy mode (local-only vs cloud sync)
 */

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { OnboardingStepTemplate } from '../OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useThemeContext } from '../../../theme/ThemeProvider';
import { logEvent } from '../../../telemetry';

export function PrivacyStep() {
  const { nextStep, currentStepData, profile, updateProfile } = useOnboarding();
  const { tokens } = useThemeContext();
  const [selectedMode, setSelectedMode] = useState<boolean>(
    profile.privacyLocalOnly ?? false
  );

  if (!currentStepData) {
    return null;
  }

  const handleModeSelect = (localOnly: boolean) => {
    setSelectedMode(localOnly);
    updateProfile({ privacyLocalOnly: localOnly });
    if (localOnly) {
      logEvent('privacy_local_only_enabled');
    }
  };

  const handleContinue = () => {
    nextStep();
  };

  const privacyOptions = [
    {
      id: 'cloud',
      title: 'Cloud Sync',
      description: 'Sync your data across devices for seamless access anywhere',
      value: false,
      icon: '☁️',
      benefits: [
        'Access from any device',
        'Automatic backups',
        'Seamless experience',
      ],
    },
    {
      id: 'local',
      title: 'Local Only',
      description: 'Keep all your data on this device for maximum privacy',
      value: true,
      icon: '🔒',
      benefits: ['Complete privacy', 'No cloud storage', 'Full control'],
    },
  ];

  return (
    <OnboardingStepTemplate
      title={currentStepData.title}
      subtitle={currentStepData.subtitle}
      description={currentStepData.description}
      primaryButtonText='Continue'
      onPrimaryPress={handleContinue}
    >
      <View style={{ marginVertical: 16 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: tokens.text,
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          How would you like to store your data?
        </Text>

        {privacyOptions.map(option => {
          const isSelected = selectedMode === option.value;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleModeSelect(option.value)}
              accessibilityRole='radio'
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${option.title}: ${option.description}`}
              style={{
                paddingVertical: 20,
                paddingHorizontal: 20,
                marginVertical: 8,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: isSelected ? tokens.primary : tokens.border,
                backgroundColor: isSelected
                  ? `${tokens.primary}10`
                  : tokens.surface,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    marginRight: 12,
                  }}
                >
                  {option.icon}
                </Text>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: tokens.text,
                      marginBottom: 4,
                    }}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: tokens.textMuted,
                      lineHeight: 20,
                    }}
                  >
                    {option.description}
                  </Text>
                </View>

                {isSelected && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: tokens.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel='Selected'
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ marginLeft: 36 }}>
                {option.benefits.map((benefit, index) => (
                  <Text
                    key={index}
                    style={{
                      fontSize: 12,
                      color: tokens.textMuted,
                      marginBottom: 2,
                    }}
                  >
                    • {benefit}
                  </Text>
                ))}
              </View>
            </Pressable>
          );
        })}

        <View
          style={{
            backgroundColor: tokens.surface,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: tokens.textMuted,
              textAlign: 'center',
              lineHeight: 16,
            }}
          >
            You can change this setting later in Privacy Settings
          </Text>
        </View>
      </View>
    </OnboardingStepTemplate>
  );
}
