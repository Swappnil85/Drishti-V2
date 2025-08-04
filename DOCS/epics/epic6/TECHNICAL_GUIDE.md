# Epic 6: Financial Account Management - Technical Implementation Guide

## Overview

**Epic**: 6 - Account Management  
**Technology Stack**: React Native, TypeScript, WatermelonDB, Expo  
**Architecture**: Offline-first with service layer pattern  
**Lines of Code**: 10,000+ production-ready TypeScript  
**Components**: 15 comprehensive components  
**Services**: 6 comprehensive service implementations  
**Screens**: 8 screens created/enhanced

---

## 🏗️ Technical Architecture

### Service Layer Architecture

```typescript
// Core service interfaces
interface AccountService {
  createAccount(data: AccountCreationData): Promise<Account>
  updateAccount(id: string, data: Partial<Account>): Promise<Account>
  deleteAccount(id: string, soft?: boolean): Promise<void>
  getAccounts(filters?: AccountFilters): Promise<Account[]>
}

interface BalanceService {
  updateBalance(accountId: string, newBalance: number, method: UpdateMethod): Promise<BalanceHistory>
  getBalanceHistory(accountId: string, limit?: number): Promise<BalanceHistory[]>
  bulkUpdateBalances(updates: BalanceUpdate[]): Promise<BalanceHistory[]>
}

interface TaxTreatmentService {
  getTaxTreatmentInfo(treatment: TaxTreatment): TaxTreatmentInfo
  calculateContributionLimits(treatment: TaxTreatment, age: number, income?: number): ContributionLimits
  calculateTaxImpact(withdrawalAmount: number, currentAge: number, accountBalance: number, treatment: TaxTreatment): TaxImpactCalculation
}
```

### Database Schema Evolution

**Schema Version**: v1 → v4 (3 incremental migrations)

#### Enhanced financial_accounts Table
```sql
CREATE TABLE financial_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  interest_rate REAL,
  
  -- Epic 6.1 Enhancements
  institution_id TEXT,
  routing_number TEXT,
  account_number_encrypted TEXT,
  tax_treatment TEXT,
  tags TEXT DEFAULT '[]',
  color TEXT,
  linked_account_ids TEXT DEFAULT '[]',
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  archived_at INTEGER
);
```

#### New balance_history Table
```sql
CREATE TABLE balance_history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  previous_balance REAL NOT NULL,
  new_balance REAL NOT NULL,
  change_amount REAL NOT NULL,
  change_percentage REAL NOT NULL,
  update_method TEXT NOT NULL,
  notes TEXT,
  metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES financial_accounts(id)
);
```

---

## 📱 Story 6.1: Multi-Account Creation System

### Core Components

#### AddAccountScreen.tsx (738 lines)
**Multi-step wizard with comprehensive validation**

```typescript
interface AddAccountScreenState {
  currentStep: number
  formData: AccountFormData
  errors: FormErrors
  isSubmitting: boolean
  showInstitutionPicker: boolean
}

// Step progression with validation
const steps = [
  { title: 'Basic Information', component: BasicInfoStep },
  { title: 'Institution Details', component: InstitutionStep },
  { title: 'Customization', component: CustomizationStep }
]
```

**Key Features**:
- Progressive form validation with contextual error messages
- Haptic feedback for enhanced user experience
- Smart defaults based on account type and institution
- Comprehensive field validation including routing number checksums
- Support for account linking and relationship management

#### InstitutionPicker.tsx (267 lines)
**Searchable institution database with 10,000+ institutions**

```typescript
interface InstitutionPickerProps {
  onSelect: (institution: Institution) => void
  selectedInstitution?: Institution
  accountType?: AccountType
}

// Debounced search with efficient filtering
const useInstitutionSearch = (query: string) => {
  const [results, setResults] = useState<Institution[]>([])
  const [loading, setLoading] = useState(false)
  
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) return
      setLoading(true)
      const institutions = await InstitutionService.search(searchQuery)
      setResults(institutions)
      setLoading(false)
    }, 300),
    []
  )
}
```

