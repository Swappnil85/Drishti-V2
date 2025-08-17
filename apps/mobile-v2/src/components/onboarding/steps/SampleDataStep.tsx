/**
 * Sample Data Step for E5-S1 Onboarding
 * Allows user to load sample data for exploration
 */

import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { OnboardingStepTemplate } from '../OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useThemeContext } from '../../../theme/ThemeProvider';
import { logEvent } from '../../../telemetry';

export function SampleDataStep() {
  const { nextStep, currentStepData, profile, updateProfile } = useOnboarding();
  const { tokens } = useThemeContext();
  const [selectedOption, setSelectedOption] = useState<boolean>(
    profile.hasSampleData ?? false
  );

  if (!currentStepData) {
    return null;
  }

  const handleOptionSelect = (loadSampleData: boolean) => {
    setSelectedOption(loadSampleData);
    updateProfile({ hasSampleData: loadSampleData });
    if (loadSampleData) {
      logEvent('sample_data_load');
    }
  };

  const handleContinue = () => {
    nextStep();
  };

  const sampleDataOptions = [
    {
      id: 'load',
      title: 'Load Sample Data',
      description: 'Explore the app with pre-filled accounts and transactions',
      value: true,
      icon: '📊',
      benefits: [
        'See how the app works',
        'Explore all features',
        'Example financial scenarios',
        'Easy to remove later',
      ],
    },
    {
      id: 'skip',
      title: 'Start Fresh',
      description: 'Begin with a clean slate and add your own data',
      value: false,
      icon: '✨',
      benefits: [
        'Clean starting point',
        'Add your real accounts',
        'Personalized experience',
        'No demo data to clean up',
      ],
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
          Would you like to explore with sample data?
        </Text>

        {sampleDataOptions.map(option => {
          const isSelected = selectedOption === option.value;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleOptionSelect(option.value)}
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
                      marginBottom: 8,
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
            Sample data can be removed anytime from Settings
          </Text>
        </View>
      </View>
    </OnboardingStepTemplate>
  );
}
