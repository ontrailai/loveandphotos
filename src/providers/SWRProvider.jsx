/**
 * SWR Provider
 * Configures SWR for the entire application
 */

import { SWRConfig } from 'swr'

const swrConfig = {
  // Global error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 1000,

  // Revalidation settings
  revalidateOnFocus: false,
  revalidateOnReconnect: true,

  // Deduplication
  dedupingInterval: 2000,

  // Loading timeout
  loadingTimeout: 10000,

  // Global error handler
  onError: (error, key) => {
    console.error(`SWR Error for ${key}:`, error)
  },

  // Global success handler
  onSuccess: (data, key) => {
    console.log(`SWR Success for ${key}: ${data?.length || 0} items`)
  }
}

export const SWRProvider = ({ children }) => {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}

export default SWRProvider