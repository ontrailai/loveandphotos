# React useEffect Best Practices - Infinite Loop Prevention

## Critical Rules to Prevent Infinite Loops

### ✅ Rule 1: Depend on IDs, Not Objects

**Problem**: Objects are recreated on every render, even if their values haven't changed.

```javascript
// ❌ BAD - Will cause infinite loop
useEffect(() => {
  loadData()
}, [photographerProfile]) // Object reference changes every render

// ✅ GOOD - Only re-runs when ID actually changes
useEffect(() => {
  if (!photographerProfile?.id) return
  loadData()
}, [photographerProfile?.id])
```

### ✅ Rule 2: Don't Include Functions in Dependencies (Unless useCallback)

**Problem**: Functions are recreated on every render unless wrapped in useCallback.

```javascript
// ❌ BAD - fetchStats recreated every render
const fetchStats = async () => { /* ... */ }

useEffect(() => {
  fetchStats()
}, [fetchStats]) // Infinite loop!

// ✅ GOOD - Stable function reference
const fetchStats = useCallback(async () => {
  /* ... */
}, [photographerProfile?.id]) // Only recreate when ID changes

useEffect(() => {
  fetchStats()
}, [photographerProfile?.id]) // Don't include fetchStats itself
```

### ✅ Rule 3: Guard Early, Return Fast

**Problem**: Running logic before checking prerequisites.

```javascript
// ❌ BAD - No guards
useEffect(() => {
  const data = await fetch(`/api/user/${user.id}`) // Crashes if user is null
}, [user])

// ✅ GOOD - Guard first
useEffect(() => {
  if (!user?.id) {
    console.log('Waiting for user...')
    return
  }
  const data = await fetch(`/api/user/${user.id}`)
}, [user?.id])
```

### ✅ Rule 4: Always Set Loading to False in Finally Block

**Problem**: Errors leave loading state stuck on true.

```javascript
// ❌ BAD - Error leaves loading=true
const loadData = async () => {
  setLoading(true)
  const data = await fetch('/api/data')
  setLoading(false) // Never reached if error occurs
}

// ✅ GOOD - Always sets loading=false
const loadData = async () => {
  try {
    setLoading(true)
    const data = await fetch('/api/data')
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false) // Always executes
  }
}
```

### ✅ Rule 5: Avoid setState in Render Logic

**Problem**: Setting state during render causes infinite loops.

```javascript
// ❌ BAD - Triggers infinite re-renders
function Component() {
  const [count, setCount] = useState(0)
  setCount(count + 1) // Don't do this in render!
  return <div>{count}</div>
}

// ✅ GOOD - setState in useEffect or event handlers
function Component() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(count + 1) // Only on mount
  }, []) // Empty deps = run once

  return <div>{count}</div>
}
```

### ✅ Rule 6: Real-time Subscriptions Need Cleanup

**Problem**: Subscriptions without cleanup cause memory leaks and repeated subscriptions.

```javascript
// ❌ BAD - No cleanup
useEffect(() => {
  const channel = supabase.channel('my-channel')
    .on('*', () => { /* ... */ })
    .subscribe()
}, [userId])

// ✅ GOOD - Cleanup on unmount or dependency change
useEffect(() => {
  if (!userId) return

  const channel = supabase.channel('my-channel')
    .on('*', () => { /* ... */ })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [userId]) // Recreates subscription when userId changes
```

### ✅ Rule 7: Loading States Need Proper Checks

**Problem**: Not checking loading before rendering causes flashing or wrong states.

```javascript
// ❌ BAD - Shows wrong UI while loading
function Dashboard() {
  const { user, loading } = useAuth()

  if (!user) return <Navigate to="/login" /> // Redirects while loading!
  return <div>Welcome {user.name}</div>
}

// ✅ GOOD - Check loading first
function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" />
  return <div>Welcome {user.name}</div>
}
```

### ✅ Rule 8: Prevent Redirect Loops

**Problem**: Redirects trigger re-renders that trigger more redirects.

```javascript
// ❌ BAD - Can cause redirect loop
useEffect(() => {
  if (!user) {
    navigate('/login')
  }
}, [user, navigate]) // navigate causes re-render

// ✅ GOOD - Proper guards
useEffect(() => {
  if (loading) return
  if (!user) {
    navigate('/login', { replace: true }) // replace prevents back button loop
  }
}, [user, loading]) // Don't include navigate in deps
```

## Common Patterns

### Pattern 1: Fetch Data on Mount

```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await api.getData()
      setData(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  fetchData()
}, []) // Empty array = run once on mount
```

### Pattern 2: Fetch Data When ID Changes

```javascript
useEffect(() => {
  if (!userId) return

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const data = await api.getUser(userId)
      setUserData(data)
    } finally {
      setLoading(false)
    }
  }

  fetchUserData()
}, [userId]) // Re-fetch when userId changes
```

### Pattern 3: Real-time Subscription

```javascript
useEffect(() => {
  if (!userId) return

  const subscription = supabase
    .channel(`user-${userId}`)
    .on('*', (payload) => {
      console.log('Update:', payload)
      refetchData() // Trigger data refresh
    })
    .subscribe()

  return () => supabase.removeChannel(subscription)
}, [userId])
```

### Pattern 4: Debounced Auto-save

```javascript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    saveData(formData)
  }, 1000) // Wait 1 second after last change

  return () => clearTimeout(timeoutId)
}, [formData])
```

## Debugging Infinite Loops

### Step 1: Add Console Logs

```javascript
useEffect(() => {
  console.log('[ComponentName] useEffect running, deps:', {
    userId,
    loading,
    data
  })

  // ... your logic
}, [userId, loading, data])
```

### Step 2: Check Dependencies

Look for:
- Objects in dependencies (use IDs instead)
- Functions in dependencies (use useCallback or remove)
- Missing dependencies (React will warn you)

### Step 3: Verify No setState During Render

```javascript
// ❌ This will cause infinite loop
function Component() {
  const [count, setCount] = useState(0)

  if (count === 0) {
    setCount(1) // NO! setState during render
  }

  return <div>{count}</div>
}
```

## Summary Checklist

- [ ] Use IDs in dependencies, not entire objects
- [ ] Wrap functions in useCallback if used in dependencies
- [ ] Add early return guards (`if (!id) return`)
- [ ] Always use try/catch/finally for async operations
- [ ] Check `loading` before checking auth state
- [ ] Clean up subscriptions and timeouts
- [ ] Use `replace: true` for redirects
- [ ] Never call setState during render
- [ ] Add console logs for debugging
- [ ] Test hard page refresh, not just soft navigation

---

**Last Updated**: January 2025
**Project**: Love & Photos React + Supabase App