#### AccountValidationService.ts (554 lines)
**Comprehensive validation with smart warnings**

```typescript
class AccountValidationService {
  static validateAccountData(data: AccountFormData): ValidationResult {
    const errors: FormErrors = {}
    const warnings: FormWarnings = {}
    
    // Name validation
    if (!data.name?.trim()) {
      errors.name = 'Account name is required'
    } else if (data.name.length > 50) {
      errors.name = 'Account name must be 50 characters or less'
    }
    
    // Routing number validation with checksum
    if (data.routingNumber) {
      if (!this.validateRoutingNumber(data.routingNumber)) {
        errors.routingNumber = 'Invalid routing number'
      }
    }
    
    // Smart warnings for unusual values
    if (data.balance && data.balance > 1000000) {
      warnings.balance = 'Large balance detected. Please verify amount.'
    }
    
    return { errors, warnings, isValid: Object.keys(errors).length === 0 }
  }
  
  private static validateRoutingNumber(routingNumber: string): boolean {
    // ABA routing number checksum validation
    const digits = routingNumber.replace(/\D/g, '')
    if (digits.length !== 9) return false
    
    const checksum = digits.split('').reduce((sum, digit, index) => {
      const weight = [3, 7, 1, 3, 7, 1, 3, 7, 1][index]
      return sum + (parseInt(digit) * weight)
    }, 0)
    
    return checksum % 10 === 0
  }
}
```

#### CSVImportService.ts + ImportAccountsScreen.tsx (627 lines)
**Intelligent CSV parsing with flexible column mapping**

```typescript
class CSVImportService {
  static async parseCSV(csvContent: string): Promise<ParseResult> {
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = this.parseHeaders(lines[0])
    const mapping = this.detectColumnMapping(headers)
    
    const accounts: AccountImportData[] = []
    const errors: ImportError[] = []
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const account = this.parseAccountRow(lines[i], mapping)
        const validation = AccountValidationService.validateAccountData(account)
        
        if (validation.isValid) {
          accounts.push(account)
        } else {
          errors.push({ row: i + 1, errors: validation.errors })
        }
      } catch (error) {
        errors.push({ row: i + 1, errors: { general: error.message } })
      }
    }
    
    return { accounts, errors, mapping }
  }
  
  private static detectColumnMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {}
    
    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim()
      
      if (['name', 'account name', 'account_name'].includes(normalized)) {
        mapping.name = index
      } else if (['type', 'account type', 'account_type'].includes(normalized)) {
        mapping.accountType = index
      } else if (['balance', 'amount', 'current balance'].includes(normalized)) {
        mapping.balance = index
      }
      // ... additional mapping logic
    })
    
    return mapping
  }
}
```

---

## 💰 Story 6.2: Balance Management System

### Core Components

#### QuickBalanceUpdate.tsx (300+ lines)
**Mobile-optimized balance update interface**

```typescript
interface QuickBalanceUpdateProps {
  account: Account
  onUpdate: (newBalance: number, notes?: string) => Promise<void>
  onCancel: () => void
}

const QuickBalanceUpdate: React.FC<QuickBalanceUpdateProps> = ({ account, onUpdate, onCancel }) => {
  const [balance, setBalance] = useState(account.balance.toString())
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    const newBalance = parseFloat(balance)
    const changeAmount = newBalance - account.balance
    const changePercentage = (changeAmount / account.balance) * 100
    
    // Verification prompt for significant changes
    if (Math.abs(changePercentage) > 20 || Math.abs(changeAmount) > 10000) {
      const confirmed = await showConfirmationDialog({
        title: 'Significant Change Detected',
        message: `This will change the balance by ${formatCurrency(changeAmount)} (${changePercentage.toFixed(1)}%). Are you sure?`,
        confirmText: 'Update Balance',
        cancelText: 'Review'
      })
      
      if (!confirmed) return
    }
    
    setIsSubmitting(true)
    try {
      await onUpdate(newBalance, notes)
      // Haptic feedback for success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      // Error handling with haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      showErrorAlert('Failed to update balance', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Balance</Text>
      <Text style={styles.accountName}>{account.name}</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.currentBalance}>
          Current: {formatCurrency(account.balance)}
        </Text>
        
        <TextInput
          style={styles.balanceInput}
          value={balance}
          onChangeText={setBalance}
          keyboardType="numeric"
          placeholder="Enter new balance"
          autoFocus
        />
        
        {parseFloat(balance) !== account.balance && (
          <Text style={[styles.changeIndicator, {
            color: parseFloat(balance) > account.balance ? '#4CAF50' : '#F44336'
          }]}>
            {parseFloat(balance) > account.balance ? '+' : ''}
            {formatCurrency(parseFloat(balance) - account.balance)}
          </Text>
        )}
      </View>
      
      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        multiline
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.updateButton, isSubmitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.updateButtonText}>
            {isSubmitting ? 'Updating...' : 'Update Balance'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
```

