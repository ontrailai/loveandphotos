/**
 * FiltersPanel Component
 * Enhanced sticky, collapsible filter sidebar with glassmorphism effects and comprehensive photographer filtering
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDownIcon, ChevronUpIcon, StarIcon, XIcon, SparklesIcon, FilterIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { clsx } from 'clsx'
import type {
  FiltersPanelProps,
  FilterState,
  SPECIALTIES,
  LANGUAGES,
  PAY_TIERS
} from '@utils/photographers/types'


// Language options
const languageOptions = [
  'English', 'Spanish', 'French', 'Chinese',
  'Korean', 'Japanese', 'Hindi', 'Arabic'
] as const

// Photography style options
const photographyStyleOptions = [
  { value: 'all', label: 'Everything', description: 'All photography styles' },
  { value: 'candid', label: 'Candid', description: 'Natural, unposed moments' },
  { value: 'posed', label: 'Posed', description: 'Traditional, directed shots' }
] as const

/**
 * Collapsible filter section component
 */
interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

function FilterSection({ title, children, defaultOpen = true, className }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={clsx('border-b border-gray-100 last:border-b-0', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full flex items-center justify-between py-4 px-0',
          'text-left text-gray-800 font-medium',
          'hover:text-[#FF4D6D] transition-colors duration-150',
          'focus:outline-none focus:text-[#FF4D6D]'
        )}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


/**
 * Checkbox group component
 */
interface CheckboxGroupProps {
  options: readonly string[]
  selected: string[]
  onChange: (values: string[]) => void
  maxVisible?: number
}

function CheckboxGroup({ options, selected, onChange, maxVisible = 8 }: CheckboxGroupProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleOptions = showAll ? options : options.slice(0, maxVisible)
  const hasMore = options.length > maxVisible

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="space-y-2">
      {visibleOptions.map(option => (
        <label
          key={option}
          className={clsx(
            'flex items-center cursor-pointer p-2 -mx-2 rounded-lg',
            'hover:bg-gray-50 transition-colors duration-150',
            'group'
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggleOption(option)}
            className="sr-only"
          />

          <div
            className={clsx(
              'w-4 h-4 rounded border-2 mr-3 flex items-center justify-center',
              'transition-all duration-150',
              selected.includes(option)
                ? 'bg-[#FF4D6D] border-[#FF4D6D]'
                : 'border-gray-300 group-hover:border-gray-400'
            )}
          >
            {selected.includes(option) && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2.5 h-2.5 text-gray-700"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </motion.svg>
            )}
          </div>

          <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
            {option}
          </span>
        </label>
      ))}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="text-[#FF4D6D] hover:text-[#FF4D6D]/80 p-0 h-auto font-normal"
        >
          {showAll ? 'Show less' : `Show all ${options.length}`}
        </Button>
      )}
    </div>
  )
}


/**
 * Enhanced checkbox group component with glassmorphism effects
 */
interface EnhancedCheckboxGroupProps {
  options: readonly string[]
  selected: string[]
  onChange: (values: string[]) => void
  maxVisible?: number
}

