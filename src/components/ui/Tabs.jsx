/**
 * Tabs Component
 * Custom tabs component matching project styling
 */

import React, { useState, createContext, useContext } from 'react'

const TabsContext = createContext()

/**
 * Tabs Root Component
 */
export function Tabs({ children, defaultValue, value, onValueChange, className = '' }) {
  const [internalValue, setInternalValue] = useState(defaultValue)

  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = value !== undefined ? onValueChange : setInternalValue

  const contextValue = {
    value: currentValue,
    onValueChange: handleValueChange
  }

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

/**
 * Tabs List Component
 */
export function TabsList({ children, className = '' }) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Tabs Trigger Component
 */
export function TabsTrigger({ children, value, className = '' }) {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }

  const isActive = context.value === value

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Tabs Content Component
 */
export function TabsContent({ children, value, className = '' }) {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }

  if (context.value !== value) {
    return null
  }

  return (
    <div className={`mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  )
}