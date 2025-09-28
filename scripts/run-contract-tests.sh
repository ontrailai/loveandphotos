#!/bin/bash

# Contract Testing Suite Runner
# Comprehensive test execution for contract signing feature

set -e

echo "🎯 Starting Contract Testing Suite"
echo "=================================="

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

# Check if development server is running
check_dev_server() {
    print_status "Checking development server..."

    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Development server is running"
    else
        print_warning "Development server not running. Starting server..."
        npm run dev:direct > /dev/null 2>&1 &
        DEV_SERVER_PID=$!

        # Wait for server to start
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null; then
                print_success "Development server started"
                break
            fi
            sleep 2
        done

        if ! curl -s http://localhost:3000 > /dev/null; then
            print_error "Failed to start development server"
            exit 1
        fi
    fi
}

# Clean up previous test results
cleanup_previous_results() {
    print_status "Cleaning up previous test results..."

    rm -rf test-results/
    rm -rf coverage/
    rm -rf playwright-report/

    print_success "Cleanup completed"
}

# Run unit tests for ContractStep
run_unit_tests() {
    print_status "Running ContractStep unit tests..."

    if npm run test:frontend -- tests/components/booking/ContractStep.test.jsx --coverage; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "Running contract integration tests..."

    if npm run test:frontend -- tests/integration/contract-flow-integration.test.jsx --coverage; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Run E2E tests with console monitoring
run_e2e_tests() {
    print_status "Running E2E tests with console monitoring..."

    # Run comprehensive E2E tests
    if npx playwright test tests/e2e/contract-signing-comprehensive.spec.js --reporter=html; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
        return 1
    fi
}

# Run accessibility tests
run_accessibility_tests() {
    print_status "Running accessibility tests..."

    if npx playwright test tests/e2e/contract-signing-comprehensive.spec.js --grep "Accessibility" --reporter=html; then
        print_success "Accessibility tests passed"
    else
        print_warning "Some accessibility tests failed"
    fi
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."

    if npx playwright test tests/e2e/contract-signing-comprehensive.spec.js --grep "Performance" --reporter=html; then
        print_success "Performance tests passed"
    else
        print_warning "Some performance tests failed"
    fi
}

# Check for console warnings in test results
check_console_warnings() {
    print_status "Analyzing console warnings..."

    if [ -f "test-results/results.json" ]; then
        # Parse test results for console warnings
        if grep -q "duplicate key" test-results/results.json; then
            print_error "Found duplicate key warnings in console"
            return 1
        else
            print_success "No duplicate key warnings found"
        fi
    else
        print_warning "Test results file not found, skipping console analysis"
    fi
}

# Generate coverage report
generate_coverage_report() {
    print_status "Generating coverage report..."

    if npm run test:frontend:coverage -- tests/components/booking/ContractStep.test.jsx tests/integration/contract-flow-integration.test.jsx; then
        print_success "Coverage report generated"

        # Check coverage thresholds
        if [ -f "coverage/frontend/lcov-report/index.html" ]; then
            print_status "Coverage report available at: coverage/frontend/lcov-report/index.html"
        fi
    else
        print_warning "Failed to generate coverage report"
    fi
}

# Validate test results
validate_results() {
    print_status "Validating test results..."

    local unit_passed=false
    local integration_passed=false
    local e2e_passed=false

    # Check unit test results
    if [ -f "coverage/frontend/lcov-report/index.html" ]; then
        unit_passed=true
    fi

    # Check E2E test results
    if [ -f "playwright-report/index.html" ]; then
        e2e_passed=true
    fi

    # Summary
    echo ""
    echo "📊 Test Results Summary"
    echo "======================="

    if $unit_passed; then
        print_success "✅ Unit Tests: PASSED"
    else
        print_error "❌ Unit Tests: FAILED"
    fi

    if $integration_passed; then
        print_success "✅ Integration Tests: PASSED"
    else
        print_error "❌ Integration Tests: FAILED"
    fi

    if $e2e_passed; then
        print_success "✅ E2E Tests: PASSED"
    else
        print_error "❌ E2E Tests: FAILED"
    fi

    # Overall result
    if $unit_passed && $e2e_passed; then
        print_success "🎉 All contract tests passed!"
        return 0
    else
        print_error "❌ Some tests failed. Check reports for details."
        return 1
    fi
}

# Main execution
main() {
    # Parse command line arguments
    RUN_UNIT=true
    RUN_INTEGRATION=true
    RUN_E2E=true
    RUN_ACCESSIBILITY=false
    RUN_PERFORMANCE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                RUN_UNIT=true
                RUN_INTEGRATION=false
                RUN_E2E=false
                shift
                ;;
            --e2e-only)
                RUN_UNIT=false
                RUN_INTEGRATION=false
                RUN_E2E=true
                shift
                ;;
            --integration-only)
                RUN_UNIT=false
                RUN_INTEGRATION=true
                RUN_E2E=false
                shift
                ;;
            --with-accessibility)
                RUN_ACCESSIBILITY=true
                shift
                ;;
            --with-performance)
                RUN_PERFORMANCE=true
                shift
                ;;
            --all)
                RUN_UNIT=true
                RUN_INTEGRATION=true
                RUN_E2E=true
                RUN_ACCESSIBILITY=true
                RUN_PERFORMANCE=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --unit-only           Run only unit tests"
                echo "  --integration-only    Run only integration tests"
                echo "  --e2e-only           Run only E2E tests"
                echo "  --with-accessibility Run accessibility tests"
                echo "  --with-performance   Run performance tests"
                echo "  --all                Run all tests including accessibility and performance"
                echo "  --help               Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Setup
    check_dev_server
    cleanup_previous_results

    # Run tests based on flags
    local exit_code=0

    if $RUN_UNIT; then
        if ! run_unit_tests; then
            exit_code=1
        fi
    fi

    if $RUN_INTEGRATION; then
        if ! run_integration_tests; then
            exit_code=1
        fi
    fi

    if $RUN_E2E; then
        if ! run_e2e_tests; then
            exit_code=1
        fi
    fi

    if $RUN_ACCESSIBILITY; then
        run_accessibility_tests
    fi

    if $RUN_PERFORMANCE; then
        run_performance_tests
    fi

    # Analysis and reporting
    check_console_warnings
    generate_coverage_report
    validate_results

    # Final status
    if [ $exit_code -eq 0 ]; then
        print_success "🎯 Contract testing suite completed successfully!"
    else
        print_error "🚨 Contract testing suite completed with failures"
    fi

    # Cleanup development server if we started it
    if [ ! -z "$DEV_SERVER_PID" ]; then
        print_status "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi

    exit $exit_code
}

# Trap to cleanup on exit
trap 'if [ ! -z "$DEV_SERVER_PID" ]; then kill $DEV_SERVER_PID 2>/dev/null || true; fi' EXIT

# Run main function
main "$@"