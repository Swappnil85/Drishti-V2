/**
 * Tax Treatment Picker Component
 * Picker for account tax treatment options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Icon, Button, Flex } from '../ui';
import type { TaxTreatment, AccountType } from '@drishti/shared/types/financial';
import { useFormHaptic } from '../../hooks/useHaptic';

interface TaxTreatmentOption {
  value: TaxTreatment;
  label: string;
  description: string;
  icon: string;
  applicableAccountTypes: AccountType[];
}

interface TaxTreatmentPickerProps {
  selectedTreatment?: TaxTreatment;
  onTreatmentSelect: (treatment: TaxTreatment) => void;
  accountType?: AccountType;
  label?: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  testID?: string;
}

const TAX_TREATMENT_OPTIONS: TaxTreatmentOption[] = [
  {
    value: 'taxable',
    label: 'Taxable',
    description: 'Regular taxable account with no tax advantages',
    icon: 'receipt-outline',
    applicableAccountTypes: ['checking', 'savings', 'investment', 'credit', 'loan', 'other'],
  },
  {
    value: 'traditional_ira',
    label: 'Traditional IRA',
    description: 'Tax-deferred retirement account, taxed on withdrawal',
    icon: 'shield-outline',
    applicableAccountTypes: ['retirement', 'investment'],
  },
  {
    value: 'roth_ira',
    label: 'Roth IRA',
    description: 'After-tax retirement account, tax-free withdrawals',
    icon: 'shield-checkmark-outline',
    applicableAccountTypes: ['retirement', 'investment'],
  },
  {
    value: 'traditional_401k',
    label: 'Traditional 401(k)',
    description: 'Employer-sponsored pre-tax retirement account',
    icon: 'business-outline',
    applicableAccountTypes: ['retirement'],
  },
  {
    value: 'roth_401k',
    label: 'Roth 401(k)',
    description: 'Employer-sponsored after-tax retirement account',
    icon: 'business-outline',
    applicableAccountTypes: ['retirement'],
  },
  {
    value: 'hsa',
    label: 'Health Savings Account (HSA)',
    description: 'Triple tax-advantaged health savings account',
    icon: 'medical-outline',
    applicableAccountTypes: ['savings', 'investment'],
  },
  {
    value: 'sep_ira',
    label: 'SEP-IRA',
    description: 'Simplified Employee Pension for self-employed',
    icon: 'person-outline',
    applicableAccountTypes: ['retirement', 'investment'],
  },
  {
    value: 'simple_ira',
    label: 'SIMPLE IRA',
    description: 'Savings Incentive Match Plan for small businesses',
    icon: 'people-outline',
    applicableAccountTypes: ['retirement'],
  },
  {
    value: 'other_tax_advantaged',
    label: 'Other Tax-Advantaged',
    description: 'Other types of tax-advantaged accounts',
    icon: 'star-outline',
    applicableAccountTypes: ['savings', 'investment', 'retirement', 'other'],
  },
];

const TaxTreatmentPicker: React.FC<TaxTreatmentPickerProps> = ({
  selectedTreatment,
  onTreatmentSelect,
  accountType,
  label = 'Tax Treatment',
  placeholder = 'Select tax treatment...',
  error = false,
  errorMessage,
  testID,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();
  const [modalVisible, setModalVisible] = useState(false);

  // Filter options based on account type
  const availableOptions = TAX_TREATMENT_OPTIONS.filter(option =>
    !accountType || option.applicableAccountTypes.includes(accountType)
  );

  const selectedOption = availableOptions.find(option => option.value === selectedTreatment);

  const handleTreatmentSelect = async (treatment: TaxTreatment) => {
    await formHaptic.selection();
    onTreatmentSelect(treatment);
    setModalVisible(false);
  };

  const openModal = async () => {
    await formHaptic.light();
    setModalVisible(true);
  };

  const renderTreatmentOption = ({ item }: { item: TaxTreatmentOption }) => (
    <TouchableOpacity
      style={[styles.optionItem, { borderBottomColor: theme.colors.border.primary }]}
      onPress={() => handleTreatmentSelect(item.value)}
      testID={`tax-treatment-${item.value}`}
    >
      <Flex direction="row" align="center" gap="base">
        <View
          style={[
            styles.optionIcon,
            { backgroundColor: theme.colors.primary[100] },
          ]}
        >
          <Icon
            name={item.icon as any}
            size="sm"
            color="primary.500"
          />
        </View>
        
        <Flex direction="column" flex={1} gap="xs">
          <Text style={[styles.optionLabel, { color: theme.colors.text.primary }]}>
            {item.label}
          </Text>
          <Text style={[styles.optionDescription, { color: theme.colors.text.secondary }]}>
            {item.description}
          </Text>
        </Flex>

        {selectedTreatment === item.value && (
          <Icon
            name="checkmark-circle"
            size="sm"
            color="primary.500"
          />
        )}
      </Flex>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.label, { color: theme.colors.text.primary }]}>
        {label}
      </Text>

      <TouchableOpacity onPress={openModal}>
        <Card
          variant="outlined"
          padding="base"
          style={[
            styles.selector,
            {
              borderColor: error 
                ? theme.colors.error[500] 
                : theme.colors.border.primary,
            },
          ]}
        >
          <Flex direction="row" align="center" justify="space-between">
            <Flex direction="row" align="center" gap="base" flex={1}>
              {selectedOption ? (
                <>
                  <View
                    style={[
                      styles.selectedIcon,
                      { backgroundColor: theme.colors.primary[100] },
                    ]}
                  >
                    <Icon
                      name={selectedOption.icon as any}
                      size="sm"
                      color="primary.500"
                    />
                  </View>
                  <Flex direction="column" flex={1}>
                    <Text style={[styles.selectedLabel, { color: theme.colors.text.primary }]}>
                      {selectedOption.label}
                    </Text>
                    <Text style={[styles.selectedDescription, { color: theme.colors.text.secondary }]}>
                      {selectedOption.description}
                    </Text>
                  </Flex>
                </>
              ) : (
                <Text style={[styles.placeholder, { color: theme.colors.text.tertiary }]}>
                  {placeholder}
                </Text>
              )}
            </Flex>
            
            <Icon
              name="chevron-down-outline"
              size="sm"
              color="text.tertiary"
            />
          </Flex>
        </Card>
      </TouchableOpacity>

      {error && errorMessage && (
        <Text style={[styles.errorText, { color: theme.colors.error[500] }]}>
          {errorMessage}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border.primary }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Select Tax Treatment
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setModalVisible(false)}
              rightIcon={<Icon name="close" size="sm" />}
            >
              Close
            </Button>
          </View>

          <FlatList
            data={availableOptions}
            renderItem={renderTreatmentOption}
            keyExtractor={(item) => item.value}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  selector: {
    minHeight: 56,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholder: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default TaxTreatmentPicker;
