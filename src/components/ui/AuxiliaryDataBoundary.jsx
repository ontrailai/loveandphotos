/**
 * AuxiliaryDataBoundary Component
 * Error boundary specifically designed for non-critical auxiliary data
 * Prevents auxiliary data failures from blocking main UI rendering
 */

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class AuxiliaryDataBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging but don't throw it up to parent
    console.warn('Auxiliary data component error (non-blocking):', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    })

    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    if (this.state.retryCount < 2) { // Limit retries to prevent infinite loops
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      })
    }
  }

  render() {
    const { hasError, retryCount } = this.state
    const { children, fallback, showErrorUI = true, componentName = 'auxiliary component' } = this.props

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback
      }

      // If showErrorUI is false, render nothing (silent failure)
      if (!showErrorUI) {
        return null
      }

      // Default fallback UI for auxiliary data failures
      return (
        <div className="auxiliary-data-error p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              {componentName} temporarily unavailable
            </span>
            {retryCount < 2 && (
              <button
                onClick={this.handleRetry}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                type="button"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

/**
 * Hook version for functional components
 * Provides auxiliary data error handling with timeout
 */
export const useAuxiliaryData = (fetchFunction, timeout = 6000) => {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    let isMounted = true
    let timeoutId

    const fetchWithTimeout = async () => {
      try {
        setLoading(true)
        setError(null)

        // Set timeout for auxiliary data
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auxiliary data fetch timed out after', timeout, 'ms')
            setError(new Error('Request timed out'))
            setLoading(false)
          }
        }, timeout)

        const result = await fetchFunction()

        if (isMounted) {
          clearTimeout(timeoutId)
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          clearTimeout(timeoutId)
          console.warn('Auxiliary data fetch failed (non-blocking):', err.message)
          setError(err)
          setLoading(false)
        }
      }
    }

    fetchWithTimeout()

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [fetchFunction, timeout])

  return { data, loading, error }
}

/**
 * Wrapper component for auxiliary data with built-in timeout and error handling
 */
export const AuxiliaryDataWrapper = ({
  children,
  fetchFunction,
  timeout = 6000,
  loadingFallback = null,
  errorFallback = null,
  componentName = 'auxiliary data'
}) => {
  const { data, loading, error } = useAuxiliaryData(fetchFunction, timeout)

  if (loading) {
    return loadingFallback || (
      <div className="auxiliary-data-loading p-3 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    )
  }

  if (error) {
    return (
      <AuxiliaryDataBoundary
        fallback={errorFallback}
        componentName={componentName}
        showErrorUI={true}
      >
        {null}
      </AuxiliaryDataBoundary>
    )
  }

  return (
    <AuxiliaryDataBoundary componentName={componentName}>
      {children(data)}
    </AuxiliaryDataBoundary>
  )
}

export default AuxiliaryDataBoundary