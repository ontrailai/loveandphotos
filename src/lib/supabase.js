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
  },
  photographers: {
    async getProfile(userId) {
      const { data, error} = await supabaseClient
        .from('photographers')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Return null if not found instead of throwing
      if (error && error.code === 'PGRST116') {
        return null
      }
      if (error) throw error
      return data
    },

    /**
     * Safely delete a photographer profile and all associated data
     * @param {string} userId - The user ID of the photographer
     * @returns {Promise<{success: boolean, message: string, details?: any}>}
     */
    async deleteProfile(userId) {
      const startTime = performance.now()
      console.log('[deletePhotographerProfile] Starting deletion for user:', userId)

      try {
        // Step 1: Check for active bookings
        const { data: activeBookings, error: bookingsError } = await supabaseClient
          .from('bookings')
          .select('id, booking_status')
          .eq('photographer_id', userId)
          .in('booking_status', ['pending', 'confirmed', 'in_progress'])

        if (bookingsError) {
          console.error('[deletePhotographerProfile] Error checking bookings:', bookingsError)
          throw new Error('Failed to verify active bookings')
        }

        if (activeBookings && activeBookings.length > 0) {
          console.warn('[deletePhotographerProfile] Active bookings found:', activeBookings.length)
          return {
            success: false,
            message: `Cannot delete profile. You have ${activeBookings.length} active booking(s). Please complete or cancel them first.`,
            details: { activeBookings: activeBookings.length }
          }
        }

        // Step 2: Get photographer profile to find storage files
        const { data: photographerProfile, error: profileError } = await supabaseClient
          .from('photographers')
          .select('portfolio_images, user_id')
          .eq('user_id', userId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[deletePhotographerProfile] Error fetching profile:', profileError)
          throw new Error('Failed to fetch photographer profile')
        }

        // Step 3: Delete portfolio images from storage
        if (photographerProfile?.portfolio_images && Array.isArray(photographerProfile.portfolio_images)) {
          console.log('[deletePhotographerProfile] Deleting portfolio images:', photographerProfile.portfolio_images.length)

          for (const imageUrl of photographerProfile.portfolio_images) {
            try {
              // Extract file path from URL
              const urlParts = imageUrl.split('/photographer-portfolios/')
              if (urlParts.length > 1) {
                const filePath = urlParts[1]
                const { error: storageError } = await supabaseClient.storage
                  .from('photographer-portfolios')
                  .remove([filePath])

                if (storageError) {
                  console.warn('[deletePhotographerProfile] Storage delete warning:', storageError)
                  // Continue even if storage deletion fails
                }
              }
            } catch (storageErr) {
              console.warn('[deletePhotographerProfile] Failed to delete image:', storageErr)
              // Continue with deletion even if some images fail
            }
          }
        }

        // Step 4: Delete from photographer_availability table
        const { error: availabilityError } = await supabaseClient
          .from('photographer_availability')
          .delete()
          .eq('photographer_id', userId)

        if (availabilityError) {
          console.warn('[deletePhotographerProfile] Availability delete warning:', availabilityError)
          // Continue even if no availability records exist
        }

        // Step 5: Delete from photographers table
        const { error: deleteError } = await supabaseClient
          .from('photographers')
          .delete()
          .eq('user_id', userId)

        if (deleteError) {
          console.error('[deletePhotographerProfile] Error deleting photographer:', deleteError)
          throw new Error('Failed to delete photographer profile from database')
        }

        // Step 6: Optionally delete user record (if single-role system)
        // Commenting out to preserve auth.users - photographer can still log in as customer
        /*
        const { error: userDeleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('id', userId)

        if (userDeleteError) {
          console.error('[deletePhotographerProfile] Error deleting user:', userDeleteError)
          // Don't throw - photographer profile is already deleted
        }
        */

        const endTime = performance.now()
        console.log(`[deletePhotographerProfile] ✅ Deletion completed in ${(endTime - startTime).toFixed(2)}ms`)

        return {
          success: true,
          message: 'Your photographer profile has been permanently deleted.',
          details: {
            deletedImages: photographerProfile?.portfolio_images?.length || 0,
            executionTime: (endTime - startTime).toFixed(2) + 'ms'
          }
        }
      } catch (error) {
        console.error('[deletePhotographerProfile] ❌ Fatal error:', error)
        return {
          success: false,
          message: error.message || 'An unexpected error occurred during profile deletion',
          details: { error: error.message }
        }
      }
    }
  }
}