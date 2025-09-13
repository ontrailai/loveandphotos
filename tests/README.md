# Love & Photos API Testing Suite

Comprehensive test-driven development setup for the Love & Photos photography marketplace API.

## Overview

This testing suite implements a robust TDD approach with:
- **Unit Tests**: Individual function and component validation
- **Integration Tests**: End-to-end workflow testing
- **API Tests**: HTTP endpoint testing with supertest
- **Mock Services**: Isolated testing with Stripe, Supabase, and email mocks
- **Coverage Reporting**: Comprehensive code coverage analysis

## Directory Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── health-endpoint.test.js
│   ├── checkout-session.test.js
│   └── email-endpoint.test.js
├── integration/            # End-to-end integration tests
│   └── booking-flow.test.js
├── unit/                   # Unit tests
│   ├── api-validation.test.js
│   └── mock-services.test.js
├── utils/                  # Testing utilities
│   └── testServer.js
├── mocks/                  # Service mocks
│   ├── supabase.js
│   ├── stripe.js
│   └── email.js
├── fixtures/               # Test data
│   └── testData.js
├── setup.js               # Global test setup
├── testSequencer.js       # Custom test execution order
└── README.md              # This file
```

## Test Categories

### 1. Unit Tests
- **Input Validation**: Email, phone, amount, date validation
- **Mock Service Reliability**: Supabase, Stripe, email service mocks
- **Edge Cases**: Security, performance, error handling

### 2. API Tests
- **Health Check**: System status and monitoring endpoints
- **Payment Processing**: Stripe checkout session creation and verification
- **Email Services**: Notification sending and delivery tracking
- **Error Handling**: Graceful failure and recovery

### 3. Integration Tests
- **Booking Flow**: Complete user booking journey
- **Error Recovery**: Partial failure handling
- **Data Consistency**: Cross-service data integrity
- **Performance**: Load testing and concurrent requests

## Running Tests

### All Tests
```bash
npm test
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# API tests only
npm run test:api

# Watch mode (auto-rerun on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Individual Test Files
```bash
# Specific test file
npx jest tests/api/health-endpoint.test.js

# Pattern matching
npx jest --testNamePattern="payment"
```

## Coverage Requirements

The test suite maintains minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Coverage reports are generated in `coverage/` directory with:
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON data: `coverage/coverage-final.json`

## Mock Services

### Supabase Mock
- In-memory database simulation
- Full CRUD operations
- Query filtering and sorting
- Auth and storage mocking
- Reset/seed functionality

### Stripe Mock
- Checkout session creation/retrieval
- Customer management
- Connect account handling
- Webhook event simulation
- Error scenario testing

### Email Mock
- Template rendering
- Delivery tracking
- Bulk sending
- Bounce handling
- Sent email inspection

## Test Data

### Fixtures
- **Users**: Various user profiles and scenarios
- **Photographers**: Different skill levels and pricing tiers
- **Packages**: Bronze, Silver, Gold, Platinum tiers
- **Bookings**: Various states and scenarios
- **Validation Cases**: Edge cases and invalid inputs

### Scenarios
- **New User Booking**: First-time customer flow
- **Budget Booking**: Low-cost package selection
- **Luxury Booking**: High-end service booking

## Environment Configuration

### Test Environment Variables
```bash
# Database
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=test_service_key

# Payments
STRIPE_SECRET_KEY=sk_test_mock_key
STRIPE_WEBHOOK_SECRET=whsec_test_key

# Email
RESEND_API_KEY=re_test_key

# Features
ENABLE_REAL_PAYMENTS=false
ENABLE_REAL_EMAILS=false
```

### Configuration Files
- `.env.test`: Test environment variables
- `jest.config.js`: Jest configuration
- `babel.config.js`: Babel transformation setup

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert Pattern**: Clear test structure
2. **Descriptive Names**: Test intention should be obvious
3. **Isolated Tests**: No dependencies between tests
4. **Mock External Services**: Use provided mocks
5. **Edge Case Coverage**: Test error conditions

### Test Organization
1. **Logical Grouping**: Related tests in describe blocks
2. **Setup/Teardown**: Use beforeEach/afterEach for cleanup
3. **Data Reset**: Reset mocks between tests
4. **Async Handling**: Proper async/await usage

### Performance
1. **Parallel Execution**: Tests run concurrently where possible
2. **Smart Sequencing**: Unit → Integration → API order
3. **Resource Cleanup**: Proper server and connection cleanup
4. **Timeout Management**: Reasonable test timeouts

## CI/CD Integration

The test suite is designed for CI/CD integration:

### GitHub Actions Example
```yaml
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No security vulnerabilities in dependencies
- Performance benchmarks maintained

## Debugging Tests

### Common Issues
1. **Port Conflicts**: Ensure test ports (3002) are available
2. **Async Timing**: Use proper async/await patterns
3. **Mock State**: Reset mocks between tests
4. **Environment Variables**: Check `.env.test` configuration

### Debug Commands
```bash
# Verbose output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="should create checkout session"

# Run with console output
VERBOSE_TESTS=true npm test
```

### Useful Debug Tools
- `console.log()` in tests (avoided in CI)
- Jest debugger with `--inspect-brk`
- Coverage reports for missing test areas
- Mock inspection methods

## Maintenance

### Regular Tasks
1. **Dependency Updates**: Keep testing libraries current
2. **Coverage Review**: Monitor and improve coverage
3. **Performance Monitoring**: Track test execution time
4. **Mock Updates**: Keep mocks aligned with real services

### Adding New Tests
1. Follow existing patterns and structure
2. Use provided utilities and fixtures
3. Include both success and failure scenarios
4. Update coverage requirements if needed
5. Document any new testing utilities

## Security Considerations

### Input Sanitization Testing
- XSS prevention validation
- SQL injection prevention
- Path traversal protection
- Large payload handling

### Authentication Testing
- Invalid token handling
- Permission verification
- Session management
- Rate limiting

### Data Protection
- PII handling in tests
- Secure test data cleanup
- Mock data isolation
- No real credentials in tests

## Monitoring and Reporting

### Metrics Tracked
- Test execution time
- Coverage percentages
- Failure rates
- Performance benchmarks

### Reports Generated
- Coverage HTML reports
- Test result summaries
- Performance metrics
- Security scan results

For questions or contributions to the test suite, refer to the main project documentation or contact the development team.