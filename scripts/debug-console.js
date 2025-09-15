// Add debugging to SafeAvatar component to see what URLs are actually being passed
// This will help us understand what's happening at runtime

console.log(`
🔍 DEBUGGING SAFEAVATAR RUNTIME BEHAVIOR

To debug this issue, we need to add console.log statements to SafeAvatar component
to see what URLs are actually being passed and why they're failing.

Add these debug lines to SafeAvatar.jsx around line 104:

  const validSrc = useMemo(() => {
    console.log('🔍 SafeAvatar DEBUG:', {
      originalSrc: src,
      imageError,
      forceInitials,
      validationResult: src ? isValidImageUrl(src) : null
    })

    if (!src || imageError || forceInitials) return null
    return isValidImageUrl(src) ? src : null
  }, [src, imageError, forceInitials])

And around line 112-120 in handleImageError:

  const handleImageError = useCallback((e) => {
    console.error('🚨 SafeAvatar image failed to load:', {
      url: src,
      name,
      alt,
      error: e.target?.error || e,
      networkError: e.target?.error?.message
    })
    setImageError(true)
    setImageLoading(false)
  }, [src, name, alt])

This will show us:
1. What URLs are actually being passed to SafeAvatar
2. Whether validation is passing or failing
3. If images are failing to load due to network issues
4. The exact error messages
`)