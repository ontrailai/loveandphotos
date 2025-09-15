# Photographer Thumbnail Testing Suite

A comprehensive testing strategy designed to identify, validate fixes for, and prevent regression of thumbnail rendering issues on the `/photographers` page.

## Quick Start

```bash
# Run all photographer thumbnail tests
npm run test:thumbnails:all

# Run specific test types
npm run test:thumbnails:unit           # Unit tests only
npm run test:thumbnails:integration    # Integration tests only
npm run test:e2e:thumbnails           # E2E tests only
npm run test:performance:thumbnails   # Performance tests only
```

## Test Categories

### 🧪 Unit Tests (`/tests/components/photographer-thumbnails.unit.test.jsx`)
**Purpose**: Test individual component logic without browser dependencies
- Avatar URL processing and fallback behavior
- Data transformation and display logic
- Profile link generation
- Error handling and edge cases

### 🔗 Integration Tests (`/tests/integration/photographer-grid-integration.test.jsx`)
**Purpose**: Test component interactions and API integration
- Loading state transitions
- Mixed data quality handling
- Theme switching impact
- Error recovery and retry logic

### 🌐 E2E Tests (`/tests/photographer-thumbnail-e2e.spec.js`)
**Purpose**: Real browser validation of thumbnail rendering
- Initial page load validation
- Visual regression detection
- Cross-browser compatibility
- Network condition simulation

### ⚡ Performance Tests (`/tests/performance/photographer-grid-performance.spec.js`)
**Purpose**: Performance metrics and resource optimization
- Cumulative Layout Shift (CLS) measurement
- Image loading performance
- Memory usage monitoring
- Core Web Vitals validation

## Test Scenarios Covered

### Edge Cases
- ✅ Null/empty avatar URLs → fallback display
- ✅ Broken image URLs → graceful degradation
- ✅ Slow loading images → performance thresholds
- ✅ Missing data fields → safe defaults
- ✅ Network failures → error recovery

### Performance Cases
- ✅ CLS < 0.05 during image loading
- ✅ LCP < 2.5s on initial load
- ✅ Memory usage < 50MB for large grids
- ✅ Concurrent image loading efficiency

### Accessibility Cases
- ✅ Proper alt text on images
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ ARIA labels on interactive elements

## Success Criteria

| Metric | Threshold | Current Status |
|--------|-----------|---------------|
| **Thumbnail Visibility** | 100% cards show image or fallback | 🔍 Testing |
| **CLS Score** | < 0.05 | 🔍 Testing |
| **Theme Consistency** | Images persist through switches | 🔍 Testing |
| **Error Recovery** | Broken URLs show fallbacks | 🔍 Testing |
| **Load Performance** | Page ready < 3s on slow-3g | 🔍 Testing |

## Files Structure

```
tests/
├── README-Photographer-Testing.md              # This file
├── photographer-thumbnail-testing-strategy.md  # Detailed strategy
├── components/
│   └── photographer-thumbnails.unit.test.jsx  # Unit tests
├── integration/
│   └── photographer-grid-integration.test.jsx # Integration tests
├── performance/
│   └── photographer-grid-performance.spec.js  # Performance tests
├── photographer-thumbnail-e2e.spec.js         # E2E tests
├── fixtures/
│   └── photographer-test-data.js              # Test data
└── screenshots/                               # Visual outputs
    ├── baseline/
    ├── current/
    └── diff/
```

## Test Data

The test suite uses realistic data fixtures from `/tests/fixtures/photographer-test-data.js`:

- **High Quality**: Perfect data with valid images
- **Mixed Quality**: Realistic mix of data completeness
- **Error Prone**: Edge cases and broken scenarios
- **Large Dataset**: Performance testing with 50+ photographers
- **Accessibility**: Screen reader optimized data

## Running Tests

### Individual Test Commands

```bash
# Unit tests with coverage
npm run test:thumbnails:coverage

# E2E with visual output
npm run test:e2e:thumbnails

# Performance with detailed metrics
npm run test:performance:thumbnails

# Accessibility focused tests
npm run test:accessibility:thumbnails

# Update visual regression baselines
npm run test:visual
```

### Full Test Suite

```bash
# Complete test suite with reporting
bash scripts/run-photographer-tests.sh

# With specific environment
BASE_URL=http://localhost:3000 bash scripts/run-photographer-tests.sh

# Skip specific test types
RUN_PERFORMANCE=false bash scripts/run-photographer-tests.sh
```

## Debugging Failed Tests

### Screenshot Analysis
```bash
# View generated screenshots
ls -la tests/screenshots/

# Compare visual differences
open tests/screenshots/diff/
```

### Performance Issues
```bash
# Check CLS measurements
grep -r "CLS:" test-results/

# Memory usage analysis
grep -r "Memory:" test-results/
```

### Network Problems
```bash
# Test with slow network simulation
npx playwright test --global-timeout 60000
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Photographer Tests
  run: |
    npm run test:thumbnails:coverage
    npm run test:e2e:thumbnails
  env:
    BASE_URL: ${{ env.PREVIEW_URL }}
```

### Performance Budgets
```yaml
- name: Performance Budget Check
  run: |
    npm run test:performance:thumbnails
    # Fail if CLS > 0.05 or load time > 3s
```

## Troubleshooting

### Common Issues

**Tests timing out**
```bash
# Increase timeout for slow environments
npx playwright test --timeout 30000
```

**Screenshots not matching**
```bash
# Update baselines after intentional UI changes
npm run test:visual
```

**Memory issues**
```bash
# Run with increased memory
node --max-old-space-size=4096 $(which npm) run test:performance:thumbnails
```

**Dev server not starting**
```bash
# Manual server start
npm run dev:direct &
sleep 10
npm run test:e2e:thumbnails
```

## Contributing

When adding new photographer-related features:

1. **Update unit tests** for new component logic
2. **Add integration tests** for API changes
3. **Include E2E scenarios** for user-facing changes
4. **Consider performance impact** for image-heavy features
5. **Test accessibility** with screen readers

### Test Naming Conventions

```javascript
// Unit tests: test('handles [scenario] [expectation]')
test('handles missing avatar URL with fallback display')

// Integration: test('[feature] [behavior] [condition]')
test('photographer grid renders correctly with mixed data quality')

// E2E: test('validates [user behavior] [expected outcome]')
test('validates thumbnail rendering on initial load')

// Performance: test('[metric] [measurement] [threshold]')
test('measures CLS during image loading below 0.05')
```

## Monitoring and Alerts

Set up monitoring for:
- **Test failure rates** → Slack/email notifications
- **Performance regressions** → Automated rollback triggers
- **Screenshot differences** → Visual diff reports
- **Accessibility violations** → axe-core integration

## Related Documentation

- [Testing Strategy](./photographer-thumbnail-testing-strategy.md) - Detailed testing approach
- [Test Fixtures](./fixtures/photographer-test-data.js) - Data generation utilities
- [Performance Thresholds](./performance/) - Web Vitals benchmarks
- [Visual Regression](./screenshots/) - Baseline management

---

**Need help?** Check the main testing strategy document or reach out to the development team.