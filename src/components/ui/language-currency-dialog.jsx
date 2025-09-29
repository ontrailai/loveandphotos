/**
 * Language & Currency Dialog Component
 * Allows users to select language and currency preferences
 */

import React, { useState, useMemo, useEffect } from 'react'
import { Search, Globe, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from './Dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
import Input from './Input'
import { getSupportedLanguages, getCurrentLocale, getAutoTranslate, setAutoTranslate } from '@/lib/i18n/client'
import { CURRENCIES, getCurrentCurrency } from '@/lib/currency'
import { useLocaleCurrency } from '@/components/providers/locale-provider'

/**
 * Language & Currency Dialog Component
 */
export function LanguageCurrencyDialog({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('language')
  const [languageSearch, setLanguageSearch] = useState('')
  const [currencySearch, setCurrencySearch] = useState('')
  const [autoTranslate, setAutoTranslateState] = useState(false)

  // Use the locale provider hook
  const { locale, currency, setLocale, setCurrency } = useLocaleCurrency()

  // Initialize auto-translate from localStorage on mount
  useEffect(() => {
    setAutoTranslateState(getAutoTranslate())
  }, [])

  // Get available languages and currencies
  const languages = getSupportedLanguages()

  // Filter languages based on search
  const filteredLanguages = useMemo(() => {
    if (!languageSearch) return languages
    const search = languageSearch.toLowerCase()
    return languages.filter(
      lang =>
        lang.name.toLowerCase().includes(search) ||
        lang.nativeName.toLowerCase().includes(search) ||
        lang.code.toLowerCase().includes(search)
    )
  }, [languages, languageSearch])

  // Filter currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return CURRENCIES
    const search = currencySearch.toLowerCase()
    return CURRENCIES.filter(
      curr =>
        curr.name.toLowerCase().includes(search) ||
        curr.code.toLowerCase().includes(search) ||
        curr.symbol.toLowerCase().includes(search)
    )
  }, [currencySearch])

  // Handle language selection
  const handleLanguageSelect = (languageCode) => {
    setLocale(languageCode)
    setIsOpen(false)
  }

  // Handle currency selection
  const handleCurrencySelect = (currencyCode) => {
    setCurrency(currencyCode)
    setIsOpen(false)
  }

  // Reset search when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setLanguageSearch('')
    setCurrencySearch('')
  }

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe size={20} />
              Language & Currency
            </DialogTitle>
            <DialogClose onClose={() => setIsOpen(false)} />
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="language">Language</TabsTrigger>
              <TabsTrigger value="currency">Currency</TabsTrigger>
            </TabsList>

            {/* Language Tab */}
            <TabsContent value="language" className="space-y-4">
              <Input
                placeholder="Search languages..."
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                icon={<Search size={16} className="text-gray-400" />}
                className="text-sm"
              />

              {/* Auto-translate toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-900">Auto-translate</div>
                  <div className="text-xs text-gray-500">Automatically translate content</div>
                </div>
                <button
                  role="switch"
                  aria-checked={autoTranslate}
                  aria-label="Toggle auto-translate"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    autoTranslate ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  onClick={() => {
                    const newValue = !autoTranslate
                    setAutoTranslateState(newValue)
                    setAutoTranslate(newValue)
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
                      autoTranslate ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Language List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {language.nativeName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {language.name}
                      </div>
                    </div>
                    {locale === language.code && (
                      <Check size={16} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {filteredLanguages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Globe size={24} className="mx-auto mb-2 text-gray-400" />
                  <div className="text-sm">No languages found</div>
                </div>
              )}
            </TabsContent>

            {/* Currency Tab */}
            <TabsContent value="currency" className="space-y-4">
              <Input
                placeholder="Search currencies..."
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                icon={<Search size={16} className="text-gray-400" />}
                className="text-sm"
              />

              {/* Currency List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredCurrencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => handleCurrencySelect(curr.code)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-medium text-gray-600">
                        {curr.symbol}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {curr.code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {curr.name}
                        </div>
                      </div>
                    </div>
                    {currency === curr.code && (
                      <Check size={16} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {filteredCurrencies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Globe size={24} className="mx-auto mb-2 text-gray-400" />
                  <div className="text-sm">No currencies found</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}