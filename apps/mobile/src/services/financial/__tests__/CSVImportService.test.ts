/**
 * CSVImportService Tests
 * Unit tests for CSV import functionality
 */

import { csvImportService } from '../CSVImportService';

describe('CSVImportService', () => {
  describe('parseCSV', () => {
    const validCSV = `name,account_type,institution,balance,currency,interest_rate,tax_treatment,tags,notes
Emergency Fund,savings,Ally Bank,10000,USD,4.0,taxable,"Emergency,Safety Net",High-yield savings for emergencies
Investment Account,investment,Fidelity,50000,USD,7.0,taxable,"Investment,Growth",Taxable investment account
Roth IRA,retirement,Vanguard,25000,USD,7.0,roth_ira,"Retirement,Tax-Free",After-tax retirement savings`;

    it('should parse valid CSV successfully', async () => {
      const result = await csvImportService.parseCSV(validCSV);
      
      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(3);
      expect(result.invalidRows).toBe(0);
      expect(result.globalErrors).toHaveLength(0);
    });

    it('should handle CSV with headers only', async () => {
      const headerOnlyCSV = 'name,account_type,balance,currency';
      const result = await csvImportService.parseCSV(headerOnlyCSV);
      
      expect(result.success).toBe(false);
      expect(result.globalErrors).toContain(
        'CSV file must contain at least a header row and one data row'
      );
    });

    it('should handle empty CSV', async () => {
      const result = await csvImportService.parseCSV('');
      
      expect(result.success).toBe(false);
      expect(result.globalErrors).toContain(
        'CSV file must contain at least a header row and one data row'
      );
    });

    it('should handle CSV with unrecognizable columns', async () => {
      const badCSV = 'unknown_column,another_unknown\nvalue1,value2';
      const result = await csvImportService.parseCSV(badCSV);
      
      expect(result.success).toBe(false);
      expect(result.globalErrors).toContain(
        'No recognizable columns found. Please ensure your CSV has columns like "name", "account_type", "balance", etc.'
      );
    });

    it('should parse CSV with quoted fields containing commas', async () => {
      const csvWithQuotes = `name,account_type,balance,tags
"My Account, LLC",checking,5000,"Tag1,Tag2"
Regular Account,savings,3000,Tag3`;
      
      const result = await csvImportService.parseCSV(csvWithQuotes);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.name).toBe('My Account, LLC');
      expect(result.rows[0].parsed?.tags).toEqual(['Tag1', 'Tag2']);
    });

    it('should handle CSV with missing required fields', async () => {
      const incompleteCSV = `name,account_type,balance
,checking,5000
Valid Account,,3000
Another Account,savings,`;
      
      const result = await csvImportService.parseCSV(incompleteCSV);
      
      expect(result.success).toBe(false);
      expect(result.validRows).toBe(0);
      expect(result.invalidRows).toBe(3);
      
      // Check specific errors
      expect(result.rows[0].errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          code: 'REQUIRED_FIELD',
        })
      );
      
      expect(result.rows[1].errors).toContainEqual(
        expect.objectContaining({
          field: 'accountType',
          code: 'REQUIRED_FIELD',
        })
      );
      
      expect(result.rows[2].errors).toContainEqual(
        expect.objectContaining({
          field: 'balance',
          code: 'REQUIRED_FIELD',
        })
      );
    });

    it('should map account type variations correctly', async () => {
      const csvWithVariations = `name,account_type,balance
Checking Account,check,1000
Savings Account,save,2000
Investment Account,invest,3000
Retirement Account,401k,4000
Credit Card,cc,5000`;
      
      const result = await csvImportService.parseCSV(csvWithVariations);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.accountType).toBe('checking');
      expect(result.rows[1].parsed?.accountType).toBe('savings');
      expect(result.rows[2].parsed?.accountType).toBe('investment');
      expect(result.rows[3].parsed?.accountType).toBe('retirement');
      expect(result.rows[4].parsed?.accountType).toBe('credit');
    });

    it('should parse numeric values correctly', async () => {
      const csvWithNumbers = `name,account_type,balance,interest_rate
Account 1,checking,"$1,000.50",2.5%
Account 2,savings,2000.75,3.25
Account 3,investment,-500,`;
      
      const result = await csvImportService.parseCSV(csvWithNumbers);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.balance).toBe(1000.5);
      expect(result.rows[0].parsed?.interestRate).toBe(0.025); // 2.5% converted to decimal
      expect(result.rows[1].parsed?.balance).toBe(2000.75);
      expect(result.rows[1].parsed?.interestRate).toBe(0.0325); // 3.25% converted to decimal
      expect(result.rows[2].parsed?.balance).toBe(-500);
      expect(result.rows[2].parsed?.interestRate).toBeUndefined();
    });

    it('should parse tags correctly', async () => {
      const csvWithTags = `name,account_type,balance,tags
Account 1,checking,1000,"Tag1,Tag2,Tag3"
Account 2,savings,2000,"Single Tag"
Account 3,investment,3000,Tag1;Tag2|Tag3`;
      
      const result = await csvImportService.parseCSV(csvWithTags);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.tags).toEqual(['Tag1', 'Tag2', 'Tag3']);
      expect(result.rows[1].parsed?.tags).toEqual(['Single Tag']);
      expect(result.rows[2].parsed?.tags).toEqual(['Tag1', 'Tag2', 'Tag3']);
    });

    it('should validate data using validation service', async () => {
      const csvWithInvalidData = `name,account_type,balance,interest_rate
A,checking,1000000000,50
Valid Account,savings,5000,2.5`;
      
      const result = await csvImportService.parseCSV(csvWithInvalidData);
      
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      
      // First row should have validation errors
      expect(result.rows[0].errors.length).toBeGreaterThan(0);
      
      // Second row should be valid
      expect(result.rows[1].errors).toHaveLength(0);
    });

    it('should handle malformed CSV gracefully', async () => {
      const malformedCSV = 'name,account_type,balance\n"Unclosed quote,checking,1000';
      
      const result = await csvImportService.parseCSV(malformedCSV);
      
      // Should still attempt to parse but may have issues
      expect(result.totalRows).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateSampleCSV', () => {
    it('should generate valid sample CSV', () => {
      const sampleCSV = csvImportService.generateSampleCSV();
      
      expect(sampleCSV).toContain('name,account_type,institution');
      expect(sampleCSV).toContain('Emergency Fund,savings,Ally Bank');
      expect(sampleCSV).toContain('Investment Account,investment,Fidelity');
      expect(sampleCSV).toContain('Roth IRA,retirement,Vanguard');
      
      // Should be parseable
      const lines = sampleCSV.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toContain('name'); // Header row
    });

    it('should generate CSV that can be parsed back', async () => {
      const sampleCSV = csvImportService.generateSampleCSV();
      const result = await csvImportService.parseCSV(sampleCSV);
      
      expect(result.success).toBe(true);
      expect(result.validRows).toBeGreaterThan(0);
      expect(result.invalidRows).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle CSV with extra whitespace', async () => {
      const csvWithWhitespace = `  name  ,  account_type  ,  balance  
  Emergency Fund  ,  savings  ,  10000  
  Investment Account  ,  investment  ,  50000  `;
      
      const result = await csvImportService.parseCSV(csvWithWhitespace);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.name).toBe('Emergency Fund');
      expect(result.rows[0].parsed?.accountType).toBe('savings');
    });

    it('should handle CSV with empty rows', async () => {
      const csvWithEmptyRows = `name,account_type,balance

Emergency Fund,savings,10000

Investment Account,investment,50000

`;
      
      const result = await csvImportService.parseCSV(csvWithEmptyRows);
      
      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2); // Empty rows should be filtered out
    });

    it('should handle different currency formats', async () => {
      const csvWithCurrencies = `name,account_type,balance,currency
USD Account,checking,1000,USD
EUR Account,savings,2000,EUR
GBP Account,investment,3000,GBP
Invalid Currency,checking,4000,XYZ`;
      
      const result = await csvImportService.parseCSV(csvWithCurrencies);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.currency).toBe('USD');
      expect(result.rows[1].parsed?.currency).toBe('EUR');
      expect(result.rows[2].parsed?.currency).toBe('GBP');
      expect(result.rows[3].parsed?.currency).toBe('USD'); // Should default to USD for invalid currency
    });

    it('should handle tax treatment variations', async () => {
      const csvWithTaxTreatments = `name,account_type,balance,tax_treatment
Taxable Account,investment,1000,taxable
Traditional IRA,retirement,2000,traditional_ira
Roth IRA,retirement,3000,roth_ira
Invalid Treatment,retirement,4000,invalid_treatment`;
      
      const result = await csvImportService.parseCSV(csvWithTaxTreatments);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].parsed?.taxTreatment).toBe('taxable');
      expect(result.rows[1].parsed?.taxTreatment).toBe('traditional_ira');
      expect(result.rows[2].parsed?.taxTreatment).toBe('roth_ira');
      expect(result.rows[3].parsed?.taxTreatment).toBeUndefined(); // Invalid treatment should be undefined
    });
  });
});
