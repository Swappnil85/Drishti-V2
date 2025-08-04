/**
 * ImportAccountsScreen Component
 * CSV import wizard for bulk account creation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Share, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { AccountsStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ScreenTemplate,
  Card,
  Button,
  Icon,
  Flex,
  ProgressBar,
} from '../../components/ui';
import {
  csvImportService,
  type CSVImportResult,
} from '../../services/financial/CSVImportService';
import { database } from '../../database';
import { useAuth } from '../../contexts/AuthContext';
import { useFormHaptic } from '../../hooks/useHaptic';

type Props = AccountsStackScreenProps<'ImportAccounts'>;

type ImportStep = 'select' | 'preview' | 'importing' | 'complete';

const ImportAccountsScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const formHaptic = useFormHaptic();

  const [step, setStep] = useState<ImportStep>('select');
  const [importResult, setImportResult] = useState<CSVImportResult | null>(
    null
  );
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [createdAccountIds, setCreatedAccountIds] = useState<string[]>([]);

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await formHaptic.light();

        // Read file content
        const content = await FileSystem.readAsStringAsync(file.uri);

        // Parse CSV
        const parseResult = await csvImportService.parseCSV(content);
        setImportResult(parseResult);

        if (parseResult.success) {
          setStep('preview');
        } else {
          Alert.alert(
            'Import Error',
            parseResult.globalErrors.join('\n') || 'Failed to parse CSV file',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      await formHaptic.error();
      Alert.alert(
        'Error',
        'Failed to read the selected file. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvContent = csvImportService.generateSampleCSV();

      if (Platform.OS === 'ios') {
        // On iOS, use Share API
        await Share.share({
          message: csvContent,
          title: 'Account Import Template',
        });
      } else {
        // On Android, save to downloads
        const fileUri = `${FileSystem.documentDirectory}account_import_template.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);

        Alert.alert('Template Downloaded', `Template saved to: ${fileUri}`, [
          { text: 'OK' },
        ]);
      }

      await formHaptic.success();
    } catch (error) {
      console.error('Error downloading template:', error);
      await formHaptic.error();
      Alert.alert('Error', 'Failed to download template. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleImport = async () => {
    if (!importResult || !user?.id) return;

    setImporting(true);
    setStep('importing');
    setImportProgress(0);

    const validRows = importResult.rows.filter(
      row => row.parsed && row.errors.length === 0
    );
    const createdIds: string[] = [];

    try {
      await database.write(async () => {
        const accountsCollection = database.get('financial_accounts');

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          const accountData = row.parsed!;

          setImportProgress((i + 1) / validRows.length);

          const createdAccount = await accountsCollection.create(
            (account: any) => {
              account.userId = user.id;
              account.name = accountData.name;
              account.accountType = accountData.accountType;
              account.institution = accountData.institution;
              account.balance = accountData.balance;
              account.currency = accountData.currency;
              account.interestRate = accountData.interestRate;
              account.taxTreatment = accountData.taxTreatment;
              account.routingNumber = accountData.routingNumber;
              account.accountNumberEncrypted = accountData.accountNumber;
              account.tags = accountData.tags;
              account.color = accountData.color;
              account.linkedAccountIds = [];
              account.isActive = true;
              account.metadata = {
                notes: accountData.notes,
                createdVia: 'csv_import',
                importedAt: new Date().toISOString(),
              };
            }
          );

          createdIds.push(createdAccount.id);

          // Small delay for better UX
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      });

      setCreatedAccountIds(createdIds);
      setStep('complete');
      await formHaptic.success();
    } catch (error) {
      console.error('Error importing accounts:', error);
      await formHaptic.error();

      Alert.alert(
        'Import Failed',
        'Failed to import accounts. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => setStep('preview'),
          },
        ]
      );
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleStartOver = () => {
    setStep('select');
    setImportResult(null);
    setCreatedAccountIds([]);
  };

  const handleViewAccounts = () => {
    navigation.navigate('AccountsList');
  };

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <Card variant='filled' padding='lg' style={styles.headerCard}>
        <Flex direction='column' align='center' gap='base'>
          <Icon name='cloud-upload-outline' size='xl' color='primary.500' />
          <Text
            style={[styles.headerTitle, { color: theme.colors.text.primary }]}
          >
            Import Accounts from CSV
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.text.secondary },
            ]}
          >
            Quickly add multiple accounts by uploading a CSV file
          </Text>
        </Flex>
      </Card>

      <Card variant='outlined' padding='lg'>
        <Flex direction='column' gap='lg'>
          <Flex direction='column' gap='sm'>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Step 1: Download Template
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: theme.colors.text.secondary },
              ]}
            >
              Start with our CSV template to ensure your data is formatted
              correctly
            </Text>
          </Flex>

          <Button
            variant='outline'
            onPress={handleDownloadTemplate}
            leftIcon={<Icon name='download-outline' size='sm' />}
            testID='download-template-button'
          >
            Download CSV Template
          </Button>
        </Flex>
      </Card>

      <Card variant='outlined' padding='lg'>
        <Flex direction='column' gap='lg'>
          <Flex direction='column' gap='sm'>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Step 2: Upload Your File
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: theme.colors.text.secondary },
              ]}
            >
              Select your completed CSV file to import your accounts
            </Text>
          </Flex>

          <Button
            variant='primary'
            onPress={handleFileSelect}
            leftIcon={<Icon name='document-outline' size='sm' />}
            testID='select-file-button'
          >
            Select CSV File
          </Button>
        </Flex>
      </Card>

      <Card variant='filled' padding='base' style={styles.infoCard}>
        <Flex direction='row' align='flex-start' gap='sm'>
          <Icon name='information-circle' size='sm' color='info.500' />
          <Flex direction='column' gap='xs' flex={1}>
            <Text style={[styles.infoTitle, { color: theme.colors.info[700] }]}>
              Supported Columns
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.info[600] }]}>
              name, account_type, institution, balance, currency, interest_rate,
              tax_treatment, tags, notes
            </Text>
          </Flex>
        </Flex>
      </Card>
    </View>
  );

  const renderPreviewStep = () => {
    if (!importResult) return null;

    const validRows = importResult.rows.filter(row => row.errors.length === 0);
    const invalidRows = importResult.rows.filter(row => row.errors.length > 0);

    return (
      <View style={styles.stepContainer}>
        <Card variant='filled' padding='base' style={styles.summaryCard}>
          <Flex direction='row' justify='space-around'>
            <Flex direction='column' align='center'>
              <Text
                style={[
                  styles.summaryNumber,
                  { color: theme.colors.success[600] },
                ]}
              >
                {validRows.length}
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Valid
              </Text>
            </Flex>
            <Flex direction='column' align='center'>
              <Text
                style={[
                  styles.summaryNumber,
                  { color: theme.colors.error[600] },
                ]}
              >
                {invalidRows.length}
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Invalid
              </Text>
            </Flex>
            <Flex direction='column' align='center'>
              <Text
                style={[
                  styles.summaryNumber,
                  { color: theme.colors.text.primary },
                ]}
              >
                {importResult.totalRows}
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Total
              </Text>
            </Flex>
          </Flex>
        </Card>

        {invalidRows.length > 0 && (
          <Card variant='outlined' padding='base' style={styles.errorCard}>
            <Flex direction='column' gap='sm'>
              <Flex direction='row' align='center' gap='sm'>
                <Icon name='warning' size='sm' color='error.500' />
                <Text
                  style={[
                    styles.errorTitle,
                    { color: theme.colors.error[600] },
                  ]}
                >
                  {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''}{' '}
                  with errors
                </Text>
              </Flex>
              <Text
                style={[
                  styles.errorDescription,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Fix these issues in your CSV file and re-upload, or continue to
                import only valid rows.
              </Text>
            </Flex>
          </Card>
        )}

        <Flex direction='row' gap='base' style={styles.actions}>
          <Button
            variant='outline'
            onPress={handleStartOver}
            style={{ flex: 1 }}
            testID='start-over-button'
          >
            Start Over
          </Button>
          <Button
            variant='primary'
            onPress={handleImport}
            disabled={validRows.length === 0}
            style={{ flex: 1 }}
            testID='import-button'
          >
            Import {validRows.length} Account{validRows.length !== 1 ? 's' : ''}
          </Button>
        </Flex>
      </View>
    );
  };

  const renderImportingStep = () => (
    <View style={styles.stepContainer}>
      <Card variant='filled' padding='lg' style={styles.progressCard}>
        <Flex direction='column' align='center' gap='lg'>
          <Icon name='cloud-upload' size='xl' color='primary.500' />
          <Text
            style={[styles.progressTitle, { color: theme.colors.text.primary }]}
          >
            Importing Accounts...
          </Text>
          <ProgressBar
            progress={importProgress}
            color='primary'
            style={styles.progressBar}
          />
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.text.secondary },
            ]}
          >
            {Math.round(importProgress * 100)}% complete
          </Text>
        </Flex>
      </Card>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <Card variant='filled' padding='lg' style={styles.successCard}>
        <Flex direction='column' align='center' gap='lg'>
          <Icon name='checkmark-circle' size='xl' color='success.500' />
          <Text
            style={[styles.successTitle, { color: theme.colors.text.primary }]}
          >
            Import Complete!
          </Text>
          <Text
            style={[
              styles.successDescription,
              { color: theme.colors.text.secondary },
            ]}
          >
            Successfully imported {createdAccountIds.length} account
            {createdAccountIds.length !== 1 ? 's' : ''}
          </Text>
        </Flex>
      </Card>

      <Flex direction='row' gap='base' style={styles.actions}>
        <Button
          variant='outline'
          onPress={handleStartOver}
          style={{ flex: 1 }}
          testID='import-more-button'
        >
          Import More
        </Button>
        <Button
          variant='primary'
          onPress={handleViewAccounts}
          style={{ flex: 1 }}
          testID='view-accounts-button'
        >
          View Accounts
        </Button>
      </Flex>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return renderSelectStep();
      case 'preview':
        return renderPreviewStep();
      case 'importing':
        return renderImportingStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderSelectStep();
    }
  };

  const getScreenTitle = () => {
    switch (step) {
      case 'select':
        return 'Import Accounts';
      case 'preview':
        return 'Preview Import';
      case 'importing':
        return 'Importing...';
      case 'complete':
        return 'Import Complete';
      default:
        return 'Import Accounts';
    }
  };

  return (
    <ScreenTemplate
      title={getScreenTitle()}
      showBackButton
      onBackPress={() => navigation.goBack()}
      scrollable
      padding='base'
      testID='import-accounts-screen'
    >
      {renderStepContent()}
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  stepContainer: {
    gap: 20,
  },
  headerCard: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorCard: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: '#E8F5E8',
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: '#E8F5E8',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  successDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    marginTop: 16,
  },
});

export default ImportAccountsScreen;
