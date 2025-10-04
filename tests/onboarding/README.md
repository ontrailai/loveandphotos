# Videographer Onboarding Test Suite

## Overview

Comprehensive test suite for the videographer application flow, covering all critical functionality including form validation, auto-rejection logic, and successful submissions.

## Test Coverage

### 1. Critical Questions Flow
- ✅ Role selection screen rendering
- ✅ Navigation to videographer application form
- ✅ Display of all 6 critical eligibility questions
- ✅ Display of additional information questions
- ✅ Terms and conditions checkbox

### 2. Auto-Rejection Logic
- ✅ Rejection when age question answered "No"
- ✅ Rejection when any critical question answered "No"
- ✅ Database saves rejected applications with `is_accepted: false`
- ✅ Proper rejection reason stored

### 3. Successful Submission
- ✅ Acceptance when all critical questions answered "Yes"
- ✅ All form data saved to database
- ✅ Additional questions data included in submission
- ✅ Automatic redirect to dashboard after success
- ✅ User account creation via Supabase Auth

### 4. Validation
- ✅ Terms acceptance requirement
- ✅ Password matching validation
- ✅ Required field validation

## Critical Questions (Must ALL be "Yes")

For videographers, the following 6 questions must all be answered "Yes" for acceptance:

1. **Are you at least 18 years of age?**
2. **Do you have reliable transportation?**
3. **Are you willing to accept work for $40 per hour?**
4. **Do you have gear to record sound?**
5. **Are you open to filming weddings of all backgrounds, including different races, religions, and orientations?**
6. **Is your camera professional-grade?** (No smartphones, androids, etc. allowed)

## Additional Questions (Optional Information)

7. Do you have a drone? (Yes/No)
8. How many years of experience do you have in wedding videography? (Text)
9. Did someone refer you? (Text)
10. Do you have Instagram? (Text)
11. Do you also offer photography services? (Dropdown: Yes/No)
12. We'd love to get to know you better! (Textarea)
13. Terms and Conditions (Checkbox - Required)

## Running Tests

```bash
# Run all onboarding tests
npm test tests/onboarding

# Run with coverage
npm test tests/onboarding -- --coverage

# Run specific test file
npm test tests/onboarding/videographer-application.test.js
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

```javascript
it('should reject application if age question is answered "No"', async () => {
  // Arrange - Set up mocks and render component
  renderApplication()

  // Act - User interactions
  fireEvent.click(videographerButton)
  // ... fill form

  // Assert - Verify expected outcomes
  expect(screen.getByText('Application Not Approved')).toBeInTheDocument()
})
```

## Database Schema Requirements

The `talent_applications` table must support:

```sql
CREATE TABLE talent_applications (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  answers JSONB NOT NULL, -- Stores all question responses
  is_accepted BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  user_id UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);
```

## Error Handling

All error scenarios are tested:

- **Supabase write failures**: Displays user-friendly error message
- **Duplicate applications**: Handled by unique email constraint
- **Network errors**: Caught and displayed via toast notifications
- **Validation errors**: Shown before submission attempt

## Integration Points

### Supabase
- `supabase.from('talent_applications').insert()` - Save application
- `supabase.from('talent_applications').update()` - Link to user account

### Auth Context
- `signUp(email, password, userData)` - Create user account for accepted applicants
- Returns `{ success: boolean, user: { id: string } }`

### React Router
- `navigate('/talent/dashboard')` - Redirect after successful submission
- `navigate('/')` - Return to home on rejection

## Debugging

Enable detailed logging:

```javascript
// Add to test file
beforeEach(() => {
  console.log('[TEST] Starting test:', expect.getState().currentTestName)
})
```

Check Supabase calls:

```javascript
console.log('[MOCK CALLS]', supabase.from.mock.calls)
```

## Known Issues

None currently. All tests passing.

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Test file upload functionality (portfolio images)
- [ ] Test real-time validation feedback
- [ ] Add accessibility testing
- [ ] Performance testing for form rendering

## Contributing

When adding new tests:

1. Follow existing naming conventions
2. Group related tests in `describe` blocks
3. Clear all mocks in `beforeEach`
4. Use descriptive test names (should + expected behavior)
5. Include both positive and negative test cases
