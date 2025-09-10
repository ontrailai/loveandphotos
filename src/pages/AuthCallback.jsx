const AuthCallback = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-sage-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500 mx-auto mb-4"></div>
        <p className="text-dusty-600">Authenticating...</p>
      </div>
    </div>
  )
}

export default AuthCallback
