/**
 * Privacy Utility - Talent Data Sanitization
 * Ensures PII (last name, email, phone) is never exposed to clients
 */

/**
 * Extracts first name only from full name
 * @param {string} fullName - Full name string
 * @returns {string} First name only
 */
export function getFirstNameOnly(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return 'Photographer'
  }

  // Split by spaces and take first part
  const parts = fullName.trim().split(/\s+/)
  return parts[0] || 'Photographer'
}

/**
 * Sanitizes talent data for client consumption
 * Removes all PII except first name
 * @param {Object} talent - Talent object with users relationship
 * @returns {Object} Sanitized talent data safe for clients
 */
export function sanitizeTalentForClient(talent) {
  if (!talent) return null

  // Create sanitized copy
  const sanitized = { ...talent }

  // If users relationship exists, sanitize it
  if (sanitized.users) {
    const firstName = getFirstNameOnly(sanitized.users.full_name)

    sanitized.users = {
      // Keep safe fields
      avatar_url: sanitized.users.avatar_url,
      id: sanitized.users.id,

      // Replace full_name with first name only
      full_name: firstName,
      first_name: firstName,

      // Explicitly remove PII
      email: undefined,
      phone: undefined,
      last_name: undefined
    }
  }

  return sanitized
}

/**
 * Sanitizes an array of talent data
 * @param {Array} talents - Array of talent objects
 * @returns {Array} Sanitized talents
 */
export function sanitizeTalentsForClient(talents) {
  if (!Array.isArray(talents)) return []
  return talents.map(sanitizeTalentForClient)
}

/**
 * Checks if current user has Studio Admin privileges
 * @param {Object} user - Current user object
 * @returns {boolean} True if user is Studio Admin
 */
export function isStudioAdmin(user) {
  return user?.role === 'admin' || user?.role === 'studio_admin'
}

/**
 * Conditionally sanitizes talent data based on user role
 * Studio Admins see full data, clients see sanitized data
 * @param {Object} talent - Talent object
 * @param {Object} currentUser - Current logged-in user
 * @returns {Object} Talent data (sanitized or full based on role)
 */
export function getTalentDataForUser(talent, currentUser) {
  if (isStudioAdmin(currentUser)) {
    return talent // Studio Admin sees everything
  }
  return sanitizeTalentForClient(talent) // Clients see sanitized data
}