#### BulkBalanceUpdate.tsx (300+ lines)
**Multi-account balance update with progress tracking**

```typescript
interface BulkBalanceUpdateProps {
  accounts: Account[]
  onUpdate: (updates: BalanceUpdate[]) => Promise<void>
  onCancel: () => void
}

interface BalanceUpdate {
  accountId: string
  newBalance: number
  notes?: string
}

const BulkBalanceUpdate: React.FC<BulkBalanceUpdateProps> = ({ accounts, onUpdate, onCancel }) => {
  const [updates, setUpdates] = useState<Record<string, BalanceUpdate>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const handleAccountUpdate = (accountId: string, newBalance: number, notes?: string) => {
    setUpdates(prev => ({
      ...prev,
      [accountId]: { accountId, newBalance, notes }
    }))
  }
  
  const handleSubmit = async () => {
    const updateList = Object.values(updates).filter(update => 
      update.newBalance !== accounts.find(a => a.id === update.accountId)?.balance
    )
    
    if (updateList.length === 0) {
      showErrorAlert('No Changes', 'No balance changes detected.')
      return
    }
    
    setIsSubmitting(true)
    setProgress(0)
    
    try {
      // Process updates with progress tracking
      for (let i = 0; i < updateList.length; i++) {
        await BalanceService.updateBalance(
          updateList[i].accountId,
          updateList[i].newBalance,
          'manual_bulk',
          updateList[i].notes
        )
        setProgress((i + 1) / updateList.length)
      }
      
      await onUpdate(updateList)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      showErrorAlert('Update Failed', error.message)
    } finally {
      setIsSubmitting(false)
      setProgress(0)
    }
  }
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Bulk Balance Update</Text>
      <Text style={styles.subtitle}>
        Update balances for multiple accounts simultaneously
      </Text>
      
      {accounts.map(account => (
        <BulkBalanceUpdateItem
          key={account.id}
          account={account}
          onUpdate={(newBalance, notes) => handleAccountUpdate(account.id, newBalance, notes)}
        />
      ))}
      
      {isSubmitting && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Updating balances... {Math.round(progress * 100)}%
          </Text>
          <ProgressBar progress={progress} />
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.updateButton, isSubmitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.updateButtonText}>
            {isSubmitting ? 'Updating...' : `Update ${Object.keys(updates).length} Accounts`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
```

---

## 🏛️ Story 6.3: Tax Treatment System

### Core Components

#### TaxTreatmentService.ts
**Comprehensive tax treatment management**

