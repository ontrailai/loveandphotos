/**
 * Currency formatting and management utilities
 */

import { getCurrentLocale } from './i18n/client.js'

const STORAGE_KEY = 'lp_currency'
const EVENT_NAME = 'lp:currency-changed'

/**
 * List of supported currencies
 */
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' }
]

/**
 * Get current currency from localStorage or default to USD
 * @returns {string} Currency code (e.g., 'USD')
 */
export function getCurrentCurrency() {
  if (typeof window === 'undefined') return 'USD'

  try {
    return localStorage.getItem(STORAGE_KEY) || 'USD'
  } catch (error) {
    return 'USD'
  }
}

/**
 * Set current currency and persist to localStorage
 * @param {string} code - Currency code (e.g., 'USD')
 */
export function setCurrentCurrency(code) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, code)

    // Dispatch custom event for components to listen to
    const event = new CustomEvent(EVENT_NAME, { detail: { currency: code } })
    window.dispatchEvent(event)
  } catch (error) {
    console.warn('Failed to save currency:', error)
  }
}

/**
 * Format money amount using current locale and currency
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted money string
 */
export function formatMoney(amount, options = {}) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '—'
  }

  const locale = getCurrentLocale()
  const currency = getCurrentCurrency()

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    })

    return formatter.format(amount)
  } catch (error) {
    // Fallback formatting if Intl fails
    const currencyInfo = CURRENCIES.find(c => c.code === currency)
    const symbol = currencyInfo?.symbol || '$'
    return `${symbol}${amount.toFixed(2)}`
  }
}

/**
 * Get currency info by code
 * @param {string} code - Currency code
 * @returns {Object|null} Currency info object
 */
export function getCurrencyInfo(code) {
  return CURRENCIES.find(currency => currency.code === code) || null
}

/**
 * Add event listener for currency changes
 * @param {Function} callback - Function to call when currency changes
 * @returns {Function} Cleanup function to remove listener
 */
export function onCurrencyChange(callback) {
  if (typeof window === 'undefined') return () => {}

  const handler = (event) => callback(event.detail.currency)
  window.addEventListener(EVENT_NAME, handler)

  return () => window.removeEventListener(EVENT_NAME, handler)
}

/**
 * Format price with additional formatting options
 * @param {number} amount - Amount to format
 * @param {Object} options - Additional options
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, options = {}) {
  const {
    showDecimals = true,
    compact = false,
    ...restOptions
  } = options

  const formatOptions = {
    minimumFractionDigits: showDecimals ? 0 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
    ...restOptions
  }

  if (compact && amount >= 1000) {
    formatOptions.notation = 'compact'
    formatOptions.compactDisplay = 'short'
  }

  return formatMoney(amount, formatOptions)
}