/**
 * Profile Completeness Utility
 * Checks if a photographer profile meets all requirements for public visibility
 *
 * Requirements:
 * - Profile photo (users.avatar_url)
 * - Bio: 500+ characters OR 100+ words
 * - Portfolio: 10+ images
 * - Languages: At least 1 language
 * - Address: Complete address (street, city, zip)
 */

/**
 * Count words in a string
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Check if a photographer profile is complete
 * @param {Object} profile - Photographer profile object
 * @param {Object} user - User object with avatar_url
 * @returns {Object} - { isComplete: boolean, missingFields: string[], completionPercentage: number }
 */
export function isProfileComplete(profile, user) {
  const missingFields = []
  const requirements = []

  // Requirement 1: Profile photo
  requirements.push({
    name: 'Profile Photo',
    met: user?.avatar_url && user.avatar_url.trim() !== '',
    field: 'avatar_url'
  })
  if (!user?.avatar_url || user.avatar_url.trim() === '') {
    missingFields.push('Profile photo')
  }

  // Requirement 2: Bio (500 characters OR 100 words)
  const bioLength = profile?.bio ? profile.bio.length : 0
  const bioWordCount = countWords(profile?.bio || '')
  const bioMet = bioLength >= 500 || bioWordCount >= 100
  requirements.push({
    name: 'Bio',
    met: bioMet,
    field: 'bio',
    current: `${bioLength} chars, ${bioWordCount} words`,
    required: '500 characters or 100 words'
  })
  if (!bioMet) {
    missingFields.push(`Bio (${bioLength}/500 characters or ${bioWordCount}/100 words)`)
  }

  // Requirement 3: Portfolio images (minimum 10)
  const portfolioCount = Array.isArray(profile?.portfolio_images)
    ? profile.portfolio_images.length
    : 0
  const portfolioMet = portfolioCount >= 10
  requirements.push({
    name: 'Portfolio Images',
    met: portfolioMet,
    field: 'portfolio_images',
    current: portfolioCount,
    required: 10
  })
  if (!portfolioMet) {
    missingFields.push(`Portfolio images (${portfolioCount}/10)`)
  }

  // Requirement 4: Languages (at least 1)
  const languagesCount = Array.isArray(profile?.languages)
    ? profile.languages.length
    : 0
  const languagesMet = languagesCount > 0
  requirements.push({
    name: 'Languages',
    met: languagesMet,
    field: 'languages',
    current: languagesCount,
    required: 1
  })
  if (!languagesMet) {
    missingFields.push('At least one language')
  }

  // Requirement 5: Complete address
  const hasStreet = profile?.address_line1 && profile.address_line1.trim() !== ''
  const hasCity = profile?.city && profile.city.trim() !== ''
  const hasZip = profile?.zip_code && profile.zip_code.trim() !== ''
  const addressMet = hasStreet && hasCity && hasZip

  requirements.push({
    name: 'Address',
    met: addressMet,
    field: 'address',
    current: [hasStreet ? '✓' : '✗', hasCity ? '✓' : '✗', hasZip ? '✓' : '✗'].join(' '),
    required: 'Street, City, ZIP'
  })

  if (!addressMet) {
    const missingAddressParts = []
    if (!hasStreet) missingAddressParts.push('street address')
    if (!hasCity) missingAddressParts.push('city')
    if (!hasZip) missingAddressParts.push('ZIP code')
    missingFields.push(`Address (${missingAddressParts.join(', ')})`)
  }

  // Calculate completion percentage
  const metCount = requirements.filter(r => r.met).length
  const totalCount = requirements.length
  const completionPercentage = Math.round((metCount / totalCount) * 100)

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    requirements,
    completionPercentage,
    completedCount: metCount,
    totalCount
  }
}

/**
 * Get a user-friendly message about profile completeness
 */
export function getProfileCompletenessMessage(completeness) {
  if (completeness.isComplete) {
    return {
      type: 'success',
      title: 'Profile Complete',
      message: 'Your profile meets all requirements for public visibility.'
    }
  }

  const { missingFields, completionPercentage } = completeness

  return {
    type: 'warning',
    title: `Profile ${completionPercentage}% Complete`,
    message: `Complete the following to appear in search:\n• ${missingFields.join('\n• ')}`
  }
}

/**
 * Validate if profile can be set to visible_in_search=true
 * Returns error message if validation fails, null if passes
 */
export function validateVisibilityToggle(profile, user) {
  const completeness = isProfileComplete(profile, user)

  if (!completeness.isComplete) {
    return {
      canToggle: false,
      error: 'Profile cannot be made public until all required fields are complete',
      missingFields: completeness.missingFields,
      hint: `Complete ${completeness.missingFields.length} more requirement${completeness.missingFields.length > 1 ? 's' : ''}`
    }
  }

  return {
    canToggle: true,
    error: null,
    missingFields: []
  }
}

export default isProfileComplete
