/**
 * ImageErrorBoundary Component
 * Error boundary specifically for image-related errors
 */

import React from 'react'
import { ImageOffIcon } from 'lucide-react'

class ImageErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and any error reporting service
    console.error('Image Error Boundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo)

    this.setState({
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for image errors
      const { fallback, showDetails = false } = this.props

      if (fallback) {
        return fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg min-h-[200px]">
          <ImageOffIcon className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Image could not be loaded</p>
          {showDetails && this.state.errorInfo && (
            <details className="mt-2 text-xs text-gray-500">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-1 p-2 bg-white rounded text-left max-w-xs overflow-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ImageErrorBoundary