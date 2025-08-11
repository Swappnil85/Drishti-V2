/**
 * Institution Picker Component
 * Searchable picker for financial institutions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Input, Card, Icon, Avatar, Flex } from '../ui';
import { institutionService } from '../../services/financial/InstitutionService';
import FinancialInstitution from '../../database/models/FinancialInstitution';
import type { AccountType, InstitutionType } from '@drishti/shared/types/financial';
import { useFormHaptic } from '../../hooks/useHaptic';

interface InstitutionPickerProps {
  selectedInstitution?: FinancialInstitution;
  onInstitutionSelect: (institution: FinancialInstitution) => void;
  accountType?: AccountType;
  institutionType?: InstitutionType;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  testID?: string;
}

const InstitutionPicker: React.FC<InstitutionPickerProps> = ({
  selectedInstitution,
  onInstitutionSelect,
  accountType,
  institutionType,
  placeholder = 'Search for your bank or institution...',
  error = false,
  errorMessage,
  testID,
}) => {
  const theme = useTheme();
  const formHaptic = useFormHaptic();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchInstitutions(searchTerm);
      } else if (searchTerm.trim().length === 0) {
        setInstitutions([]);
        setShowDropdown(false);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, accountType, institutionType]);

  const searchInstitutions = useCallback(async (search: string) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const result = await institutionService.searchInstitutions({
        search,
        accountType,
        institutionType,
        limit: 20,
      });
      
      setInstitutions(result.institutions);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching institutions:', error);
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }, [accountType, institutionType]);

  const handleInstitutionSelect = async (institution: FinancialInstitution) => {
    await formHaptic.success();
    onInstitutionSelect(institution);
    setSearchTerm(institution.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    if (selectedInstitution && text !== selectedInstitution.name) {
      // Clear selection if user is typing something different
      onInstitutionSelect(null as any);
    }
  };

  const renderInstitutionItem = ({ item }: { item: FinancialInstitution }) => (
    <TouchableOpacity
      style={[styles.institutionItem, { borderBottomColor: theme.colors.border.primary }]}
      onPress={() => handleInstitutionSelect(item)}
      testID={`institution-${item.id}`}
    >
      <Flex direction="row" align="center" gap="base">
        <Avatar
          size="sm"
          source={{ uri: item.logoUrlOrFallback }}
          fallbackIcon="business-outline"
        />
        <Flex direction="column" flex={1}>
          <Text style={[styles.institutionName, { color: theme.colors.text.primary }]}>
            {item.name}
          </Text>
          <Text style={[styles.institutionType, { color: theme.colors.text.secondary }]}>
            {item.displayName}
          </Text>
        </Flex>
        {item.routingNumber && (
          <Text style={[styles.routingNumber, { color: theme.colors.text.tertiary }]}>
            {item.routingNumber}
          </Text>
        )}
      </Flex>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            Searching institutions...
          </Text>
        </View>
      );
    }

    if (hasSearched && institutions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="search-outline" size="lg" color="text.tertiary" />
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            No institutions found for "{searchTerm}"
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>
            Try a different search term or add manually
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container} testID={testID}>
      <Input
        label="Financial Institution"
        placeholder={placeholder}
        value={searchTerm}
        onChangeText={handleSearchChange}
        onFocus={() => {
          if (institutions.length > 0) {
            setShowDropdown(true);
          }
        }}
        error={error}
        errorMessage={errorMessage}
        leftIcon={
          <Icon
            name="business-outline"
            size="sm"
            color="text.tertiary"
          />
        }
        rightIcon={
          loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
          ) : selectedInstitution ? (
            <Icon
              name="checkmark-circle"
              size="sm"
              color="success.500"
            />
          ) : undefined
        }
      />

      {showDropdown && (
        <Card
          variant="elevated"
          style={[styles.dropdown, { backgroundColor: theme.colors.background.primary }]}
        >
          <FlatList
            data={institutions}
            renderItem={renderInstitutionItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyState}
            style={styles.institutionList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            maxHeight={200}
          />
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1001,
  },
  institutionList: {
    maxHeight: 200,
  },
  institutionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  institutionType: {
    fontSize: 14,
    marginTop: 2,
  },
  routingNumber: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default InstitutionPicker;
