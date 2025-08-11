/**
 * CSV Import Service
 * Handles parsing and validation of CSV files for bulk account import
 */

import { accountValidationService } from './AccountValidationService';
import type { 
  AccountType, 
  Currency, 
  TaxTreatment 
} from '@drishti/shared/types/financial';

export interface CSVImportRow {
  rowNumber: number;
  data: Record<string, string>;
  parsed: ParsedAccountData | null;
  errors: ImportError[];
  warnings: ImportWarning[];
}

export interface ParsedAccountData {
  name: string;
  accountType: AccountType;
  institution?: string;
  balance: number;
  currency: Currency;
  interestRate?: number;
  taxTreatment?: TaxTreatment;
  routingNumber?: string;
  accountNumber?: string;
  tags: string[];
  color?: string;
  notes?: string;
}

export interface ImportError {
  field: string;
  message: string;
  code: string;
}

export interface ImportWarning {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CSVImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: CSVImportRow[];
  globalErrors: string[];
}

// Expected CSV column mappings
const COLUMN_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'account_name', 'accountname', 'account name'],
  accountType: ['account_type', 'accounttype', 'type', 'account type'],
  institution: ['institution', 'bank', 'financial_institution', 'institution_name'],
  balance: ['balance', 'current_balance', 'amount', 'value'],
  currency: ['currency', 'curr', 'currency_code'],
  interestRate: ['interest_rate', 'interestrate', 'rate', 'apr', 'interest'],
  taxTreatment: ['tax_treatment', 'taxtreatment', 'tax_type', 'tax type'],
  routingNumber: ['routing_number', 'routingnumber', 'routing', 'aba'],
  accountNumber: ['account_number', 'accountnumber', 'account_num', 'acct_num'],
  tags: ['tags', 'categories', 'labels'],
  color: ['color', 'colour', 'account_color'],
  notes: ['notes', 'description', 'memo', 'comments'],
};

// Account type mappings for common variations
const ACCOUNT_TYPE_MAPPINGS: Record<string, AccountType> = {
  'checking': 'checking',
  'check': 'checking',
  'chk': 'checking',
  'current': 'checking',
  'savings': 'savings',
  'save': 'savings',
  'sav': 'savings',
  'investment': 'investment',
  'invest': 'investment',
  'brokerage': 'investment',
  'trading': 'investment',
  'retirement': 'retirement',
  'retire': 'retirement',
  '401k': 'retirement',
  'ira': 'retirement',
  'roth': 'retirement',
  'credit': 'credit',
  'credit_card': 'credit',
  'creditcard': 'credit',
  'cc': 'credit',
  'loan': 'loan',
  'mortgage': 'loan',
  'auto_loan': 'loan',
  'personal_loan': 'loan',
  'other': 'other',
};

class CSVImportService {
  private static instance: CSVImportService;

  private constructor() {}

  static getInstance(): CSVImportService {
    if (!CSVImportService.instance) {
      CSVImportService.instance = new CSVImportService();
    }
    return CSVImportService.instance;
  }

  /**
   * Parse CSV content and validate data
   */
  async parseCSV(csvContent: string): Promise<CSVImportResult> {
    const globalErrors: string[] = [];
    
    try {
      // Split into lines and remove empty lines
      const lines = csvContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length < 2) {
        globalErrors.push('CSV file must contain at least a header row and one data row');
        return {
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          rows: [],
          globalErrors,
        };
      }

      // Parse header row
      const headers = this.parseCSVRow(lines[0]);
      const columnMapping = this.mapColumns(headers);

      if (Object.keys(columnMapping).length === 0) {
        globalErrors.push('No recognizable columns found. Please ensure your CSV has columns like "name", "account_type", "balance", etc.');
        return {
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          rows: [],
          globalErrors,
        };
      }

      // Parse data rows
      const rows: CSVImportRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const rowData = this.parseCSVRow(lines[i]);
        const row = await this.parseRow(i + 1, rowData, columnMapping, headers);
        rows.push(row);
      }

      const validRows = rows.filter(row => row.errors.length === 0).length;
      const invalidRows = rows.length - validRows;

