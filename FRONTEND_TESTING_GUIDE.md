# Frontend Testing Implementation Guide

## 🎯 Overview

This document outlines the comprehensive React frontend testing infrastructure implemented for the Love & Photos application. The testing suite ensures high-quality, accessible, and performant user interfaces with 80%+ code coverage.

## 📋 Testing Stack

### Core Technologies
- **Jest**: Testing framework with jsdom environment
- **React Testing Library**: Component testing with user-focused approach
- **Jest-axe**: Accessibility testing for WCAG 2.1 AA compliance
- **User Event**: Realistic user interaction simulation
- **MSW**: Mock Service Worker for API mocking

### Configuration Files
- `jest.frontend.config.js`: Main frontend testing configuration
- `tests/frontend/setup.js`: Global test setup and mocks
- `tests/utils/testUtils.jsx`: Custom render functions and helpers

## 🏗️ Project Structure

```
tests/
├── frontend/
│   ├── setup.js                    # Global test setup
│   ├── simple.test.jsx             # Basic setup validation
│   ├── App.test.jsx                # App component and routing tests
│   ├── SignupEnhanced.test.jsx     # Enhanced signup form tests
│   ├── AuthContext.test.jsx        # Authentication context tests
│   ├── accessibility.test.jsx      # WCAG compliance tests
│   ├── performance.test.jsx        # Performance optimization tests
│   └── integration/
│       └── UserFlow.test.jsx       # End-to-end user flows
├── components/
│   └── ui/
│       ├── Button.test.jsx         # Button component tests
│       └── BasicInput.test.jsx     # Input component tests
├── utils/
│   └── testUtils.jsx               # Custom testing utilities
└── mocks/
    └── fileMock.js                 # Static asset mocks
```

## 🧪 Test Categories

### 1. Unit Tests - UI Components

**Location**: `tests/components/ui/`

**Coverage**: Individual React components with full prop variations, states, and interactions.

**Example - Button Component**:
```javascript
describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles different variants', () => {
    const { rerender } = render(<Button variant="secondary">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-sage-500')
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockClick = jest.fn()
    render(<Button onClick={mockClick}>Button</Button>)

    await user.keyboard('{Enter}')
    expect(mockClick).toHaveBeenCalled()
  })
})
```

### 2. Integration Tests - User Flows

**Location**: `tests/frontend/integration/`

**Coverage**: Complete user journeys from signup to dashboard navigation.

**Key Flows**:
- Customer signup and onboarding
- Photographer registration and profile setup
- Form validation and error handling
- Authentication state management

### 3. Accessibility Tests - WCAG Compliance

**Location**: `tests/frontend/accessibility.test.jsx`

**Coverage**: WCAG 2.1 AA compliance with automated axe-core testing.

**Features Tested**:
- Keyboard navigation support
- Screen reader compatibility
- ARIA attributes and landmarks
- Color contrast and focus indicators
- Form labels and error announcements

```javascript
it('has no accessibility violations', async () => {
  const { container } = render(<SignupEnhanced />, { authContext: mockAuth })
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 4. Performance Tests

**Location**: `tests/frontend/performance.test.jsx`

**Coverage**: Render performance, user interaction response times, and bundle optimization.

**Metrics Tracked**:
- Component render time < 200ms
- User interaction response < 100ms
- Form validation performance
- Memory leak prevention

### 5. Context and State Management Tests

**Location**: `tests/frontend/AuthContext.test.jsx`

**Coverage**: Authentication context, protected routes, and state management.

**Key Features**:
- User authentication flows
- Role-based access control
- Session persistence
- Error handling and recovery

## 🔧 Test Utilities

### Custom Render Functions

```javascript
// Basic render with routing and auth context
export function render(ui, options = {}) {
  const { route = '/', authContext = MockAuthContext, ...renderOptions } = options

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider value={authContext}>
          {children}
        </AuthProvider>
      </MemoryRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Authenticated user render helpers
export function renderAsCustomer(ui, options = {}) {
  return renderWithAuth(ui, {
    user: { id: '123', email: 'customer@test.com' },
    profile: { role: 'customer' },
    isAuthenticated: () => true,
    hasRole: (role) => role === 'customer'
  }, options)
}
```

### Mock Data Sets

```javascript
export const validFormData = {
  customer: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!'
  },
  photographer: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    password: 'PhotoPass456!',
    confirmPassword: 'PhotoPass456!'
  }
}
```

## 📊 Coverage Requirements

### Global Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Critical Component Thresholds
- **UI Components** (`src/components/ui/`): 90%
- **Context Providers** (`src/contexts/`): 85%
- **Core Pages**: 80%

### Coverage Reports
- **HTML Report**: `coverage/frontend/lcov-report/index.html`
- **LCOV Format**: `coverage/frontend/lcov.info`
- **JSON Summary**: `coverage/frontend/coverage-summary.json`

## 🚀 Running Tests

### Test Commands

```bash
# Run all frontend tests
npm run test:frontend

