/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
    
    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
    // Optionally reload the page
    if (this.state.errorCount > 2) {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV

      return (
        <div className="min-h-screen bg-gradient-to-br from-blush-50 to-sage-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangleIcon className="w-10 h-10 text-red-500" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-dusty-900 mb-2">
                Oops! Something went wrong
              </h1>
              
              {/* Error Description */}
              <p className="text-dusty-600 mb-6">
                We're sorry for the inconvenience. The application encountered an unexpected error.
              </p>

              {/* Error Details (Development Only) */}
              {isDevelopment && this.state.error && (
                <div className="w-full mb-6">
                  <details className="text-left bg-gray-50 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Error Details (Development Mode)
                    </summary>
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 font-mono break-all">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo?.componentStack && (
                        <pre className="text-xs text-gray-500 overflow-auto max-h-32 bg-white p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button 
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blush-500 text-white rounded-lg hover:bg-blush-600 transition-colors"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Try Again
                </button>
                <Link 
                  to="/"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                >
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </div>

              {/* Reload Notice */}
              {this.state.errorCount > 1 && (
                <p className="text-xs text-dusty-500 mt-4">
                  If the problem persists, try refreshing the page or clearing your browser cache.
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
