import { Link } from 'react-router-dom'
import Button from '@components/ui/Button'

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-sage-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-dusty-900 mb-6">Forgot Password</h2>
        <p className="text-dusty-600 mb-4">Enter your email to reset your password.</p>
        <input 
          type="email" 
          placeholder="Email address"
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />
        <Button className="w-full mb-4">Send Reset Link</Button>
        <Link to="/login" className="text-blush-600 hover:text-blush-700 text-sm">
          Back to Login
        </Link>
      </div>
    </div>
  )
}

export default ForgotPassword
