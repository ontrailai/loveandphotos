# Contract Signing Feature Testing Strategy

## Overview

This comprehensive testing strategy ensures the contract signing feature is bulletproof against infinite loading, console warnings, and various edge cases. The tests cover unit testing, integration testing, and end-to-end scenarios with console monitoring.

## Test Structure

```
tests/
├── components/booking/
│   └── ContractStep.test.jsx          # Unit tests for ContractStep component
├── integration/
│   └── contract-flow-integration.test.jsx  # Integration with BookingFlowContext
├── e2e/
│   └── contract-signing-comprehensive.spec.js  # E2E tests with console monitoring
├── helpers/
│   ├── contractTestHelpers.js         # Test utilities and helpers
│   ├── globalSetup.js                 # Playwright global setup
│   └── globalTeardown.js              # Playwright global teardown
└── fixtures/
    └── contractTestData.js             # Test data scenarios
```

## Key Testing Areas

### 1. Unit Testing (`ContractStep.test.jsx`)

**Loading States & Timeouts:**
- ✅ Loading spinner display during contract generation
- ✅ 10-second timeout handling with proper error states
- ✅ Prevention of infinite loading loops
- ✅ Graceful handling of contract generation failures

**Redirect Logic:**
- ✅ Validation of incomplete booking data
- ✅ Proper navigation to first incomplete step
- ✅ Access control validation (canAccessStep)
- ✅ Error logging for debugging

**Signature Validation:**
- ✅ Signature presence validation
- ✅ Signature format validation (base64 PNG)
- ✅ Signature size limits (2MB max)
- ✅ Consent checkbox requirement
- ✅ Signer name length validation

**Network Failures:**
- ✅ API timeout handling
- ✅ Network disconnection scenarios
- ✅ 404 error handling with appropriate messages
- ✅ Retry mechanisms without infinite loops

### 2. Integration Testing (`contract-flow-integration.test.jsx`)

**BookingFlow Context Integration:**
- ✅ Contract data population from booking flow
- ✅ Context updates after successful signing
- ✅ Step navigation validation
- ✅ Real-time form state management

**Error Handling Integration:**
- ✅ Context error propagation
- ✅ Form validation with context data
- ✅ Navigation after errors
- ✅ State persistence during errors

### 3. E2E Testing (`contract-signing-comprehensive.spec.js`)

**Console Monitoring:**
- ✅ Detection of React duplicate key warnings
- ✅ JavaScript error tracking
- ✅ Memory leak detection
- ✅ Component cleanup validation

**Complete User Flows:**
- ✅ End-to-end contract signing flow
- ✅ Network disconnection handling
- ✅ Rapid user interaction testing
- ✅ Cross-browser compatibility

**Performance Testing:**
- ✅ Large contract content handling
- ✅ Loading time benchmarks
- ✅ Signature responsiveness
- ✅ Page navigation performance

## Test Data Management

### Booking Flow Scenarios
- **Complete Valid Flow**: Full booking data for successful contract generation
- **Missing Schedule**: Tests redirect to schedule step
- **Missing Package**: Tests redirect to package step
- **Partially Complete**: Tests intermediate states

### Contract Data Scenarios
- **Standard Contract**: Normal-sized contract with all required fields
- **Large Contract**: Tests performance with large contract text
- **Minimal Contract**: Tests with minimal required data

### Signature Scenarios
- **Valid Drawn**: Hand-drawn signature on canvas
- **Valid Typed**: Generated typed signature
- **Missing Signature**: Tests validation errors
- **Invalid Format**: Tests format validation
- **Oversized**: Tests size limit validation

### API Response Scenarios
- **Success**: Normal successful contract signing
- **404 Not Found**: Service unavailable scenarios
- **500 Server Error**: Internal server errors
- **408 Timeout**: Request timeout handling
- **429 Rate Limited**: Rate limiting scenarios

## Console Monitoring Strategy

### What We Monitor
1. **React Warnings**:
   - Duplicate key warnings in lists
   - Component mounting/unmounting issues
   - State update warnings

2. **JavaScript Errors**:
   - Unhandled promise rejections
   - Type errors
   - Reference errors

3. **Performance Issues**:
   - Long task warnings
   - Memory usage spikes
   - Layout thrashing

