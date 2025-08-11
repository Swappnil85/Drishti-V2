#!/bin/bash

# Test Script for Mobile App
# Comprehensive testing script with different test types and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run tests with proper error handling
run_test_suite() {
    local test_name=$1
    local test_command=$2
    
    print_status "Running $test_name..."
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed"
        return 1
    fi
}

# Main test execution
main() {
    print_status "Starting Mobile App Test Suite"
    print_status "======================================"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the mobile app root directory."
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    # Initialize test results
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Test suites to run
    declare -A test_suites=(
        ["Unit Tests"]="npm run test:unit"
        ["Integration Tests"]="npm run test:integration"
        ["Component Tests"]="npm run test:components"
        ["Service Tests"]="npm run test:services"
        ["E2E Tests"]="npm run test:e2e"
        ["Coverage Report"]="npm run test:coverage"
    )
    
    # Run each test suite
    for test_name in "${!test_suites[@]}"; do
        total_tests=$((total_tests + 1))
        
        if run_test_suite "$test_name" "${test_suites[$test_name]}"; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
            
            # Ask if user wants to continue on failure
            if [ "$CI" != "true" ]; then
                echo
                read -p "Test suite failed. Continue with remaining tests? (y/n): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_error "Test execution stopped by user"
                    exit 1
                fi
            fi
        fi
        
        echo
    done
    
    # Print summary
    print_status "Test Execution Summary"
    print_status "======================"
    echo "Total test suites: $total_tests"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    
    if [ $failed_tests -eq 0 ]; then
        print_success "All test suites passed! 🎉"
        
        # Generate test report if all tests pass
        if command -v jest &> /dev/null; then
            print_status "Generating comprehensive test report..."
            npm run test:report
        fi
        
        exit 0
    else
        print_error "Some test suites failed. Please check the output above."
        exit 1
    fi
}

# Handle script arguments
case "${1:-all}" in
    "unit")
        run_test_suite "Unit Tests" "npm run test:unit"
        ;;
    "integration")
        run_test_suite "Integration Tests" "npm run test:integration"
        ;;
    "components")
        run_test_suite "Component Tests" "npm run test:components"
        ;;
    "services")
        run_test_suite "Service Tests" "npm run test:services"
        ;;
    "e2e")
        run_test_suite "E2E Tests" "npm run test:e2e"
        ;;
    "coverage")
        run_test_suite "Coverage Report" "npm run test:coverage"
        ;;
    "watch")
        print_status "Starting test watcher..."
        npm run test:watch
        ;;
    "ci")
        print_status "Running CI test suite..."
        CI=true npm run test:ci
        ;;
    "all"|*)
        main
        ;;
esac
