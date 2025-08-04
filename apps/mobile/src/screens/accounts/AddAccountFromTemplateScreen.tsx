/**
 * Add Account From Template Screen
 * Allows users to create accounts using predefined templates
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import { ScreenTemplate } from '../../components/ui';
import TemplateSelector from '../../components/financial/TemplateSelector';
import BulkAccountCreator from '../../components/financial/BulkAccountCreator';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';
import type { AccountTemplate } from '../../services/financial/AccountTemplateService';

type Props = AccountsStackScreenProps<'AddAccountFromTemplate'>;

const AddAccountFromTemplateScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const formHaptic = useFormHaptic();
  
  const [selectedTemplate, setSelectedTemplate] = useState<AccountTemplate | null>(null);
  const [step, setStep] = useState<'select' | 'create'>('select');

  // Mock user profile - in real app, this would come from user data
  const userProfile = {
    age: user?.metadata?.age,
    hasChildren: user?.metadata?.hasChildren,
    isBusinessOwner: user?.metadata?.isBusinessOwner,
    experienceLevel: user?.metadata?.experienceLevel || 'beginner',
  };

  const handleTemplateSelect = async (template: AccountTemplate) => {
    await formHaptic.selection();
    setSelectedTemplate(template);
    setStep('create');
  };

  const handleAccountsCreated = async (createdAccountIds: string[]) => {
    await formHaptic.success();
    
    Alert.alert(
      'Accounts Created Successfully!',
      `${createdAccountIds.length} account${createdAccountIds.length !== 1 ? 's' : ''} ${createdAccountIds.length !== 1 ? 'have' : 'has'} been created from the ${selectedTemplate?.name} template.`,
      [
        {
          text: 'View Accounts',
          onPress: () => {
            navigation.navigate('AccountsList');
          },
        },
        {
          text: 'Create More',
          style: 'cancel',
          onPress: () => {
            setSelectedTemplate(null);
            setStep('select');
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (step === 'create') {
      Alert.alert(
        'Cancel Account Creation',
        'Are you sure you want to go back? Your progress will be lost.',
        [
          { text: 'Continue Creating', style: 'cancel' },
          { 
            text: 'Go Back', 
            style: 'destructive',
            onPress: () => {
              setSelectedTemplate(null);
              setStep('select');
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const getScreenTitle = () => {
    switch (step) {
      case 'select':
        return 'Choose Template';
      case 'create':
        return selectedTemplate?.name || 'Create Accounts';
      default:
        return 'Add Accounts';
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'select':
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate || undefined}
            onTemplateSelect={handleTemplateSelect}
            userProfile={userProfile}
            testID="template-selector"
          />
        );
      
      case 'create':
        if (!selectedTemplate) {
          // Fallback - shouldn't happen
          setStep('select');
          return null;
        }
        
        return (
          <BulkAccountCreator
            template={selectedTemplate}
            onComplete={handleAccountsCreated}
            onCancel={handleCancel}
            testID="bulk-account-creator"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ScreenTemplate
      title={getScreenTitle()}
      showBackButton
      onBackPress={handleCancel}
      scrollable={false}
      padding="base"
      testID="add-account-from-template-screen"
    >
      <View style={styles.container}>
        {renderContent()}
      </View>
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AddAccountFromTemplateScreen;
