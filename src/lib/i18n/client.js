/**
 * Lightweight client-side i18n helper
 * Provides locale management and basic translation scaffolding
 */

const STORAGE_KEY = 'lp_lang'
const EVENT_NAME = 'lp:locale-changed'
export const AUTO_TRANSLATE_KEY = 'lp_autotranslate'

/**
 * Get current locale from localStorage or browser default
 * @returns {string} Locale code (e.g., 'en-US')
 */
export function getCurrentLocale() {
  if (typeof window === 'undefined') return 'en-US'

  try {
    return localStorage.getItem(STORAGE_KEY) || navigator.language || 'en-US'
  } catch (error) {
    return 'en-US'
  }
}

/**
 * Set current locale and persist to localStorage
 * @param {string} locale - Locale code (e.g., 'en-US')
 */
export function setCurrentLocale(locale) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, locale)

    // Dispatch custom event for components to listen to
    const event = new CustomEvent(EVENT_NAME, { detail: { locale } })
    window.dispatchEvent(event)
  } catch (error) {
    console.warn('Failed to save locale:', error)
  }
}

/**
 * Basic translation function (scaffold)
 * Returns fallback text while full i18n is not implemented
 * @param {string} key - Translation key
 * @param {string} [fallback] - Fallback text if key not found
 * @returns {string} Translated text or fallback
 */
export function t(key, fallback = key) {
  // TODO: Implement full i18n lookup once translation files are added
  return fallback
}

/**
 * Get list of supported languages
 * @returns {Array} Array of language objects
 */
export function getSupportedLanguages() {
  return [
    { code: 'en-US', name: 'English (US)', nativeName: 'English' },
    { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español' },
    { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
    { code: 'fr-FR', name: 'French (France)', nativeName: 'Français' },
    { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch' },
    { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
    { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' }
  ]
}

/**
 * Get auto-translate setting from localStorage
 * @returns {boolean} Auto-translate enabled status
 */
export function getAutoTranslate() {
  if (typeof window === 'undefined') return false
  const v = window.localStorage.getItem(AUTO_TRANSLATE_KEY)
  return v === 'true'
}

/**
 * Set auto-translate setting and persist to localStorage
 * @param {boolean} enabled - Auto-translate enabled status
 */
export function setAutoTranslate(enabled) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTO_TRANSLATE_KEY, String(enabled))
  window.dispatchEvent(new CustomEvent('lp:auto-translate-changed', { detail: enabled }))
}

/**
 * Add event listener for locale changes
 * @param {Function} callback - Function to call when locale changes
 * @returns {Function} Cleanup function to remove listener
 */
export function onLocaleChange(callback) {
  if (typeof window === 'undefined') return () => {}

  const handler = (event) => callback(event.detail.locale)
  window.addEventListener(EVENT_NAME, handler)

  return () => window.removeEventListener(EVENT_NAME, handler)
}