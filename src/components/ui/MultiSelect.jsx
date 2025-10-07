/**
 * MultiSelect Component
 * Reusable multi-select dropdown with tag display and custom entry support
 * Used for selecting multiple values with removable tags
 */

import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Plus } from 'lucide-react'
import { clsx } from 'clsx'

const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select options...',
  label,
  allowCustom = false,
  className = '',
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customInput, setCustomInput] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setCustomInput('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle option selection
  const handleSelect = (option) => {
    if (!value.includes(option)) {
      onChange([...value, option])
    }
    setSearchTerm('')
  }

  // Handle option removal
  const handleRemove = (optionToRemove) => {
    onChange(value.filter((option) => option !== optionToRemove))
  }

  // Handle custom option entry
  const handleAddCustom = () => {
    const trimmedInput = customInput.trim()
    if (trimmedInput && !value.includes(trimmedInput)) {
      onChange([...value, trimmedInput])
      setCustomInput('')
      setSearchTerm('')
    }
  }

  // Handle Enter key for custom input
  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustom()
    }
  }

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                disabled={disabled}
                className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-2 bg-white border rounded-lg',
          'text-left text-sm transition-colors',
          {
            'border-primary-500 ring-2 ring-primary-100': isOpen && !disabled,
            'border-gray-300 hover:border-gray-400': !isOpen && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
          }
        )}
        {...props}
      >
        <span className={clsx('text-gray-700', { 'text-gray-400': disabled })}>
          {value.length > 0
            ? `${value.length} selected`
            : placeholder}
        </span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 transition-transform',
            { 'transform rotate-180': isOpen },
            { 'text-gray-400': disabled, 'text-gray-500': !disabled }
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={value.includes(option)}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm transition-colors',
                    {
                      'bg-gray-50 text-gray-400 cursor-not-allowed': value.includes(option),
                      'hover:bg-gray-100 text-gray-700': !value.includes(option),
                    }
                  )}
                >
                  {option}
                  {value.includes(option) && (
                    <span className="ml-2 text-xs text-gray-500">(selected)</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            )}
          </div>

          {/* Custom Entry Section */}
          {allowCustom && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="Enter custom option..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!customInput.trim()}
                  className={clsx(
                    'px-3 py-2 rounded-md transition-colors flex items-center gap-1',
                    {
                      'bg-primary-600 text-white hover:bg-primary-700': customInput.trim(),
                      'bg-gray-300 text-gray-500 cursor-not-allowed': !customInput.trim(),
                    }
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiSelect
