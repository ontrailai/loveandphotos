/**
 * DevBanner Component
 * Shows a warning banner in development mode when environment variables are not properly configured
 */

import { useState, useEffect } from 'react'
import { XIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react'
import { validateEnvironment } from '@utils/validateEnv'

const DevBanner = () => {
  const [show, setShow] = useState(true)
  const [env, setEnv] = useState(null)

  useEffect(() => {
    const validation = validateEnvironment()
    setEnv(validation)

    // Auto-hide if everything is configured properly
    if (validation.isValid) {
      setTimeout(() => setShow(false), 5000)
    }
  }, [])

  // Don't show in production or if manually closed
  if (import.meta.env.PROD || !show || !env) {
    return null
  }

  // Don't show if everything is configured
  if (env.isValid) {
    return (
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                Environment properly configured
              </span>
            </div>
            <button 
              onClick={() => setShow(false)}
              className="text-green-600 hover:text-green-800"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const severity = env.missing.length > 0 ? 'error' : 'warning'
  const bgColor = severity === 'error' ? 'bg-red-50' : 'bg-yellow-50'
  const borderColor = severity === 'error' ? 'border-red-200' : 'border-yellow-200'
  const textColor = severity === 'error' ? 'text-red-800' : 'text-yellow-800'
  const iconColor = severity === 'error' ? 'text-red-600' : 'text-yellow-600'

  return (
    <div className={`${bgColor} border-b ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangleIcon className={`w-5 h-5 ${iconColor}`} />
            <span className={`text-sm ${textColor}`}>
              <strong>Development Mode:</strong> {env.getStatusMessage()}
            </span>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                console.log('Environment Status:', {
                  missing: env.missing,
                  placeholder: env.placeholder,
                  configured: env.configured
                })
                alert('Check console for environment details')
              }}
              className={`text-sm underline ${textColor} hover:opacity-80`}
            >
              View Details
            </a>
          </div>
          <button 
            onClick={() => setShow(false)}
            className={`${iconColor} hover:opacity-80`}
            title="Dismiss"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DevBanner