function EnhancedCheckboxGroup({ options, selected, onChange, maxVisible = 8 }: EnhancedCheckboxGroupProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleOptions = showAll ? options : options.slice(0, maxVisible)
  const hasMore = options.length > maxVisible

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="space-y-2">
      {visibleOptions.map((option) => (
        <label
          key={option}
          className={clsx(
            'flex items-center cursor-pointer p-3 -mx-1 rounded-xl',
            'group'
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggleOption(option)}
            className="sr-only"
          />

          <div
            className={clsx(
              'w-5 h-5 rounded border-2 mr-3 flex items-center justify-center',
              'transition-colors duration-150',
              selected.includes(option)
                ? 'bg-[#FF4D6D] border-[#FF4D6D]'
                : 'border-gray-300 group-hover:border-[#FF4D6D]/50'
            )}
          >
            {selected.includes(option) && (
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">
            {option}
          </span>

          {/* Selection indicator */}
          {selected.includes(option) && (
            <div className="w-2 h-2 bg-[#FF4D6D] rounded-full" />
          )}
        </label>
      ))}

      {hasMore && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-[#FF4D6D] hover:text-[#FF4D6D]/80 hover:bg-[#FF4D6D]/10 p-2 h-auto font-medium rounded-xl transition-colors duration-150"
          >
            <div
              className={clsx(
                'mr-1 transition-transform duration-150',
                showAll && 'rotate-180'
              )}
            >
              <ChevronDownIcon className="w-3 h-3" />
            </div>
            {showAll ? 'Show less' : `Show all ${options.length}`}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Enhanced Main FiltersPanel component with glassmorphism effects
 */
export function FiltersPanel({
  filters,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  isLoading = false,
  isMobile = false,
  className
}: FiltersPanelProps) {

  // Handle filter updates
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ [key]: value })
  }


  // Toggle language
  const toggleLanguage = (language: string) => {
    const newLanguages = filters.languages.includes(language)
      ? filters.languages.filter(l => l !== language)
      : [...filters.languages, language]
    updateFilter('languages', newLanguages)
  }

  return (
    <div
      className={clsx(
        'relative w-full',
        isMobile ? '' : 'max-w-sm',
        className
      )}
    >
      {/* Glassmorphism Background */}
      <div
        className={clsx(
          'absolute inset-0 rounded-3xl border shadow-2xl',
          isMobile
            ? 'bg-white border-gray-100 shadow-none rounded-none'
            : 'bg-white/10 backdrop-blur-xl border-white/20'
        )}
        style={!isMobile ? {
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          boxShadow: "0 25px 45px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)"
        } : {}}
      />


      {/* Content */}
      <div className={clsx('relative z-10', isMobile ? 'p-0' : 'p-6')}>
        {/* Header */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100/50">
            <div className="flex items-center gap-3">
              <FilterIcon className="w-5 h-5 text-[#FF4D6D]" />
              <h3 className="font-bold text-gray-800 text-lg">Filters</h3>
              {activeFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="bg-[#FF4D6D] text-gray-700 text-xs shadow-sm"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-auto rounded-xl transition-colors duration-150"
                aria-label="Clear all filters"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        <div className={clsx(isMobile ? 'space-y-0' : 'space-y-0')}>

          {/* Photographer Tier */}
          <FilterSection title="Photographer Tier" defaultOpen={true}>
            <div className="space-y-3">
              {['all', 'bronze', 'silver', 'gold', 'platinum'].map((tier) => (
                <label
                  key={tier}
                  className={clsx(
                    'flex items-center cursor-pointer p-3 -mx-1 rounded-xl',
                    'group'
                  )}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier}
                    checked={filters.tier === tier}
                    onChange={() => updateFilter('tier', tier)}
                    className="sr-only"
                  />

                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full border-2 mr-3 transition-colors duration-150 flex items-center justify-center',
                      filters.tier === tier
                        ? 'border-[#FF4D6D] bg-[#FF4D6D]'
                        : 'border-gray-300 group-hover:border-[#FF4D6D]/50'
                    )}
                  >
                    {filters.tier === tier && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  <div className="flex items-center flex-1">
                    {tier === 'all' ? (
                      <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                        All Tiers
                      </span>
                    ) : (
                      <Badge
                        variant="default"
                        size="sm"
                        className="capitalize font-medium bg-gray-200 text-gray-800"
                      >
                        {tier}
                      </Badge>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </FilterSection>


          {/* Languages */}
          <FilterSection title="Languages" defaultOpen={false}>
            <EnhancedCheckboxGroup
              options={languageOptions}
              selected={filters.languages}
              onChange={(languages) => updateFilter('languages', languages)}
            />
          </FilterSection>

          {/* Photography Style */}
          <FilterSection title="Photography Style" defaultOpen={false}>
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
            >
              {photographyStyleOptions.map((style) => (
                <label
                  key={style.value}
                  className={clsx(
                    'flex items-start cursor-pointer p-3 -mx-1 rounded-xl',
                    'group'
                  )}
                >
                  <input
                    type="radio"
                    name="photography-style"
                    value={style.value}
                    checked={filters.photographyStyle === style.value}
                    onChange={() => updateFilter('photographyStyle', style.value)}
                    className="sr-only"
                  />

                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full border-2 mr-3 mt-0.5 transition-all duration-150 flex items-center justify-center',
                      filters.photographyStyle === style.value
                        ? 'border-[#FF4D6D] bg-[#FF4D6D] shadow-sm'
                        : 'border-gray-300 group-hover:border-[#FF4D6D]/50'
                    )}
                  >
                    {filters.photographyStyle === style.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block">
                      {style.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-600">
                      {style.description}
                    </p>
                  </div>
                </label>
              ))}
            </motion.div>
          </FilterSection>

          {/* Photographer Preference */}
          <FilterSection title="Photographer Preference" defaultOpen={false}>
            <label
              className={clsx(
                'flex items-center cursor-pointer p-3 -mx-1 rounded-xl',
                'group'
              )}
            >
              <input
                type="checkbox"
                checked={filters.femaleOnly}
                onChange={(e) => updateFilter('femaleOnly', e.target.checked)}
                className="sr-only"
              />

              <div
                className={clsx(
                  'w-5 h-5 rounded border-2 mr-3 flex items-center justify-center',
                  'transition-all duration-150',
                  filters.femaleOnly
                    ? 'bg-[#FF4D6D] border-[#FF4D6D] shadow-sm'
                    : 'border-gray-300 group-hover:border-[#FF4D6D]/50'
                )}
              >
                {filters.femaleOnly && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block">
                  Female Photographers Only
                </span>
                <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-600">
                  Filter to show only female photographers
                </p>
              </div>
            </label>
          </FilterSection>
        </div>

        {/* Enhanced Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-3xl"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-3 border-[#FF4D6D]/30 border-t-[#FF4D6D] rounded-full"
                />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-gray-700 font-medium"
                >
                  Applying filters...
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default FiltersPanel