```typescript
class TaxTreatmentService {
  private static readonly TAX_TREATMENTS: Record<TaxTreatment, TaxTreatmentInfo> = {
    'traditional_401k': {
      name: 'Traditional 401(k)',
      description: 'Pre-tax contributions, taxed on withdrawal',
      contributionLimits: { annual: 23000, catchUp: 7500, catchUpAge: 50 },
      taxBenefits: ['Pre-tax contributions reduce current taxable income'],
      withdrawalRules: ['10% penalty before age 59½', 'Required distributions at 73'],
      assetAllocationSuggestions: ['Growth investments', 'High-yield bonds']
    },
    'roth_401k': {
      name: 'Roth 401(k)',
      description: 'After-tax contributions, tax-free growth and withdrawals',
      contributionLimits: { annual: 23000, catchUp: 7500, catchUpAge: 50 },
      taxBenefits: ['Tax-free growth and qualified withdrawals'],
      withdrawalRules: ['Contributions available anytime', '5-year rule for earnings'],
      assetAllocationSuggestions: ['Growth stocks', 'International funds']
    },
    // ... additional tax treatments
  }
  
  static getTaxTreatmentInfo(treatment: TaxTreatment): TaxTreatmentInfo {
    return this.TAX_TREATMENTS[treatment]
  }
  
  static calculateContributionLimits(
    treatment: TaxTreatment, 
    age: number, 
    income?: number
  ): ContributionLimits {
    const info = this.getTaxTreatmentInfo(treatment)
    let limits = { ...info.contributionLimits }
    
    // Age-based catch-up contributions
    if (age >= info.contributionLimits.catchUpAge) {
      limits.annual += info.contributionLimits.catchUp
    }
    
    // Income-based phase-outs (Roth IRA)
    if (treatment === 'roth_ira' && income) {
      limits = this.applyIncomePhaseOut(limits, income)
    }
    
    return limits
  }
  
  static calculateTaxImpact(
    withdrawalAmount: number,
    currentAge: number,
    accountBalance: number,
    treatment: TaxTreatment,
    taxBracket: number = 0.22
  ): TaxImpactCalculation {
    const info = this.getTaxTreatmentInfo(treatment)
    let taxes = 0
    let penalties = 0
    
    // Early withdrawal penalties
    if (currentAge < 59.5 && ['traditional_401k', 'traditional_ira'].includes(treatment)) {
      penalties = withdrawalAmount * 0.10
    }
    
    // Tax calculations based on treatment type
    switch (treatment) {
      case 'traditional_401k':
      case 'traditional_ira':
        taxes = withdrawalAmount * taxBracket
        break
      case 'roth_401k':
      case 'roth_ira':
        // Tax-free for qualified withdrawals
        taxes = 0
        break
      case 'taxable':
        // Capital gains tax (simplified)
        taxes = withdrawalAmount * 0.15
        break
    }
    
    const netAmount = withdrawalAmount - taxes - penalties
    
    return {
      withdrawalAmount,
      taxes,
      penalties,
      netAmount,
      effectiveRate: (taxes + penalties) / withdrawalAmount,
      recommendations: this.getWithdrawalRecommendations(treatment, currentAge)
    }
  }
}
```

---

## ✏️ Story 6.4: Account Management System

### Core Components

#### EditAccountScreen.tsx
**Comprehensive account editing with validation**