      return {
        success: validRows > 0,
        totalRows: rows.length,
        validRows,
        invalidRows,
        rows,
        globalErrors,
      };
    } catch (error) {
      globalErrors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        rows: [],
        globalErrors,
      };
    }
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  private mapColumns(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      
      for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
        if (variations.includes(header)) {
          mapping[field] = i;
          break;
        }
      }
    }
    
    return mapping;
  }

  private async parseRow(
    rowNumber: number,
    rowData: string[],
    columnMapping: Record<string, number>,
    headers: string[]
  ): Promise<CSVImportRow> {
    const data: Record<string, string> = {};
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Create data object
    for (let i = 0; i < headers.length; i++) {
      data[headers[i]] = rowData[i] || '';
    }

    // Extract mapped fields
    const extractedData: Partial<ParsedAccountData> = {};
    
    for (const [field, columnIndex] of Object.entries(columnMapping)) {
      const value = rowData[columnIndex]?.trim() || '';
      
      switch (field) {
        case 'name':
          extractedData.name = value;
          break;
        case 'accountType':
          extractedData.accountType = this.parseAccountType(value);
          break;
        case 'institution':
          extractedData.institution = value || undefined;
          break;
        case 'balance':
          extractedData.balance = this.parseNumber(value);
          break;
        case 'currency':
          extractedData.currency = this.parseCurrency(value);
          break;
        case 'interestRate':
          extractedData.interestRate = this.parseInterestRate(value);
          break;
        case 'taxTreatment':
          extractedData.taxTreatment = this.parseTaxTreatment(value);
          break;
        case 'routingNumber':
          extractedData.routingNumber = value || undefined;
          break;
        case 'accountNumber':
          extractedData.accountNumber = value || undefined;
          break;
        case 'tags':
          extractedData.tags = this.parseTags(value);
          break;
        case 'color':
          extractedData.color = value || undefined;
          break;
        case 'notes':
          extractedData.notes = value || undefined;
          break;
      }
    }

    // Validate required fields
    if (!extractedData.name) {
      errors.push({
        field: 'name',
        message: 'Account name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!extractedData.accountType) {
      errors.push({
        field: 'accountType',
        message: 'Account type is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (extractedData.balance === undefined || isNaN(extractedData.balance)) {
      errors.push({
        field: 'balance',
        message: 'Valid balance is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Set defaults
    if (!extractedData.currency) {
      extractedData.currency = 'USD';
    }

    if (!extractedData.tags) {
      extractedData.tags = [];
    }

    // Validate using the validation service if we have the required fields
    if (extractedData.name && extractedData.accountType && extractedData.balance !== undefined && !isNaN(extractedData.balance)) {
      const validation = accountValidationService.validateAccount({
        name: extractedData.name,
        accountType: extractedData.accountType,
        balance: extractedData.balance,
        currency: extractedData.currency || 'USD',
        interestRate: extractedData.interestRate,
        taxTreatment: extractedData.taxTreatment,
        institutionName: extractedData.institution,
        routingNumber: extractedData.routingNumber,
        accountNumber: extractedData.accountNumber,
      });

      errors.push(...validation.errors.map(error => ({
        field: error.field,
        message: error.message,
        code: error.code,
      })));

      warnings.push(...validation.warnings.map(warning => ({
        field: warning.field,
        message: warning.message,
        code: warning.code,
        severity: warning.severity,
      })));
    }

    return {
      rowNumber,
      data,
      parsed: errors.length === 0 ? extractedData as ParsedAccountData : null,
      errors,
      warnings,
    };
  }

  private parseAccountType(value: string): AccountType | undefined {
    if (!value) return undefined;
    
    const normalized = value.toLowerCase().trim();
    return ACCOUNT_TYPE_MAPPINGS[normalized];
  }

  private parseNumber(value: string): number {
    if (!value) return 0;
    
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,€£¥]/g, '').trim();
    return parseFloat(cleaned);
  }

  private parseCurrency(value: string): Currency {
    if (!value) return 'USD';
    
    const normalized = value.toUpperCase().trim();
    const validCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
    
    return validCurrencies.includes(normalized as Currency) ? normalized as Currency : 'USD';
  }

  private parseInterestRate(value: string): number | undefined {
    if (!value) return undefined;
    
    // Remove percentage symbol
    const cleaned = value.replace('%', '').trim();
    const rate = parseFloat(cleaned);
    
    if (isNaN(rate)) return undefined;
    
    // Convert percentage to decimal if it looks like a percentage
    return rate > 1 ? rate / 100 : rate;
  }

  private parseTaxTreatment(value: string): TaxTreatment | undefined {
    if (!value) return undefined;
    
    const normalized = value.toLowerCase().replace(/[\s-]/g, '_');
    const validTreatments: TaxTreatment[] = [
      'taxable',
      'traditional_ira',
      'roth_ira',
      'traditional_401k',
      'roth_401k',
      'hsa',
      'sep_ira',
      'simple_ira',
      'other_tax_advantaged',
    ];
    
    return validTreatments.find(treatment => treatment === normalized);
  }

  private parseTags(value: string): string[] {
    if (!value) return [];
    
    // Split by common separators and clean up
    return value
      .split(/[,;|]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Generate a sample CSV template
   */
  generateSampleCSV(): string {
    const headers = [
      'name',
      'account_type',
      'institution',
      'balance',
      'currency',
      'interest_rate',
      'tax_treatment',
      'tags',
      'notes',
    ];

    const sampleRows = [
      [
        'Emergency Fund',
        'savings',
        'Ally Bank',
        '10000',
        'USD',
        '4.0',
        'taxable',
        'Emergency,Safety Net',
        'High-yield savings for emergencies',
      ],
      [
        'Investment Account',
        'investment',
        'Fidelity',
        '50000',
        'USD',
        '7.0',
        'taxable',
        'Investment,Growth',
        'Taxable investment account',
      ],
      [
        'Roth IRA',
        'retirement',
        'Vanguard',
        '25000',
        'USD',
        '7.0',
        'roth_ira',
        'Retirement,Tax-Free',
        'After-tax retirement savings',
      ],
    ];

    const csvLines = [
      headers.join(','),
      ...sampleRows.map(row => 
        row.map(cell => cell.includes(',') ? `"${cell}"` : cell).join(',')
      ),
    ];

    return csvLines.join('\n');
  }
}

export const csvImportService = CSVImportService.getInstance();
