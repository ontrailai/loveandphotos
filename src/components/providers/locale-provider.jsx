/**
 * Locale Provider - Context for managing language and currency settings
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentLocale, setCurrentLocale, onLocaleChange, getAutoTranslate } from '@/lib/i18n/client'
import { getCurrentCurrency, setCurrentCurrency, onCurrencyChange } from '@/lib/currency'

const LocaleContext = createContext({
  locale: 'en-US',
  currency: 'USD',
  setLocale: () => {},
  setCurrency: () => {},
})

/**
 * Locale Provider Component
 * Manages global locale and currency state with persistence
 */
export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => getCurrentLocale())
  const [currency, setCurrencyState] = useState(() => getCurrentCurrency())

  // Initialize locale and currency from localStorage on mount
  useEffect(() => {
    setLocaleState(getCurrentLocale())
    setCurrencyState(getCurrentCurrency())
  }, [])

  // Listen for locale changes from other parts of the app
  useEffect(() => {
    const unsubscribeLocale = onLocaleChange((newLocale) => {
      setLocaleState(newLocale)
    })

    const unsubscribeCurrency = onCurrencyChange((newCurrency) => {
      setCurrencyState(newCurrency)
    })

    // Listen for auto-translate changes (demo)
    const onAutoTranslateChange = (e) => {
      // This is where you would trigger re-rendering or state updates
      // based on the auto-translate setting change
      console.log('Auto-translate setting changed:', e.detail)
    }

    window.addEventListener('lp:auto-translate-changed', onAutoTranslateChange)

    return () => {
      unsubscribeLocale()
      unsubscribeCurrency()
      window.removeEventListener('lp:auto-translate-changed', onAutoTranslateChange)
    }
  }, [])

  // Handler functions that update both state and localStorage
  const handleSetLocale = (newLocale) => {
    setCurrentLocale(newLocale)
    setLocaleState(newLocale)
  }

  const handleSetCurrency = (newCurrency) => {
    setCurrentCurrency(newCurrency)
    setCurrencyState(newCurrency)
  }

  const value = {
    locale,
    currency,
    setLocale: handleSetLocale,
    setCurrency: handleSetCurrency,
  }

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

/**
 * Custom hook to use locale context
 * @returns {Object} Locale context value
 */
export function useLocale() {
  const context = useContext(LocaleContext)

  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }

  return context
}

/**
 * Custom hook for locale and currency management
 * Can be used even without provider (falls back to direct storage access)
 * @returns {Object} Locale and currency utilities
 */
export function useLocaleCurrency() {
  const [locale, setLocaleState] = useState(() => getCurrentLocale())
  const [currency, setCurrencyState] = useState(() => getCurrentCurrency())

  useEffect(() => {
    const unsubscribeLocale = onLocaleChange((newLocale) => {
      setLocaleState(newLocale)
    })

    const unsubscribeCurrency = onCurrencyChange((newCurrency) => {
      setCurrencyState(newCurrency)
    })

    return () => {
      unsubscribeLocale()
      unsubscribeCurrency()
    }
  }, [])

  const handleSetLocale = (newLocale) => {
    setCurrentLocale(newLocale)
  }

  const handleSetCurrency = (newCurrency) => {
    setCurrentCurrency(newCurrency)
  }

  return {
    locale,
    currency,
    setLocale: handleSetLocale,
    setCurrency: handleSetCurrency,
  }
}