```typescript
interface EditAccountScreenProps {
  route: RouteProp<AccountStackParamList, 'EditAccount'>
  navigation: StackNavigationProp<AccountStackParamList, 'EditAccount'>
}

const EditAccountScreen: React.FC<EditAccountScreenProps> = ({ route, navigation }) => {
  const { accountId } = route.params
  const [account, setAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Change detection
  useEffect(() => {
    if (account && formData) {
      const changes = detectChanges(account, formData)
      setHasChanges(changes.length > 0)
    }
  }, [account, formData])
  
  // Unsaved changes warning
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return
      
      e.preventDefault()
      
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) }
        ]
      )
    })
    
    return unsubscribe
  }, [navigation, hasChanges])
  
  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const validation = AccountValidationService.validateAccountData(formData)
      if (!validation.isValid) {
        showValidationErrors(validation.errors)
        return
      }
      
      await AccountService.updateAccount(accountId, formData)
      setHasChanges(false)
      navigation.goBack()
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      showErrorAlert('Update Failed', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account?.name}"? This action can be undone within 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await AccountService.deleteAccount(accountId, true) // Soft delete
              navigation.navigate('AccountsList')
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            } catch (error) {
              showErrorAlert('Delete Failed', error.message)
            }
          }
        }
      ]
    )
  }
  
  return (
    <ScrollView style={styles.container}>
      <Section title="Basic Information">
        <FormField
          label="Account Name"
          value={formData.name}
          onChangeText={(name) => setFormData(prev => ({ ...prev, name }))}
          error={errors.name}
        />
        
        <AccountTypePicker
          selectedType={formData.accountType}
          onSelect={(accountType) => setFormData(prev => ({ ...prev, accountType }))}
        />
        
        <FormField
          label="Balance"
          value={formData.balance}
          onChangeText={(balance) => setFormData(prev => ({ ...prev, balance }))}
          keyboardType="numeric"
          error={errors.balance}
        />
      </Section>
      
      <Section title="Institution">
        <InstitutionPicker
          selectedInstitution={formData.institution}
          onSelect={(institution) => setFormData(prev => ({ ...prev, institution }))}
        />
      </Section>
      
      <Section title="Tax Treatment">
        <TaxTreatmentPicker
          selectedTreatment={formData.taxTreatment}
          accountType={formData.accountType}
          onSelect={(taxTreatment) => setFormData(prev => ({ ...prev, taxTreatment }))}
        />
      </Section>
      
      <Section title="Customization">
        <TagManager
          tags={formData.tags}
          onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
        />
        
        <ColorPicker
          selectedColor={formData.color}
          onColorSelect={(color) => setFormData(prev => ({ ...prev, color }))}
        />
      </Section>
      
      <Section title="Actions">
        <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
          <Text style={styles.archiveButtonText}>Archive Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </Section>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, (!hasChanges || isSubmitting) && styles.disabledButton]} 
          onPress={handleSave}
          disabled={!hasChanges || isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
```

---

## 📊 Performance Optimizations

### Database Optimizations

```sql
-- Performance indexes for Epic 6
CREATE INDEX IF NOT EXISTS idx_financial_accounts_institution_id ON financial_accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_tax_treatment ON financial_accounts(tax_treatment);
CREATE INDEX IF NOT EXISTS idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_update_method ON balance_history(update_method);
CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON balance_history(created_at);
```

### React Native Optimizations

```typescript
// Memoized components for performance
const AccountListItem = React.memo<AccountListItemProps>(({ account, onPress }) => {
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress(account)}>
      <Text style={styles.name}>{account.name}</Text>
      <Text style={styles.balance}>{formatCurrency(account.balance)}</Text>
    </TouchableOpacity>
  )
})

// Debounced search for institution picker
const useInstitutionSearch = (query: string) => {
  const [results, setResults] = useState<Institution[]>([])
  
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) return
      const institutions = await InstitutionService.search(searchQuery)
      setResults(institutions)
    }, 300),
    []
  )
  
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])
  
  return results
}

// Virtualized lists for large datasets
const AccountsList = () => {
  const renderItem = useCallback(({ item }: { item: Account }) => (
    <AccountListItem account={item} onPress={handleAccountPress} />
  ), [])
  
  return (
    <FlatList
      data={accounts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  )
}
```

---

## 🔒 Security Implementation

### Data Encryption

```typescript
class EncryptionService {
  static async encryptAccountNumber(accountNumber: string): Promise<string> {
    const key = await SecureStore.getItemAsync('encryption_key')
    if (!key) throw new Error('Encryption key not found')
    
    const encrypted = CryptoJS.AES.encrypt(accountNumber, key).toString()
    return encrypted
  }
  
  static async decryptAccountNumber(encryptedAccountNumber: string): Promise<string> {
    const key = await SecureStore.getItemAsync('encryption_key')
    if (!key) throw new Error('Encryption key not found')
    
    const decrypted = CryptoJS.AES.decrypt(encryptedAccountNumber, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  }
}
```

### Input Validation

