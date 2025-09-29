/**
 * Legacy Supabase client - now uses singleton to prevent duplicate instances
 * This file is kept for backward compatibility but now imports from the singleton
 */

import { supabase as supabaseClient } from './supabaseClientSingleton.js'

// Export the singleton instance for backward compatibility
export const supabase = supabaseClient
export default supabaseClient

// Re-export the getter function for flexibility
export { getSupabaseClient } from './supabaseClientSingleton.js'

// Additional exports for backward compatibility
export const supabasePublic = supabaseClient  // Public client alias
export const storage = supabaseClient.storage  // Storage API access

// Temporary db export for backward compatibility
// TODO: Migrate these to use the singleton client directly
export const db = {
  users: {
    async getProfile(userId) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    }
  }
}