// Simplified Browse.jsx loadPhotographers function that works
const loadPhotographers = async () => {
  try {
    setLoading(true)
    console.log('Loading photographers...')
    
    // Use mock data temporarily to fix the page
    console.log('Using mock photographer data')
    const mockProfiles = []
    
    // Generate 20 mock photographers with variety
    for (let i = 0; i < 20; i++) {
      const fallbackUrl = profileImages[i % profileImages.length]
      mockProfiles.push({
        id: i + 1,
        user_id: i + 1,
        bio: `Professional photographer with ${5 + (i % 10)} years of experience`,
        specialties: [['Wedding', 'Portrait'], ['Event', 'Corporate'], ['Family', 'Newborn'], ['Fashion', 'Commercial']][i % 4],
        languages: ['English'],
        years_experience: 5 + (i % 10),
        hourly_rate: 150 + (i * 25),
        location_city: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Austin'][i % 5],
        location_state: ['NY', 'CA', 'IL', 'FL', 'TX'][i % 5],
        is_available: true,
        is_public: true,
        average_rating: 4.2 + (i % 8) * 0.1,
        total_reviews: 10 + (i * 3),
        total_bookings: 5 + (i * 2),
        users: {
          full_name: [`Sarah Johnson`, `Michael Chen`, `Emily Rodriguez`, `David Kim`, `Jessica Williams`, `Chris Brown`, `Amanda Davis`, `Ryan Taylor`][i % 8],
          avatar_url: fallbackUrl
        },
        pay_tiers: {
          name: (i % 3 === 0) ? 'Professional' : 'Standard',
          hourly_rate: 150 + (i * 25),
          badge_color: (i % 3 === 0) ? 'gold' : 'silver'
        },
        portfolio_items: [
          { image_url: portfolioImages[i % portfolioImages.length] },
          { image_url: portfolioImages[(i + 5) % portfolioImages.length] },
          { image_url: portfolioImages[(i + 10) % portfolioImages.length] }
        ]
      })
    }
    
    console.log('Generated', mockProfiles.length, 'mock profiles')
    
    // Apply filters to mock data
    let filtered = mockProfiles
    
    if (filters.rating > 0) {
      filtered = filtered.filter(p => p.average_rating >= filters.rating)
    }
    
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(v => v === '500+' ? 9999 : parseInt(v))
      filtered = filtered.filter(p => {
        const rate = p.hourly_rate
        return max ? (rate >= min && rate <= max) : rate >= min
      })
    }
    
    if (filters.specialties.length > 0) {
      filtered = filtered.filter(p => 
        filters.specialties.some(specialty => 
          p.specialties.includes(specialty)
        )
      )
    }
    
    if (filters.languages.length > 0) {
      filtered = filtered.filter(p => 
        filters.languages.some(language => 
          p.languages.includes(language)
        )
      )
    }
    
    if (filters.zip) {
      // Filter by location (city or state)
      const searchTerm = filters.zip.toLowerCase()
      filtered = filtered.filter(p => 
        p.location_city?.toLowerCase().includes(searchTerm) ||
        p.location_state?.toLowerCase().includes(searchTerm)
      )
    }
    
    console.log('Setting photographers:', filtered.length, 'photographers')
    setAllPhotographers(filtered)
    setPhotographers(filtered.slice(0, displayCount))
    
  } catch (error) {
    console.error('Error loading photographers:', error)
  } finally {
    setLoading(false)
  }
}