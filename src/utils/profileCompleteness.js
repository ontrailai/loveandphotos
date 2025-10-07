/**
 * Profile Completeness Utility
 * Checks if a photographer profile meets all requirements for public visibility
 *
 * Requirements:
 * - Profile photo (users.avatar_url)
 * - Bio: 500+ characters OR 100+ words
 * - Portfolio: 10+ images
 * - Languages: At least 1 language
 * - Address: City and ZIP code (street address is optional)
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
 * @param {Object} photographerProfile - Photographer profile object (from photographers table)
 * @param {Object} userProfile - User profile object (from users table with avatar_url)
 * @returns {Object} - { isComplete: boolean, missingFields: string[], completionPercentage: number }
 */
export function isProfileComplete(photographerProfile, userProfile) {
  const missingFields = []
  const requirements = []

  // Requirement 1: Profile photo (avatar_url is stored in users table)
  const hasAvatar = userProfile?.avatar_url && userProfile.avatar_url.trim() !== ''

  requirements.push({
    name: 'Profile Photo',
    met: hasAvatar,
    field: 'avatar_url'
  })
  if (!hasAvatar) {
    missingFields.push('Profile photo')
  }

  // Requirement 2: Bio (500 characters OR 100 words)
  const bioLength = photographerProfile?.bio ? photographerProfile.bio.length : 0
  const bioWordCount = countWords(photographerProfile?.bio || '')
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
  const portfolioCount = Array.isArray(photographerProfile?.portfolio_images)
    ? photographerProfile.portfolio_images.length
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
  const languagesCount = Array.isArray(photographerProfile?.languages)
    ? photographerProfile.languages.length
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

  // Requirement 5: Complete address (city and ZIP required, street optional)
  const hasCity = photographerProfile?.city && photographerProfile.city.trim() !== ''
  const hasZip = photographerProfile?.zip_code && photographerProfile.zip_code.trim() !== ''
  const addressMet = hasCity && hasZip

  requirements.push({
    name: 'Address',
    met: addressMet,
    field: 'address',
    current: [hasCity ? '✓' : '✗', hasZip ? '✓' : '✗'].join(' '),
    required: 'City, ZIP'
  })

  if (!addressMet) {
    const missingAddressParts = []
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
