/**
 * Batched Supabase Query Utility
 * Prevents oversized URL errors by chunking large .in() queries into manageable batches
 *
 * Addresses the issue where queries with 200+ IDs create URLs >8KB, causing net::ERR_FAILED
 * Safe batch size of 50 ensures URLs stay under 2KB for cross-browser compatibility
 */

/**
 * Chunks an array into smaller batches
 * @param {Array} array - Array to chunk
 * @param {number} batchSize - Size of each chunk
 * @returns {Array[]} Array of chunks
 */
function chunkArray(array, batchSize) {
  if (!Array.isArray(array)) {
    throw new Error('First argument must be an array')
  }

  if (batchSize <= 0) {
    throw new Error('Batch size must be greater than 0')
  }

  const chunks = []
  for (let i = 0; i < array.length; i += batchSize) {
    chunks.push(array.slice(i, i + batchSize))
  }
  return chunks
}

/**
 * Executes a single batch query with retry logic
 * @param {Function} queryFn - Function that executes the Supabase query
 * @param {Array} batch - Array of IDs for this batch
 * @param {number} retryAttempts - Number of retry attempts remaining
 * @returns {Promise<Object>} Query result with success/error status
 */
async function executeBatchWithRetry(queryFn, batch, retryAttempts = 2) {
  const maxRetryDelay = 2000 // 2 seconds max delay

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      const result = await queryFn(batch)

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid query result structure')
      }

      return {
        success: true,
        data: result.data || [],
        error: result.error || null,
        batchSize: batch.length,
        attempt: attempt + 1
      }

    } catch (error) {
      const isLastAttempt = attempt === retryAttempts

      if (isLastAttempt) {
        console.error(`Batch query failed after ${attempt + 1} attempts:`, {
          error: error.message,
          batchSize: batch.length,
          sampleIds: batch.slice(0, 3)
        })

        return {
          success: false,
          data: [],
          error: error.message,
          batchSize: batch.length,
          attempt: attempt + 1
        }
      }

      // Wait before retry with exponential backoff
      const delay = Math.min(250 * Math.pow(2, attempt), maxRetryDelay)
      await new Promise(resolve => setTimeout(resolve, delay))

      console.warn(`Batch query attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message)
    }
  }
}

/**
 * Executes batched Supabase queries to prevent oversized URL errors
 *
 * @param {Object} supabaseClient - Initialized Supabase client
 * @param {string} tableName - Name of the table to query
 * @param {string} selectFields - Fields to select (e.g., 'id, name, email')
 * @param {string} filterColumn - Column name for the .in() filter (e.g., 'user_id')
 * @param {Array} ids - Array of IDs to filter by
 * @param {Object} options - Configuration options
 * @param {number} options.batchSize - Number of IDs per batch (default: 50)
 * @param {number} options.retryAttempts - Number of retry attempts per batch (default: 2)
 * @param {boolean} options.deduplicateResults - Remove duplicate records (default: true)
 * @param {string} options.deduplicateBy - Field to deduplicate by (default: 'id')
 * @returns {Promise<Object>} Combined results from all batches
 */
export async function fetchInBatches(
  supabaseClient,
  tableName,
  selectFields,
  filterColumn,
  ids,
  options = {}
) {
  const {
    batchSize = 50,
    retryAttempts = 2,
    deduplicateResults = true,
    deduplicateBy = 'id'
  } = options

  // Input validation
  if (!supabaseClient) {
    throw new Error('Supabase client is required')
  }

  if (!tableName || typeof tableName !== 'string') {
    throw new Error('Table name must be a non-empty string')
  }

  if (!selectFields || typeof selectFields !== 'string') {
    throw new Error('Select fields must be a non-empty string')
  }

  if (!filterColumn || typeof filterColumn !== 'string') {
    throw new Error('Filter column must be a non-empty string')
  }

  if (!Array.isArray(ids)) {
    throw new Error('IDs must be an array')
  }

  // Handle empty input
  if (ids.length === 0) {
    return {
      data: [],
      error: null,
      batchResults: [],
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0
    }
  }

  // Remove duplicates and filter out null/undefined values
  const uniqueIds = Array.from(new Set(ids.filter(id => id != null)))

  if (uniqueIds.length === 0) {
    console.warn('All IDs were null/undefined or duplicates')
    return {
      data: [],
      error: null,
      batchResults: [],
      totalBatches: 0,
      successfulBatches: 0,
      failedBatches: 0
    }
  }

  // Warn about potential performance issues
  if (uniqueIds.length > 500) {
    console.warn(`Large batch query detected: ${uniqueIds.length} IDs. Consider pagination or caching.`)
  }

  // Create batches
  const batches = chunkArray(uniqueIds, batchSize)
  console.log(`Executing batched query: ${uniqueIds.length} total IDs in ${batches.length} batches`)

  // Define query function for each batch
  const executeQuery = async (batch) => {
    return await supabaseClient
      .from(tableName)
      .select(selectFields)
      .in(filterColumn, batch)
  }

  // Execute all batches in parallel
  const startTime = Date.now()
  const batchPromises = batches.map(batch =>
    executeBatchWithRetry(executeQuery, batch, retryAttempts)
  )

  const batchResults = await Promise.all(batchPromises)
  const executionTime = Date.now() - startTime

  // Analyze results
  const successfulBatches = batchResults.filter(result => result.success)
  const failedBatches = batchResults.filter(result => !result.success)

  // Combine all successful data
  let combinedData = []
  for (const result of successfulBatches) {
    if (result.data && Array.isArray(result.data)) {
      combinedData.push(...result.data)
    }
  }

  // Deduplicate results if requested
  if (deduplicateResults && combinedData.length > 0) {
    const seen = new Set()
    combinedData = combinedData.filter(item => {
      const key = item[deduplicateBy]
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  // Check for partial failures
  const hasPartialFailure = failedBatches.length > 0 && successfulBatches.length > 0
  const hasCompleteFailure = failedBatches.length === batchResults.length

  // Build error message for failures
  let error = null
  if (hasCompleteFailure) {
    error = `All ${failedBatches.length} batches failed. Sample error: ${failedBatches[0]?.error}`
  } else if (hasPartialFailure) {
    error = `${failedBatches.length} of ${batchResults.length} batches failed. ${combinedData.length} records retrieved successfully.`
  }

  // Log performance metrics
  console.log(`Batch query completed:`, {
    totalIds: uniqueIds.length,
    totalBatches: batches.length,
    successfulBatches: successfulBatches.length,
    failedBatches: failedBatches.length,
    recordsRetrieved: combinedData.length,
    executionTime: `${executionTime}ms`,
    avgBatchTime: `${Math.round(executionTime / batches.length)}ms`
  })

  return {
    data: combinedData,
    error,
    batchResults,
    totalBatches: batches.length,
    successfulBatches: successfulBatches.length,
    failedBatches: failedBatches.length,
    executionTime,
    recordsRetrieved: combinedData.length,
    hadPartialFailure: hasPartialFailure,
    hadCompleteFailure: hasCompleteFailure
  }
}

/**
 * Convenience wrapper for fetching photographer data in batches
 * Specifically addresses the Browse.jsx oversized URL issue
 */
export async function fetchPhotographersInBatches(supabaseClient, userIds, selectFields = '*') {
  return await fetchInBatches(
    supabaseClient,
    'photographers',
    selectFields,
    'user_id',
    userIds,
    {
      batchSize: 50, // Safe URL size: 50 UUIDs ≈ 1.8KB
      retryAttempts: 2,
      deduplicateResults: true,
      deduplicateBy: 'user_id'
    }
  )
}

/**
 * Convenience wrapper for fetching photographer trust metrics
 * Used by Browse.jsx to replace the oversized .in() query
 */
export async function fetchPhotographerTrustMetrics(supabaseClient, userIds) {
  const selectFields = 'user_id, acceptance_rate, avg_response_time_minutes, has_minimum_data, manual_override_acceptance_rate, manual_override_response_time'

  return await fetchPhotographersInBatches(supabaseClient, userIds, selectFields)
}

/**
 * Validates URL length for debugging purposes
 * Helps identify queries that would exceed browser limits
 */
export function validateQueryUrl(baseUrl, tableName, selectFields, filterColumn, ids) {
  const queryParams = new URLSearchParams({
    select: selectFields,
    [filterColumn]: `in.(${ids.join(',')})`
  })

  const fullUrl = `${baseUrl}/rest/v1/${tableName}?${queryParams.toString()}`
  const urlLength = fullUrl.length

  const isSafe = urlLength < 2000 // Conservative limit
  const isWarning = urlLength >= 2000 && urlLength < 4000
  const isDangerous = urlLength >= 4000

  return {
    url: fullUrl,
    length: urlLength,
    isSafe,
    isWarning,
    isDangerous,
    recommendation: isDangerous ? 'Use batching required' :
                   isWarning ? 'Consider batching' : 'Safe for direct query'
  }
}

export default {
  fetchInBatches,
  fetchPhotographersInBatches,
  fetchPhotographerTrustMetrics,
  validateQueryUrl,
  chunkArray
}