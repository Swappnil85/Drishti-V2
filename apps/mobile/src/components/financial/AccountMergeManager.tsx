/**
 * AccountMergeManager Component
 * Handles merging duplicate accounts with balance consolidation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Button, Icon, Flex, Badge } from '../ui';
import { database } from '../../database';
import FinancialAccount from '../../database/models/FinancialAccount';
import BalanceHistory from '../../database/models/BalanceHistory';
import { useFormHaptic } from '../../hooks/useHaptic';
import { Q } from '@nozbe/watermelondb';

interface AccountMergeManagerProps {
  sourceAccount: FinancialAccount;
  onMergeComplete?: (targetAccountId: string) => void;
  onCancel?: () => void;
}

interface MergeCandidate {
  account: FinancialAccount;
  similarity: number;
  reasons: string[];
}

const AccountMergeManager: React.FC<AccountMergeManagerProps> = ({
  sourceAccount,
  onMergeComplete,
  onCancel,
}) => {
  const { theme } = useTheme();
  const haptic = useFormHaptic();

  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<FinancialAccount | null>(null);

  useEffect(() => {
    findMergeCandidates();
  }, [sourceAccount]);

  const findMergeCandidates = async () => {
    try {
      setLoading(true);

      // Get all active accounts for the same user, excluding the source account
      const allAccounts = await database
        .get('financial_accounts')
        .query(
          Q.where('user_id', sourceAccount.userId),
          Q.where('is_active', true),
          Q.where('id', Q.notEq(sourceAccount.id))
        )
        .fetch();

      const mergeCandidates: MergeCandidate[] = [];

      for (const account of allAccounts as FinancialAccount[]) {
        const similarity = calculateSimilarity(sourceAccount, account);
        const reasons = getSimilarityReasons(sourceAccount, account);

        if (similarity > 0.3) { // 30% similarity threshold
          mergeCandidates.push({
            account,
            similarity,
            reasons,
          });
        }
      }

      // Sort by similarity score (highest first)
      mergeCandidates.sort((a, b) => b.similarity - a.similarity);

      setCandidates(mergeCandidates);
    } catch (error) {
      console.error('Error finding merge candidates:', error);
      Alert.alert('Error', 'Failed to find merge candidates');
    } finally {
      setLoading(false);
    }
  };

  const calculateSimilarity = (account1: FinancialAccount, account2: FinancialAccount): number => {
    let score = 0;
    let maxScore = 0;

    // Name similarity (40% weight)
    maxScore += 0.4;
    const nameSimilarity = getStringSimilarity(account1.name.toLowerCase(), account2.name.toLowerCase());
    score += nameSimilarity * 0.4;

    // Account type match (30% weight)
    maxScore += 0.3;
    if (account1.accountType === account2.accountType) {
      score += 0.3;
    }

    // Institution match (20% weight)
    maxScore += 0.2;
    if (account1.institution && account2.institution) {
      const institutionSimilarity = getStringSimilarity(
        account1.institution.toLowerCase(),
        account2.institution.toLowerCase()
      );
      score += institutionSimilarity * 0.2;
    }

    // Tax treatment match (10% weight)
    maxScore += 0.1;
    if (account1.taxTreatment === account2.taxTreatment) {
      score += 0.1;
    }

    return score / maxScore;
  };

  const getStringSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const getEditDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  const getSimilarityReasons = (account1: FinancialAccount, account2: FinancialAccount): string[] => {
    const reasons: string[] = [];

    if (account1.accountType === account2.accountType) {
      reasons.push(`Same account type (${account1.accountType})`);
    }

    if (account1.institution && account2.institution) {
      const similarity = getStringSimilarity(
        account1.institution.toLowerCase(),
        account2.institution.toLowerCase()
      );
      if (similarity > 0.8) {
        reasons.push(`Same institution (${account1.institution})`);
      }
    }

    if (account1.taxTreatment === account2.taxTreatment) {
      reasons.push(`Same tax treatment (${account1.taxTreatment})`);
    }

    const nameSimilarity = getStringSimilarity(account1.name.toLowerCase(), account2.name.toLowerCase());
    if (nameSimilarity > 0.6) {
      reasons.push('Similar account names');
    }

    return reasons;
  };

  const handleMergeAccounts = async (targetAccount: FinancialAccount) => {
    Alert.alert(
      'Merge Accounts',
      `Merge "${sourceAccount.name}" into "${targetAccount.name}"?\n\n` +
      `• Source balance: $${sourceAccount.balance.toLocaleString()}\n` +
      `• Target balance: $${targetAccount.balance.toLocaleString()}\n` +
      `• Combined balance: $${(sourceAccount.balance + targetAccount.balance).toLocaleString()}\n\n` +
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          style: 'destructive',
          onPress: () => performMerge(targetAccount),
        },
      ]
    );
  };

  const performMerge = async (targetAccount: FinancialAccount) => {
    try {
      setMerging(true);
      await haptic.light();

      await database.write(async () => {
        // Calculate new balance
        const newBalance = sourceAccount.balance + targetAccount.balance;
        const previousBalance = targetAccount.balance;

        // Update target account with merged balance
        await targetAccount.update((acc: FinancialAccount) => {
          acc.balance = newBalance;
          acc.updatedAt = new Date();

          // Merge metadata
          const sourceMetadata = sourceAccount.metadata;
          const targetMetadata = acc.metadata;
          
          acc.metadataRaw = JSON.stringify({
            ...targetMetadata,
            mergedAccounts: [
              ...(targetMetadata.mergedAccounts || []),
              {
                accountId: sourceAccount.id,
                accountName: sourceAccount.name,
                balance: sourceAccount.balance,
                mergedAt: new Date().toISOString(),
              },
            ],
          });
        });

        // Create balance history entry for the merge
        await database.get('balance_history').create((history: BalanceHistory) => {
          history.accountId = targetAccount.id;
          history.previousBalance = previousBalance;
          history.newBalance = newBalance;
          history.changeAmount = sourceAccount.balance;
          history.changePercentage = previousBalance > 0 ? (sourceAccount.balance / previousBalance) * 100 : 100;
          history.updateMethod = 'merge';
          history.notes = `Merged from account: ${sourceAccount.name}`;
          history.metadataRaw = JSON.stringify({
            sourceAccountId: sourceAccount.id,
            sourceAccountName: sourceAccount.name,
            sourceBalance: sourceAccount.balance,
          });
          history.createdAt = new Date();
          history.updatedAt = new Date();
        });

        // Soft delete the source account
        await sourceAccount.update((acc: FinancialAccount) => {
          acc.isActive = false;
          acc.updatedAt = new Date();

          // Add merge information to metadata
          const metadata = acc.metadata;
          acc.metadataRaw = JSON.stringify({
            ...metadata,
            mergedInto: {
              accountId: targetAccount.id,
              accountName: targetAccount.name,
              mergedAt: new Date().toISOString(),
            },
          });
        });
      });

      await haptic.success();

      Alert.alert(
        'Accounts Merged',
        `"${sourceAccount.name}" has been successfully merged into "${targetAccount.name}".`,
        [
          {
            text: 'OK',
            onPress: () => onMergeComplete?.(targetAccount.id),
          },
        ]
      );
    } catch (error) {
      console.error('Error merging accounts:', error);
      await haptic.error();
      Alert.alert(
        'Error',
        'Failed to merge accounts. Please try again.'
      );
    } finally {
      setMerging(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return theme.colors.success;
    if (similarity >= 0.6) return theme.colors.warning;
    return theme.colors.info;
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.8) return 'High Match';
    if (similarity >= 0.6) return 'Good Match';
    return 'Possible Match';
  };

  if (loading) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Finding merge candidates...
          </Text>
        </Flex>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card variant="outlined" padding="lg">
        <Flex direction="column" align="center" gap="base">
          <Icon name="checkmark-circle-outline" size="lg" color="success" />
          <Text style={[styles.noMatchesTitle, { color: theme.colors.text }]}>
            No Merge Candidates Found
          </Text>
          <Text style={[styles.noMatchesSubtitle, { color: theme.colors.textSecondary }]}>
            No similar accounts were found that could be merged with "{sourceAccount.name}".
          </Text>
          <Button variant="outline" onPress={onCancel}>
            Close
          </Button>
        </Flex>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card variant="outlined" padding="lg" style={styles.headerCard}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Merge Account
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select an account to merge "{sourceAccount.name}" into:
        </Text>
      </Card>

      {candidates.map((candidate, index) => (
        <Card
          key={candidate.account.id}
          variant="outlined"
          padding="lg"
          style={styles.candidateCard}
        >
          <Flex direction="row" justify="space-between" align="flex-start" style={styles.candidateHeader}>
            <View style={styles.candidateInfo}>
              <Text style={[styles.candidateName, { color: theme.colors.text }]}>
                {candidate.account.name}
              </Text>
              <Text style={[styles.candidateDetails, { color: theme.colors.textSecondary }]}>
                {candidate.account.accountType} • {formatCurrency(candidate.account.balance)}
              </Text>
              {candidate.account.institution && (
                <Text style={[styles.candidateInstitution, { color: theme.colors.textSecondary }]}>
                  {candidate.account.institution}
                </Text>
              )}
            </View>

            <Badge
              variant="filled"
              color={getSimilarityColor(candidate.similarity)}
              size="sm"
            >
              {getSimilarityLabel(candidate.similarity)}
            </Badge>
          </Flex>

          <View style={styles.reasonsContainer}>
            <Text style={[styles.reasonsTitle, { color: theme.colors.text }]}>
              Similarity Reasons:
            </Text>
            {candidate.reasons.map((reason, reasonIndex) => (
              <Text
                key={reasonIndex}
                style={[styles.reason, { color: theme.colors.textSecondary }]}
              >
                • {reason}
              </Text>
            ))}
          </View>

          <View style={styles.mergePreview}>
            <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
              Merge Preview:
            </Text>
            <Text style={[styles.previewText, { color: theme.colors.textSecondary }]}>
              Combined Balance: {formatCurrency(sourceAccount.balance + candidate.account.balance)}
            </Text>
          </View>

          <Button
            variant="filled"
            onPress={() => handleMergeAccounts(candidate.account)}
            disabled={merging}
            loading={merging && selectedTarget?.id === candidate.account.id}
            leftIcon={<Icon name="git-merge-outline" size="sm" />}
            style={styles.mergeButton}
          >
            Merge Into This Account
          </Button>
        </Card>
      ))}

      <Card variant="outlined" padding="lg" style={styles.footerCard}>
        <Button variant="outline" onPress={onCancel}>
          Cancel
        </Button>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  candidateCard: {
    marginBottom: 16,
  },
  candidateHeader: {
    marginBottom: 12,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  candidateDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  candidateInstitution: {
    fontSize: 12,
  },
  reasonsContainer: {
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  reason: {
    fontSize: 13,
    marginBottom: 2,
  },
  mergePreview: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
  },
  mergeButton: {
    alignSelf: 'stretch',
  },
  footerCard: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  noMatchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noMatchesSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AccountMergeManager;
