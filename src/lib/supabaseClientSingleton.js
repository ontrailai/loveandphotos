/**
 * Supabase Client Singleton
 * Ensures only one Supabase client instance exists across the entire application
 * Fixes "Multiple GoTrueClient instances detected" warnings
 */

import { createClient } from '@supabase/supabase-js'

// Use window object to persist client across HMR reloads
// This prevents "Multiple GoTrueClient instances detected" warnings during development
const SUPABASE_CLIENT_KEY = '__supabase_client_singleton__'

/**
 * Get the singleton Supabase client instance
 * @returns {Object} Supabase client instance
 */
export const getSupabaseClient = () => {
  // Check if client already exists on window (survives HMR)
  if (typeof window !== 'undefined' && window[SUPABASE_CLIENT_KEY]) {
    return window[SUPABASE_CLIENT_KEY]
  }

  // Create new client only if it doesn't exist
  let _client = null
  if (!_client) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Check if credentials are properly configured
    const isConfigured = supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project') &&
      !supabaseAnonKey.includes('your-anon-key')

    if (!isConfigured) {
      console.warn('⚠️ Supabase credentials not configured!')
      console.log('Please follow the setup guide to configure your environment variables.')
      console.log('1. Create a Supabase project at https://app.supabase.com')
      console.log('2. Add your credentials to the .env file')

      // Return mock client to prevent app crashes
      return createMockClient()
    }

    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: window.localStorage,
        storageKey: 'lovep-auth'
      }
    })

    // Store on window to survive HMR reloads
    if (typeof window !== 'undefined') {
      window[SUPABASE_CLIENT_KEY] = _client
    }
  }

  return _client
}

/**
 * Create a mock client for development when not configured
 * @returns {Object} Mock Supabase client
 */
const createMockClient = () => {
  return {
    auth: {
      signUp: () => Promise.reject(new Error('Supabase not configured. Please set up your environment variables.')),
      signIn: () => Promise.reject(new Error('Supabase not configured. Please set up your environment variables.')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: (callback) => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null
      }),
      resetPasswordForEmail: () => Promise.reject(new Error('Supabase not configured')),
      updateUser: () => Promise.reject(new Error('Supabase not configured'))
    },
    from: (table) => ({
      select: (columns, options) => {
        const mockQuery = {
          eq: (column, value) => mockQuery,
          overlaps: (column, value) => mockQuery,
          or: (conditions) => mockQuery,
          ilike: (column, value) => mockQuery,
          range: (from, to) => mockQuery,
          order: (column, options) => mockQuery,
          limit: (count) => mockQuery,
          single: () => Promise.resolve({
            data: null,
            error: new Error('Supabase not configured - mock client in use'),
            count: 0
          })
        }

        // Add promise execution that returns empty results
        mockQuery.then = (resolve, reject) => {
          return Promise.resolve({
            data: [],
            error: null,
            count: 0
          }).then(resolve, reject)
        }

        return mockQuery
      },
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        })
      })
    }),
    storage: {
      from: (bucket) => ({
        upload: () => Promise.reject(new Error('Supabase not configured')),
        download: () => Promise.reject(new Error('Supabase not configured')),
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.reject(new Error('Supabase not configured'))
      })
    },
    rpc: (functionName, params) => ({
      single: () => Promise.resolve({
        data: null,
        error: new Error('Supabase not configured - RPC calls not available')
      })
    })
  }
}

/**
 * Export the singleton instance as default export
 * Usage: import { supabase } from '@lib/supabaseClientSingleton'
 */
export const supabase = getSupabaseClient()

/**
 * Reset the singleton (for testing purposes only)
 * @private
 */
export const _resetSingleton = () => {
  if (typeof window !== 'undefined') {
    delete window[SUPABASE_CLIENT_KEY]
  }
}