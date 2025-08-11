/**
 * First Account Step
 * Guide user to add their first financial account
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Flex, Card, Icon } from '../../../components/ui';
import OnboardingStepTemplate from '../components/OnboardingStepTemplate';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useHaptic } from '../../../hooks/useHaptic';

const FirstAccountStep: React.FC = () => {
  const { completeStep, currentStep } = useOnboarding();
  const { buttonTap, successFeedback } = useHaptic();
  const [selectedAccountType, setSelectedAccountType] = useState<string>('');

  const accountTypes = [
    {
      id: 'checking',
      name: 'Checking Account',
      description: 'Your primary spending account',
      icon: 'card',
      color: 'primary.500',
    },
    {
      id: 'savings',
      name: 'Savings Account',
      description: 'Emergency fund and short-term savings',
      icon: 'wallet',
      color: 'success.500',
    },
    {
      id: 'investment',
      name: 'Investment Account',
      description: '401k, IRA, or brokerage account',
      icon: 'trending-up',
      color: 'warning.500',
    },
  ];

  const handleAccountTypeSelect = async (accountId: string) => {
    await buttonTap();
    setSelectedAccountType(accountId);
  };

  const handleContinue = async () => {
    await successFeedback();
    
    if (currentStep) {
      await completeStep(currentStep.id, {
        firstAccountType: selectedAccountType,
        hasExistingAccounts: true,
      });
    }
  };

  const handleSkip = async () => {
    if (currentStep) {
      await completeStep(currentStep.id, {
        hasExistingAccounts: false,
      });
    }
  };

  return (
    <OnboardingStepTemplate
      primaryButtonText="Add Account"
      primaryButtonDisabled={!selectedAccountType}
      showSkipButton={true}
      onPrimaryPress={handleContinue}
    >
      <View style={styles.content}>
        <Text variant="body1" color="text.secondary" align="center" style={styles.description}>
          Choose the type of account you'd like to add first. You can add more accounts later.
        </Text>

        <Flex direction="column" gap="md" style={styles.accountTypes}>
          {accountTypes.map((account) => (
            <Card
              key={account.id}
              variant={selectedAccountType === account.id ? 'elevated' : 'outlined'}
              padding="lg"
              style={[
                styles.accountCard,
                selectedAccountType === account.id && styles.selectedCard,
              ]}
              onPress={() => handleAccountTypeSelect(account.id)}
            >
              <Flex direction="row" align="center">
                <View style={styles.accountIcon}>
                  <Icon name={account.icon as any} size="lg" color={account.color} />
                </View>
                
                <View style={styles.accountInfo}>
                  <Text variant="body1" weight="medium">
                    {account.name}
                  </Text>
                  <Text variant="body2" color="text.secondary">
                    {account.description}
                  </Text>
                </View>
                
                {selectedAccountType === account.id && (
                  <Icon name="checkmark-circle" size="md" color="primary.500" />
                )}
              </Flex>
            </Card>
          ))}
        </Flex>

        <Card variant="filled" padding="lg" style={styles.infoCard}>
          <Flex direction="row" align="flex-start">
            <Icon name="shield-checkmark" size="md" color="success.500" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text variant="body2" weight="medium" color="success.600">
                Your data is secure
              </Text>
              <Text variant="caption" color="text.secondary" style={styles.infoText}>
                We use bank-level encryption and never store your login credentials. 
                Your financial data stays private and secure.
              </Text>
            </View>
          </Flex>
        </Card>
      </View>
    </OnboardingStepTemplate>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 20,
  },
  description: {
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  accountTypes: {
    marginBottom: 32,
  },
  accountCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#1976d2',
    backgroundColor: '#F3F8FF',
  },
  accountIcon: {
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#F0F9F0',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    marginTop: 4,
    lineHeight: 18,
  },
});

export default FirstAccountStep;