# Run tests in watch mode
npm run test:frontend:watch

# Run tests with coverage report
npm run test:frontend:coverage

# Run specific test categories
npm run test:components          # UI component tests
npm run test:frontend:accessibility  # Accessibility tests

# Run all tests (frontend + backend)
npm run test:all
```

### Test Execution Flow

1. **Setup**: Global mocks and test environment configuration
2. **Component Tests**: Individual UI component validation
3. **Integration Tests**: User flow testing
4. **Accessibility Tests**: WCAG compliance validation
5. **Performance Tests**: Speed and optimization verification
6. **Coverage Analysis**: Code coverage reporting

## 🔍 Key Testing Patterns

### 1. User-Centered Testing

Tests focus on user interactions rather than implementation details:

```javascript
// ✅ Good - Tests user behavior
await user.type(screen.getByLabelText(/email/i), 'user@example.com')
await user.click(screen.getByRole('button', { name: /submit/i }))
expect(screen.getByText('Success!')).toBeInTheDocument()

// ❌ Avoid - Tests implementation details
expect(component.state.email).toBe('user@example.com')
```

### 2. Accessibility-First Approach

Every component test includes accessibility validation:

```javascript
it('is accessible', async () => {
  const { container } = render(<Component />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 3. Mock Strategy

- **External Services**: Supabase, Stripe, and third-party APIs
- **Browser APIs**: IntersectionObserver, ResizeObserver, matchMedia
- **Navigation**: React Router hooks and components
- **UI Libraries**: 21st.dev components and Lucide icons

### 4. Error Boundary Testing

Comprehensive error handling validation:

```javascript
it('handles errors gracefully', async () => {
  mockAuth.signUp.mockRejectedValue(new Error('Network error'))
  // Test error recovery and user feedback
})
```

## 📈 Performance Benchmarks

### Render Performance
- **Simple Components**: < 50ms
- **Complex Forms**: < 200ms
- **Full Page Load**: < 500ms

### Interaction Performance
- **Input Response**: < 50ms
- **Form Validation**: < 100ms
- **Route Transitions**: < 300ms

### Bundle Optimization
- **Tree Shaking**: Verified through import testing
- **Lazy Loading**: Route-based code splitting
- **Memory Management**: Cleanup validation

## 🛡️ Security Testing

### Input Validation
- XSS prevention testing
- SQL injection protection
- CSRF token validation
- Input sanitization

### Authentication Security
- Session management
- Role-based access control
- Protected route validation
- Token handling

## 🌐 Browser Compatibility

### Supported Environments
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Mobile Testing
- **iOS Safari**: Latest version
- **Android Chrome**: Latest version
- **Responsive Design**: All breakpoints

## 📝 Test Development Workflow

### 1. Test-Driven Development (TDD)
1. Write failing test case
2. Implement minimal code to pass
3. Refactor while maintaining tests
4. Repeat cycle

### 2. Component Testing Checklist
- [ ] Renders correctly with default props
- [ ] Handles all prop variations
- [ ] Responds to user interactions
- [ ] Shows proper loading/error states
- [ ] Meets accessibility standards
- [ ] Performs within benchmarks

### 3. Integration Testing Steps
1. Define user journey
2. Mock external dependencies
3. Test happy path flow
4. Test error scenarios
5. Validate state transitions

## 🔧 Debugging Tests

### Common Issues and Solutions

1. **Async Operations**
   ```javascript
   // Use waitFor for async state updates
   await waitFor(() => {
     expect(screen.getByText('Success!')).toBeInTheDocument()
   })
   ```

2. **User Events**
   ```javascript
   // Always setup userEvent properly
   const user = userEvent.setup()
   await user.click(button)
   ```

3. **Mock Cleanup**
   ```javascript
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```

### Test Debugging Tools
- **React Developer Tools**: Component state inspection
- **Testing Library Debug**: `screen.debug()` for DOM snapshots
- **Jest Watch Mode**: Interactive test running
- **Coverage Reports**: Identify untested code paths

## 🎯 Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Screenshot comparison
2. **Cross-Browser Testing**: Automated browser matrix
3. **Performance Monitoring**: Real User Metrics integration
4. **API Contract Testing**: Schema validation
5. **Internationalization Testing**: Multi-language support

### Continuous Integration
- **Pre-commit Hooks**: Run tests before commits
- **Pull Request Validation**: Automated test execution
- **Coverage Gates**: Enforce coverage thresholds
- **Performance Regression**: Benchmark comparisons

## 📚 Resources

### Documentation Links
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Internal References
- `TESTING_IMPLEMENTATION_SUMMARY.md`: Backend testing overview
- `API_DOCUMENTATION.md`: API endpoint specifications
- `CLAUDE.md`: Project configuration and MCP setup

---

This comprehensive testing implementation ensures the Love & Photos frontend delivers a high-quality, accessible, and performant user experience while maintaining code reliability and facilitating confident development iterations.