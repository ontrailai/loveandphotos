/**
 * SortViewToggle Component
 * Sort dropdown and grid/list view toggle
 */

import React from 'react'
import { motion } from 'motion/react'
import { GridIcon, ListIcon, ChevronDownIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import { clsx } from 'clsx'
import type { SortViewToggleProps, SortOption, ViewMode } from '@utils/photographers/types'

// Sort options configuration
const sortOptions: Array<{ value: SortOption; label: string; description?: string }> = [
  { value: 'rating', label: 'Top Rated', description: 'Highest rated photographers' },
  { value: 'reviews', label: 'Most Reviewed', description: 'Most customer reviews' },
  { value: 'experience', label: 'Most Experienced', description: 'Years of experience' },
  { value: 'response_time', label: 'Fastest Response', description: 'Quick to respond' },
  { value: 'recent', label: 'Recently Joined', description: 'Newest photographers' },
  { value: 'price_low', label: 'Price: Low to High', description: 'Lowest prices first' },
  { value: 'price_high', label: 'Price: High to Low', description: 'Highest prices first' },
  { value: 'closest', label: 'Closest to You', description: 'Based on location' }
]

/**
 * Custom dropdown component for sort options
 */
interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
  isLoading?: boolean
  className?: string
}

function SortDropdown({ value, onChange, isLoading, className }: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const currentOption = sortOptions.find(option => option.value === value)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={clsx(
          'flex items-center gap-2 min-w-[160px] justify-between',
          'text-sm font-medium text-gray-700',
          'border-gray-200 hover:border-gray-300',
          'focus:border-[#FF4D6D] focus:ring-2 focus:ring-[#FF4D6D]/20'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{currentOption?.label || 'Sort by'}</span>
        <ChevronDownIcon
          className={clsx(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 z-50 mt-2"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden py-2">
            <div role="listbox" className="max-h-64 overflow-y-auto">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full text-left px-4 py-3 hover:bg-gray-50',
                    'flex flex-col transition-colors duration-150',
                    'focus:outline-none focus:bg-gray-50',
                    value === option.value && 'bg-[#FF4D6D]/5 text-[#FF4D6D]'
                  )}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span className="font-medium text-sm">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/**
 * View mode toggle component
 */
interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={clsx('flex bg-gray-100 rounded-lg p-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('grid')}
        className={clsx(
          'p-2 rounded transition-all duration-200',
          value === 'grid'
            ? 'bg-white shadow-sm text-[#FF4D6D]'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        )}
        aria-label="Grid view"
        aria-pressed={value === 'grid'}
      >
        <GridIcon className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('list')}
        className={clsx(
          'p-2 rounded transition-all duration-200',
          value === 'list'
            ? 'bg-white shadow-sm text-[#FF4D6D]'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        )}
        aria-label="List view"
        aria-pressed={value === 'list'}
      >
        <ListIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}

/**
 * Main SortViewToggle component
 */
export function SortViewToggle({
  sortBy,
  viewMode,
  onSortChange,
  onViewChange,
  resultCount,
  isLoading = false,
  className
}: SortViewToggleProps) {
  return (
    <div className={clsx('flex items-center gap-4', className)}>
      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="sort-select"
          className="text-sm text-gray-600 whitespace-nowrap hidden sm:block"
        >
          Sort by:
        </label>
        <SortDropdown
          value={sortBy}
          onChange={onSortChange}
          isLoading={isLoading}
        />
      </div>

      {/* View Toggle */}
      <ViewToggle
        value={viewMode}
        onChange={onViewChange}
      />

      {/* Results Count (desktop only) */}
      {resultCount > 0 && (
        <div className="hidden lg:block text-sm text-gray-500 whitespace-nowrap">
          {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default SortViewToggle