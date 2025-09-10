import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if credentials are properly configured
const isConfigured = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')

// Create a mock client for development when not configured
const createMockClient = () => {
  console.warn('⚠️ Supabase credentials not configured!')
  console.log('Please follow the setup guide to configure your environment variables.')
  console.log('1. Create a Supabase project at https://app.supabase.com')
  console.log('2. Add your credentials to the .env file')
  
  // Return mock client to prevent app crashes
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
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
        order: () => Promise.resolve({ data: [], error: null })
      }),
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
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
      })
    }),
    storage: {
      from: (bucket) => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        download: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '/placeholder-image.jpg' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    })
  }
}

// Export configured client or mock client
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,   // Re-enable auto refresh
        persistSession: true,      // Re-enable session persistence
        detectSessionInUrl: false, // Keep URL detection disabled
        storage: window.localStorage,  // Explicitly use localStorage
        storageKey: 'lovep-auth'      // Custom storage key
      }
    })
  : createMockClient()

// Export configuration status
export const isSupabaseConfigured = isConfigured

// Helper functions for common database operations
export const db = {
  // User operations
  users: {
    async getProfile(userId) {
      if (!isConfigured) {
        console.warn('Supabase not configured - returning mock data')
        return null
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    },

    async updateProfile(userId, updates) {
      if (!isConfigured) {
        console.warn('Supabase not configured')
        return null
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Photographer operations
  photographers: {
    async getProfile(userId) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('photographers')
        .select(`
          *,
          users!inner(full_name, email, phone, avatar_url),
          pay_tiers(name, hourly_rate, badge_color, perks)
        `)
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data
    },

    async getPublicProfile(photographerId) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('photographers')
        .select(`
          *,
          users!inner(full_name, avatar_url),
          pay_tiers(name, hourly_rate, badge_color),
          packages(*),
          portfolio_items(*),
          reviews(*)
        `)
        .eq('id', photographerId)
        .eq('is_public', true)
        .single()
      
      if (error) throw error
      return data
    },

    async search(filters = {}) {
      if (!isConfigured) return []
      
      let query = supabase
        .from('photographers')
        .select(`
          *,
          users!inner(full_name, avatar_url),
          pay_tiers(name, hourly_rate, badge_color)
        `)
        .eq('is_public', true)

      // Apply filters
      if (filters.date) {
        // Join with availability table
        query = query.eq('availability.date', filters.date)
          .eq('availability.is_available', true)
      }

      if (filters.minRating) {
        query = query.gte('average_rating', filters.minRating)
      }

      if (filters.maxPrice) {
        query = query.lte('pay_tiers.hourly_rate', filters.maxPrice)
      }

      if (filters.languages && filters.languages.length > 0) {
        query = query.contains('languages', filters.languages)
      }

      if (filters.specialties && filters.specialties.length > 0) {
        query = query.contains('specialties', filters.specialties)
      }

      // Sort by rating by default
      query = query.order('average_rating', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data
    },

    async updateProfile(photographerId, updates) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('photographers')
        .update(updates)
        .eq('id', photographerId)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },

  // Availability operations
  availability: {
    async getForPhotographer(photographerId, startDate, endDate) {
      if (!isConfigured) return []
      
      let query = supabase
        .from('availability')
        .select('*')
        .eq('photographer_id', photographerId)

      if (startDate) {
        query = query.gte('date', startDate)
      }

      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data, error } = await query.order('date')

      if (error) throw error
      return data
    },

    async upsert(photographerId, date, availability) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('availability')
        .upsert({
          photographer_id: photographerId,
          date,
          ...availability
        }, {
          onConflict: 'photographer_id,date'
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  // Bookings operations
  bookings: {
    async create(bookingData) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getById(bookingId) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:users!customer_id(full_name, email, phone),
          photographer:photographers(
            *,
            users!inner(full_name, email, phone)
          ),
          package:packages(*)
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error
      return data
    },

    async getForUser(userId, role = 'customer') {
      if (!isConfigured) return []
      
      let query = supabase
        .from('bookings')
        .select(`
          *,
          customer:users!customer_id(full_name, email),
          photographer:photographers(
            *,
            users!inner(full_name, avatar_url)
          ),
          package:packages(title, duration_minutes)
        `)

      if (role === 'customer') {
        query = query.eq('customer_id', userId)
      } else {
        // Get photographer's bookings
        const { data: photographerData } = await supabase
          .from('photographers')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (photographerData) {
          query = query.eq('photographer_id', photographerData.id)
        }
      }

      const { data, error } = await query.order('event_date', { ascending: false })

      if (error) throw error
      return data
    },

    async updateStatus(bookingId, status, paymentData = {}) {
      if (!isConfigured) return null
      
      const updates = {
        booking_status: status,
        ...paymentData
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  // Reviews operations
  reviews: {
    async create(reviewData) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async getForPhotographer(photographerId) {
      if (!isConfigured) return []
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviewer_id(full_name, avatar_url)
        `)
        .eq('photographer_id', photographerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  },

  // Portfolio operations
  portfolio: {
    async upload(photographerId, items) {
      if (!isConfigured) return []
      
      const { data, error } = await supabase
        .from('portfolio_items')
        .insert(items.map(item => ({
          ...item,
          photographer_id: photographerId
        })))
        .select()

      if (error) throw error
      return data
    },

    async delete(itemId) {
      if (!isConfigured) return
      
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    }
  },

  // Training operations
  training: {
    async getModules() {
      if (!isConfigured) return []
      
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .order('order_index')

      if (error) throw error
      return data
    },

    async getUserProgress(userId) {
      if (!isConfigured) return []
      
      const { data, error } = await supabase
        .from('training_status')
        .select(`
          *,
          module:training_modules(*)
        `)
        .eq('user_id', userId)

      if (error) throw error
      return data
    },

    async markComplete(userId, moduleId, score = null) {
      if (!isConfigured) return null
      
      const { data, error } = await supabase
        .from('training_status')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          is_complete: true,
          score,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_id'
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  }
}

// Storage helpers
export const storage = {
  async uploadAvatar(userId, file) {
    if (!isConfigured) {
      console.warn('Supabase not configured - cannot upload files')
      return '/placeholder-avatar.jpg'
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return publicUrl
  },

  async uploadPortfolioItem(photographerId, file) {
    if (!isConfigured) {
      console.warn('Supabase not configured - cannot upload files')
      return '/placeholder-portfolio.jpg'
    }
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${photographerId}-${Date.now()}.${fileExt}`
    const filePath = `${photographerId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('portfolios')
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('portfolios')
      .getPublicUrl(filePath)

    return publicUrl
  }
}

// Realtime subscriptions
export const realtime = {
  subscribeToBookings(photographerId, callback) {
    if (!isConfigured) {
      console.warn('Supabase not configured - realtime disabled')
      return { unsubscribe: () => {} }
    }
    
    return supabase
      .channel(`bookings:${photographerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `photographer_id=eq.${photographerId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToMessages(userId, callback) {
    if (!isConfigured) {
      console.warn('Supabase not configured - realtime disabled')
      return { unsubscribe: () => {} }
    }
    
    return supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}
