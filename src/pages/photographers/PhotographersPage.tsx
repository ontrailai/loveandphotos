/**
 * Photographers Browse Page
 * Main route component with sticky filters, responsive grid/list toggle, and infinite scroll
 */

import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '@contexts/AuthContext'
import { useUrlState } from '@hooks/useUrlState'
import { usePhotographersBatched } from '@hooks/usePhotographersBatched'
import ErrorBoundary from '@components/ui/ErrorBoundary'
import type { PhotographerProfile } from '@utils/photographers/types'

// Component imports (to be created)
import { SearchBar } from './components/SearchBar'
import { FiltersPanel } from './components/FiltersPanel'
import { SortViewToggle } from './components/SortViewToggle'
import { PhotographerCard } from './components/PhotographerCard'
import { PhotographerRow } from './components/PhotographerRow'
import { Skeletons } from './components/Skeletons'
import { EmptyState } from './components/EmptyState'
import { InfiniteScrollTrigger } from './components/InfiniteScrollTrigger'

// UI Components
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import { FilterIcon, XIcon } from 'lucide-react'

// Constants
const MOBILE_BREAKPOINT = 1024 // lg breakpoint in Tailwind

/**
 * Main photographers browse page component
 */
export default function PhotographersPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  // URL state management
  const {
    filters,
    sortBy,
    viewMode,
    updateFilters,
    updateSort,
    updateView,
    clearFilters
  } = useUrlState()

  // Determine if pricing should be shown
  const shouldShowPricing = profile?.role === 'admin' || profile?.role === 'photographer'

  // Data fetching with infinite scroll
  const {
    data: photographers,
    isLoading,
    error,
    hasMore,
    fetchNext,
    refetch,
    total,
    isEmpty
  } = usePhotographersBatched({
    filters,
    sortBy
  })

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return (
      filters.languages.length +
      (filters.tier !== 'all' ? 1 : 0) +
      (filters.photographyStyle !== 'all' ? 1 : 0) +
      (filters.femaleOnly ? 1 : 0) +
      (filters.priceRange ? 1 : 0)
    )
  }, [filters])

  // Handle photographer card click
  const handlePhotographerClick = useCallback((photographer: PhotographerProfile) => {
    const dateParam = filters.date ? `?date=${filters.date}` : ''
    navigate(`/photographer/${photographer.id}${dateParam}`)
  }, [navigate, filters.date])

  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    // Trigger refetch when search is submitted
    refetch()
  }, [refetch])

  // Mobile filter state (for mobile sheet)
  const [showMobileFilters, setShowMobileFilters] = React.useState(false)

  return (
    <ErrorBoundary
      fallback={(error, retry) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the photographers page.
            </p>
            <Button onClick={retry}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    >
      <div className="min-h-screen bg-white">
        {/* Header with Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="max-w-7xl mx-auto">
              {/* Page Title */}
              <div className="mb-3">
                <h1 className="text-3xl font-display font-bold text-black mb-2">
                  Find Your Perfect Photographer
                </h1>
                <p className="text-gray-900">
                  Discover talented photographers in your area for any occasion
                </p>
              </div>

              {/* Search Bar */}
              <SearchBar
                value={filters.zip}
                date={filters.date}
                onValueChange={(value) => updateFilters({ zip: value })}
                onDateChange={(date) => updateFilters({ date })}
                onSubmit={handleSearchSubmit}
                isLoading={isLoading}
                className="mb-4"
              />

              {/* Mobile Filter Toggle */}
              <div className="lg:hidden flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowMobileFilters(true)}
                  className="relative"
                >
                  <FilterIcon className="w-5 h-5 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* View Toggle for Mobile */}
                <SortViewToggle
                  sortBy={sortBy}
                  viewMode={viewMode}
                  onSortChange={updateSort}
                  onViewChange={updateView}
                  resultCount={total}
                  isLoading={isLoading}
                  className="lg:hidden"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              {/* Desktop Filters Sidebar */}
              <div className="hidden lg:block">
                <div className="sticky top-32">
                  <FiltersPanel
                    filters={filters}
                    onFilterChange={updateFilters}
                    onClearFilters={clearFilters}
                    activeFilterCount={activeFilterCount}
                    isLoading={isLoading}
                  />
                </div>
              </div>

              {/* Results Area */}
              <main className="flex-1 min-w-0">
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-display font-semibold text-gray-900">
                      {isLoading && total === 0 ? (
                        'Loading...'
                      ) : (
                        <>
                          {total.toLocaleString()} Photographer{total !== 1 ? 's' : ''} Available
                        </>
                      )}
                    </h2>

                    {/* Active Filters Display */}
                    {activeFilterCount > 0 && (
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                          Clear all
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Desktop Sort and View Toggle */}
                  <div className="hidden lg:block">
                    <SortViewToggle
                      sortBy={sortBy}
                      viewMode={viewMode}
                      onSortChange={updateSort}
                      onViewChange={updateView}
                      resultCount={total}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                {/* Error State */}
                {error && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"
                  >
                    <div className="flex items-start">
                      <XIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800 mb-1">
                          Could not load photographers
                        </h3>
                        <p className="text-sm text-red-700 mb-3">{error}</p>
                        <Button
                          onClick={refetch}
                          size="sm"
                          variant="secondary"
                          className="bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Photographers Grid/List */}
                {isLoading && photographers.length === 0 ? (
                  <Skeletons count={6} viewMode={viewMode} />
                ) : isEmpty ? (
                  <EmptyState
                    title="No photographers found"
                    description={
                      activeFilterCount > 0
                        ? "Try adjusting your filters to find more photographers."
                        : "We couldn't find any photographers matching your search."
                    }
                    showClearFilters={activeFilterCount > 0}
                    onClearFilters={clearFilters}
                    suggestedCities={['New York', 'Los Angeles', 'Chicago', 'Miami']}
                  />
                ) : viewMode === 'grid' ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {photographers.map((photographer, index) => (
                      <motion.div
                        key={photographer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                          ease: "easeOut"
                        }}
                      >
                        <PhotographerCard
                          photographer={photographer}
                          showPricing={shouldShowPricing}
                          onClick={() => handlePhotographerClick(photographer)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    {photographers.map((photographer, index) => (
                      <motion.div
                        key={photographer.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.03,
                          ease: "easeOut"
                        }}
                      >
                        <PhotographerRow
                          photographer={photographer}
                          showPricing={shouldShowPricing}
                          onClick={() => handlePhotographerClick(photographer)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Infinite Scroll Trigger */}
                {photographers.length > 0 && hasMore && (
                  <InfiniteScrollTrigger
                    onIntersect={fetchNext}
                    isLoading={isLoading}
                    className="mt-8"
                  />
                )}

                {/* End of Results Indicator */}
                {photographers.length > 0 && !hasMore && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                      You've seen all {total.toLocaleString()} photographer{total !== 1 ? 's' : ''}
                    </div>
                  </motion.div>
                )}
              </main>
            </div>
          </div>
        </div>

        {/* Mobile Filters Sheet */}
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileFilters(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-full max-w-sm bg-white shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <FiltersPanel
                  filters={filters}
                  onFilterChange={updateFilters}
                  onClearFilters={clearFilters}
                  activeFilterCount={activeFilterCount}
                  isLoading={isLoading}
                  isMobile={true}
                />
              </div>

              {/* Mobile Filter Actions */}
              <div className="border-t p-6">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex-1"
                    disabled={activeFilterCount === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1"
                  >
                    Show Results ({total.toLocaleString()})
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  )
}

/**
 * Page metadata for SEO and navigation
 */
export const photographersPageMeta = {
  title: 'Find Photographers Near You',
  description: 'Discover talented photographers in your area for weddings, portraits, events, and more. Browse verified professionals with reviews and pricing.',
  keywords: ['photographers', 'wedding photography', 'portrait photography', 'event photography', 'professional photographers'],
  canonical: '/photographers'
}