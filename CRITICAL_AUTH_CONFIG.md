# CRITICAL: Authentication Configuration That Works
## DO NOT MODIFY WITHOUT CAREFUL TESTING

### Working Sign-In Flow Configuration
**Last Working: 2025-09-13**

## 1. Dashboard Component Rules (src/pages/customer/Dashboard.jsx)
### ❌ NEVER DO THIS:
```javascript
// This BREAKS React hooks and causes blank page
if (loading) {
  return <LoadingSpinner />
}
// hooks used after...
```

### ✅ ALWAYS DO THIS:
```javascript
// Use ternary operator to maintain hook order
return loading ? (
  <LoadingSpinner />
) : (
  <DashboardContent />
)
```

## 2. ProtectedRoute Component (src/contexts/AuthContext.jsx)
### Current Working Configuration:
- Only check for `user` existence, NOT `profile`
- Profile might still be loading - that's OK
- Role checks only apply if profile is loaded

```javascript
// Working code:
if (!loading) {
  if (!user) {  // Only check user, not profile
    navigate('/login')
    return
  }
  
  // Role check only if profile exists
  if (requireRole && profile && !hasRole(requireRole)) {
    // handle role mismatch
  }
}
```

## 3. Sign-In Function (src/contexts/AuthContext.jsx)
### Working Flow:
1. Sign in with Supabase
2. Set user immediately
3. Fetch profile data
4. Navigate with setTimeout to ensure state updates
5. Fallback navigation even if profile fetch fails

## 4. Login Page (src/pages/Login.jsx)
### Visual Configuration:
- Text position: `mb-64` to clear balloon decorations in background
- Password visibility toggle implemented with eye icon
- Loading states handled properly

## Common Pitfalls to Avoid:
1. **NEVER use early returns in components after hooks are defined**
2. **NEVER require both user AND profile for basic authentication**
3. **NEVER remove the setTimeout in navigation (ensures state updates)**
4. **NEVER modify hook order with conditional logic**

## Testing Checklist for Auth Changes:
- [ ] Login redirects to dashboard
- [ ] No blank pages after login
- [ ] No React hooks errors in console
- [ ] Loading states display properly
- [ ] Profile loads after navigation

## Related Files:
- `/src/pages/Login.jsx`
- `/src/pages/customer/Dashboard.jsx`
- `/src/contexts/AuthContext.jsx`
- `/src/components/Layout.jsx`

## Console Errors That Indicate Breakage:
- "Rendered fewer hooks than expected"
- "Cannot destructure property 'basename'"
- Any React hooks violation errors

---
⚠️ **If auth breaks again, check this file first!**