### Monitoring Implementation
```javascript
// Console monitoring in E2E tests
page.on('console', (msg) => {
  consoleMessages.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
    timestamp: Date.now()
  })
})

// After test validation
const duplicateKeyWarnings = consoleMessages.filter(msg =>
  msg.text.includes('duplicate key') ||
  msg.text.includes('same key')
)
expect(duplicateKeyWarnings).toHaveLength(0)
```

## Timeout Prevention Strategy

### Loading State Management
1. **Contract Generation Timeout**: 10-second maximum
2. **API Request Timeout**: 5-second maximum
3. **Navigation Timeout**: 3-second maximum

### Implementation
```javascript
// Contract loading with timeout
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setSubmitError('Contract loading timed out. Please try again.')
    setIsLoading(false)
  }, 10000)

  const loadContract = async () => {
    try {
      const contract = await generateContractForBooking(bookingFlow)
      setContractData(contract)
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      handleError(error)
    } finally {
      setIsLoading(false)
    }
  }

  loadContract()
  return () => clearTimeout(timeoutId)
}, [bookingFlow])
```

### Infinite Loop Prevention
1. **Retry Limits**: Maximum 3 retry attempts
2. **Exponential Backoff**: Increasing delays between retries
3. **Circuit Breaker**: Stop retrying after consecutive failures

## Running the Tests

### Quick Start
```bash
# Run all contract tests
./scripts/run-contract-tests.sh

# Run specific test types
./scripts/run-contract-tests.sh --unit-only
./scripts/run-contract-tests.sh --e2e-only
./scripts/run-contract-tests.sh --integration-only

# Run with accessibility and performance tests
./scripts/run-contract-tests.sh --all
```

### Individual Test Commands
```bash
# Unit tests
npm run test:frontend -- tests/components/booking/ContractStep.test.jsx

# Integration tests
npm run test:frontend -- tests/integration/contract-flow-integration.test.jsx

# E2E tests
npx playwright test tests/e2e/contract-signing-comprehensive.spec.js

# E2E tests with headed browser (for debugging)
npx playwright test tests/e2e/contract-signing-comprehensive.spec.js --headed

# Run specific test
npx playwright test tests/e2e/contract-signing-comprehensive.spec.js -g "should handle 10-second loading timeout"
```

### Coverage Reports
```bash
# Generate coverage for contract tests
npm run test:frontend:coverage -- tests/components/booking/ContractStep.test.jsx tests/integration/contract-flow-integration.test.jsx

# View coverage report
open coverage/frontend/lcov-report/index.html
```

## Test Validation Checklist

### Before Release
- [ ] All unit tests pass with >90% coverage
- [ ] Integration tests pass without warnings
- [ ] E2E tests complete without console errors
- [ ] No duplicate key warnings in React components
- [ ] Loading states timeout properly (10 seconds max)
- [ ] Network failures handled gracefully
- [ ] Form validation prevents invalid submissions
- [ ] Accessibility tests pass
- [ ] Performance benchmarks met

### Critical Success Criteria
1. **Zero Infinite Loading**: All loading states must timeout within 10 seconds
2. **Clean Console**: No React warnings or JavaScript errors during normal operation
3. **Bulletproof Validation**: Invalid signatures and missing data properly handled
4. **Network Resilience**: Graceful degradation during network issues
5. **User Experience**: Clear error messages and recovery paths

## Debugging Failed Tests

### Console Warnings
```bash
# Check for specific warning patterns
grep -r "duplicate key" test-results/
grep -r "Warning:" test-results/

# Run E2E tests with console logging
npx playwright test --headed --debug
```

### Network Issues
```bash
# Test with network simulation
npx playwright test --timeout 60000 --retries 0
```

### Performance Issues
```bash
# Run performance-focused tests
npx playwright test tests/e2e/contract-signing-comprehensive.spec.js -g "Performance"
```

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Contract Tests
  run: |
    chmod +x scripts/run-contract-tests.sh
    ./scripts/run-contract-tests.sh --all

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: contract-test-results
    path: |
      test-results/
      coverage/
      playwright-report/
```

### Quality Gates
- Minimum 90% test coverage for contract components
- Zero console warnings in E2E tests
- All loading states must complete within timeout limits
- Performance benchmarks must be met

This comprehensive testing strategy ensures your contract signing feature is robust, user-friendly, and maintainable while preventing the specific issues you identified: infinite loading and duplicate key warnings.