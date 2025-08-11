/**
 * Simple AccountValidationService Test
 * Basic functionality test without complex mocking
 */

// Import the service directly
import { accountValidationService } from '../AccountValidationService';

// Simple test runner
const runTests = () => {
  console.log('Starting AccountValidationService tests...');
  
  // Test 1: Valid account validation
  try {
    const validAccount = {
      name: 'Test Checking Account',
      accountType: 'checking' as const,
      balance: 5000,
      currency: 'USD' as const,
      interestRate: 0.01,
    };
    
    const result = accountValidationService.validateAccount(validAccount);
    
    if (result.isValid && result.errors.length === 0) {
      console.log('✅ Test 1 PASSED: Valid account validation');
    } else {
      console.log('❌ Test 1 FAILED: Valid account should pass validation');
      console.log('Errors:', result.errors);
    }
  } catch (error) {
    console.log('❌ Test 1 ERROR:', error);
  }
  
  // Test 2: Invalid account validation (missing name)
  try {
    const invalidAccount = {
      name: '',
      accountType: 'checking' as const,
      balance: 5000,
      currency: 'USD' as const,
    };
    
    const result = accountValidationService.validateAccount(invalidAccount);
    
    if (!result.isValid && result.errors.some(e => e.field === 'name' && e.code === 'REQUIRED_FIELD')) {
      console.log('✅ Test 2 PASSED: Invalid account validation (missing name)');
    } else {
      console.log('❌ Test 2 FAILED: Invalid account should fail validation');
      console.log('Result:', result);
    }
  } catch (error) {
    console.log('❌ Test 2 ERROR:', error);
  }
  
  // Test 3: Routing number validation
  try {
    const accountWithInvalidRouting = {
      name: 'Test Account',
      accountType: 'checking' as const,
      balance: 1000,
      currency: 'USD' as const,
      routingNumber: '123456789', // Invalid checksum
    };
    
    const result = accountValidationService.validateAccount(accountWithInvalidRouting);
    
    if (!result.isValid && result.errors.some(e => e.field === 'routingNumber' && e.code === 'INVALID_ROUTING_CHECKSUM')) {
      console.log('✅ Test 3 PASSED: Routing number validation');
    } else {
      console.log('❌ Test 3 FAILED: Invalid routing number should fail validation');
      console.log('Result:', result);
    }
  } catch (error) {
    console.log('❌ Test 3 ERROR:', error);
  }
  
  // Test 4: Field validation
  try {
    const nameResult = accountValidationService.validateField('name', 'Valid Account Name');
    const emptyNameResult = accountValidationService.validateField('name', '');
    
    if (nameResult.isValid && !emptyNameResult.isValid) {
      console.log('✅ Test 4 PASSED: Field validation');
    } else {
      console.log('❌ Test 4 FAILED: Field validation not working correctly');
      console.log('Valid name result:', nameResult);
      console.log('Empty name result:', emptyNameResult);
    }
  } catch (error) {
    console.log('❌ Test 4 ERROR:', error);
  }
  
  console.log('AccountValidationService tests completed.');
};

// Export for potential use in other contexts
export { runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
