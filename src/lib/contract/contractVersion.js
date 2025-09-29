/**
 * Contract Version Management
 * Handles contract versioning and hash generation for audit trail
 */

import { getRawContractTemplate } from './contractText.js'

/**
 * Current contract version identifier
 * MUST be incremented whenever contract text changes
 */
export const CONTRACT_VERSION = 'LNP-Contract-v1.0'

/**
 * Generates SHA-256 hash of contract template for integrity verification
 * @param {string} contractText - The contract text to hash
 * @returns {Promise<string>} The SHA-256 hash as a hex string
 */
export async function generateContractHash(contractText) {
  const encoder = new TextEncoder()
  const data = encoder.encode(contractText)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Gets the pre-computed hash for the current contract version
 * This is used for server-side validation
 * @returns {Promise<string>} The SHA-256 hash of the current contract template
 */
export async function getCurrentContractHash() {
  const template = getRawContractTemplate()
  return await generateContractHash(template)
}

/**
 * Validates that a provided hash matches the current contract version
 * @param {string} providedHash - Hash provided by client
 * @returns {Promise<boolean>} True if hashes match
 */
export async function validateContractHash(providedHash) {
  const currentHash = await getCurrentContractHash()
  return providedHash === currentHash
}

/**
 * Contract version history for reference
 * When updating contract text, add new version here
 */
export const CONTRACT_VERSION_HISTORY = [
  {
    version: 'LNP-Contract-v1.0',
    releaseDate: '2025-09-28',
    description: 'Initial Love & Photos contract version',
    changes: ['Initial contract text', 'Love & Photos branding', 'Standard terms and conditions']
  }
  // Future versions will be added here
  // {
  //   version: 'LNP-Contract-v1.1',
  //   releaseDate: '2025-XX-XX',
  //   description: 'Updated payment terms',
  //   changes: ['Modified section 2', 'Updated late fee structure']
  // }
]

/**
 * Gets contract version metadata
 * @param {string} version - Version identifier (optional, defaults to current)
 * @returns {Object|null} Version metadata or null if not found
 */
export function getContractVersionInfo(version = CONTRACT_VERSION) {
  return CONTRACT_VERSION_HISTORY.find(v => v.version === version) || null
}