```typescript
class SecurityService {
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }
  
  static validateCSVContent(content: string): boolean {
    // Prevent CSV injection attacks
    const dangerousPatterns = [/^[=@+\-]/, /javascript:/i, /data:/i]
    const lines = content.split('\n')
    
    return !lines.some(line => 
      dangerousPatterns.some(pattern => pattern.test(line))
    )
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// AccountValidationService.test.ts
describe('AccountValidationService', () => {
  describe('validateAccountData', () => {
    it('should validate required fields', () => {
      const data = { name: '', accountType: 'checking', balance: '1000' }
      const result = AccountValidationService.validateAccountData(data)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Account name is required')
    })
    
    it('should validate routing number checksum', () => {
      const data = { 
        name: 'Test Account', 
        accountType: 'checking', 
        balance: '1000',
        routingNumber: '123456789' // Invalid checksum
      }
      const result = AccountValidationService.validateAccountData(data)
      
      expect(result.errors.routingNumber).toBe('Invalid routing number')
    })
  })
})

// TaxTreatmentService.test.ts
describe('TaxTreatmentService', () => {
  describe('calculateContributionLimits', () => {
    it('should apply catch-up contributions for age 50+', () => {
      const limits = TaxTreatmentService.calculateContributionLimits('traditional_401k', 55)
      
      expect(limits.annual).toBe(30500) // 23000 + 7500 catch-up
    })
    
    it('should apply income phase-out for Roth IRA', () => {
      const limits = TaxTreatmentService.calculateContributionLimits('roth_ira', 35, 140000)
      
      expect(limits.annual).toBeLessThan(7000) // Reduced due to income
    })
  })
})
```

### Integration Tests

```typescript
// AccountCreation.integration.test.ts
describe('Account Creation Flow', () => {
  it('should create account with all features', async () => {
    const accountData = {
      name: 'Test Savings',
      accountType: 'savings',
      balance: 5000,
      institutionId: 'chase',
      taxTreatment: 'taxable',
      tags: ['emergency-fund'],
      color: '#4CAF50'
    }
    
    const account = await AccountService.createAccount(accountData)
    
    expect(account.id).toBeDefined()
    expect(account.name).toBe('Test Savings')
    expect(account.tags).toEqual(['emergency-fund'])
    
    // Verify database record
    const dbAccount = await database.get('financial_accounts').find(account.id)
    expect(dbAccount.tax_treatment).toBe('taxable')
  })
})
```

---

## 📈 Monitoring and Analytics

### Performance Metrics

```typescript
class PerformanceMonitor {
  static trackAccountCreation(duration: number, method: 'manual' | 'csv' | 'template') {
    Analytics.track('account_creation_completed', {
      duration_ms: duration,
      method,
      timestamp: Date.now()
    })
  }
  
  static trackBalanceUpdate(accountCount: number, method: 'quick' | 'bulk') {
    Analytics.track('balance_update_completed', {
      account_count: accountCount,
      method,
      timestamp: Date.now()
    })
  }
  
  static trackSearchPerformance(query: string, resultCount: number, duration: number) {
    Analytics.track('institution_search_performed', {
      query_length: query.length,
      result_count: resultCount,
      duration_ms: duration
    })
  }
}
```

### Error Tracking

```typescript
class ErrorTracker {
  static trackValidationError(field: string, error: string, context: any) {
    Sentry.captureMessage('Validation Error', {
      level: 'warning',
      tags: { field, error },
      extra: context
    })
  }
  
  static trackImportError(row: number, error: string, csvContent: string) {
    Sentry.captureMessage('CSV Import Error', {
      level: 'error',
      tags: { row, error },
      extra: { csv_preview: csvContent.substring(0, 500) }
    })
  }
}
```

---

## 🚀 Future Enhancements

### Planned Improvements

1. **Real-time Account Aggregation** (Epic 12)
   - Bank API integration
   - Automatic balance updates
   - Transaction categorization

2. **Advanced Analytics** (Epic 8)
   - Spending analysis
   - Investment performance tracking
   - Goal progress monitoring

3. **AI-Powered Insights** (Future)
   - Smart categorization suggestions
   - Anomaly detection
   - Personalized recommendations

### Technical Debt

1. **Database Optimization**
   - Consider migration to SQLite WAL mode
   - Implement connection pooling
   - Add query performance monitoring

2. **Code Organization**
   - Extract common validation logic
   - Implement proper error boundaries
   - Add comprehensive TypeScript types

3. **Testing Coverage**
   - Increase unit test coverage to 95%
   - Add end-to-end testing
   - Implement visual regression testing