/**
 * Storybook Stories for FiltersPanel Component
 * Visual documentation and testing for comprehensive photographer filtering system
 */

import { useState } from 'react'
import FiltersPanel from './FiltersPanel'

// Mock filter state
const defaultFilters = {
  rating: 0,
  tier: 'all',
  specialties: [],
  languages: [],
  photographyStyle: 'all',
  femaleOnly: false
}

// Sample filter states for stories
const activeFilters = {
  rating: 4,
  tier: 'gold',
  specialties: ['Wedding', 'Portrait'],
  languages: ['English', 'Spanish'],
  photographyStyle: 'candid',
  femaleOnly: true
}

const partialFilters = {
  rating: 0,
  tier: 'all',
  specialties: ['Wedding'],
  languages: [],
  photographyStyle: 'all',
  femaleOnly: false
}

// Helper to count active filters
const countActiveFilters = (filters) => {
  let count = 0
  if (filters.rating > 0) count++
  if (filters.tier !== 'all') count++
  if (filters.specialties.length > 0) count++
  if (filters.languages.length > 0) count++
  if (filters.photographyStyle !== 'all') count++
  if (filters.femaleOnly) count++
  return count
}

// Default export for Storybook
export default {
  title: 'Photographers/FiltersPanel',
  component: FiltersPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Comprehensive filtering panel with collapsible sections, rating filters, and advanced options for photographer discovery.'
      }
    }
  },
  argTypes: {
    filters: {
      description: 'Current filter state object',
      control: 'object'
    },
    onFilterChange: {
      description: 'Handler for filter changes',
      action: 'filter-changed'
    },
    onClearFilters: {
      description: 'Handler for clearing all filters',
      action: 'filters-cleared'
    },
    activeFilterCount: {
      description: 'Number of active filters',
      control: 'number'
    },
    isLoading: {
      description: 'Loading state for filter operations',
      control: 'boolean'
    },
    isMobile: {
      description: 'Mobile layout mode',
      control: 'boolean'
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <Story />
      </div>
    )
  ]
}

// Template for static stories
const Template = (args) => <FiltersPanel {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  filters: defaultFilters,
  activeFilterCount: 0,
  isLoading: false,
  isMobile: false
}

// With active filters
export const WithActiveFilters = Template.bind({})
WithActiveFilters.args = {
  filters: activeFilters,
  activeFilterCount: countActiveFilters(activeFilters),
  isLoading: false,
  isMobile: false
}
WithActiveFilters.parameters = {
  docs: {
    description: {
      story: 'Filter panel with multiple active filters showing count badge and clear button.'
    }
  }
}

// Partial filters
export const PartialFilters = Template.bind({})
PartialFilters.args = {
  filters: partialFilters,
  activeFilterCount: countActiveFilters(partialFilters),
  isLoading: false,
  isMobile: false
}

// Loading state
export const Loading = Template.bind({})
Loading.args = {
  filters: defaultFilters,
  activeFilterCount: 0,
  isLoading: true,
  isMobile: false
}

// Mobile layout
export const Mobile = Template.bind({})
Mobile.args = {
  filters: activeFilters,
  activeFilterCount: countActiveFilters(activeFilters),
  isLoading: false,
  isMobile: true
}
Mobile.decorators = [
  (Story) => (
    <div className="w-full max-w-sm mx-auto">
      <Story />
    </div>
  )
]

// Interactive demo with state management
export const Interactive = {
  render: () => {
    const [filters, setFilters] = useState(defaultFilters)
    const [isLoading, setIsLoading] = useState(false)

    const handleFilterChange = (newFilters) => {
      setIsLoading(true)
      setFilters(prev => ({ ...prev, ...newFilters }))
      // Simulate API call
      setTimeout(() => setIsLoading(false), 500)
    }

    const handleClearFilters = () => {
      setIsLoading(true)
      setFilters(defaultFilters)
      setTimeout(() => setIsLoading(false), 300)
    }

    const activeCount = countActiveFilters(filters)

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeFilterCount={activeCount}
          isLoading={isLoading}
          isMobile={false}
        />

        <div className="mt-4 p-3 bg-white rounded-lg text-sm">
          <h4 className="font-medium mb-2">Current Filters:</h4>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(filters, null, 2)}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            Active filters: {activeCount}
          </p>
        </div>
      </div>
    )
  }
}

// Filter sections individually
export const RatingFilter = {
  render: () => {
    const [filters, setFilters] = useState({ ...defaultFilters, rating: 4 })

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={() => setFilters(defaultFilters)}
          activeFilterCount={countActiveFilters(filters)}
        />
      </div>
    )
  }
}

export const TierFilter = {
  render: () => {
    const [filters, setFilters] = useState({ ...defaultFilters, tier: 'platinum' })

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={() => setFilters(defaultFilters)}
          activeFilterCount={countActiveFilters(filters)}
        />
      </div>
    )
  }
}

export const SpecialtiesFilter = {
  render: () => {
    const [filters, setFilters] = useState({
      ...defaultFilters,
      specialties: ['Wedding', 'Portrait', 'Event', 'Corporate']
    })

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={() => setFilters(defaultFilters)}
          activeFilterCount={countActiveFilters(filters)}
        />
      </div>
    )
  }
}

export const LanguagesFilter = {
  render: () => {
    const [filters, setFilters] = useState({
      ...defaultFilters,
      languages: ['English', 'Spanish', 'French']
    })

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={() => setFilters(defaultFilters)}
          activeFilterCount={countActiveFilters(filters)}
        />
      </div>
    )
  }
}

// Mobile vs Desktop comparison
export const ResponsiveComparison = {
  render: () => {
    const [filters, setFilters] = useState(activeFilters)

    const handleFilterChange = (newFilters) => {
      setFilters(prev => ({ ...prev, ...newFilters }))
    }

    const handleClearFilters = () => {
      setFilters(defaultFilters)
    }

    const activeCount = countActiveFilters(filters)

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto p-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Desktop Layout</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <FiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeCount}
              isMobile={false}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Mobile Layout</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <FiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeCount}
              isMobile={true}
            />
          </div>
        </div>
      </div>
    )
  }
}

// Accessibility demonstration
export const AccessibilityDemo = {
  render: () => {
    const [filters, setFilters] = useState(defaultFilters)

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={() => setFilters(defaultFilters)}
          activeFilterCount={countActiveFilters(filters)}
        />

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Accessibility features:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>All form controls are keyboard accessible</li>
            <li>ARIA expanded states for collapsible sections</li>
            <li>Screen reader only labels with sr-only class</li>
            <li>Semantic HTML with proper form associations</li>
            <li>Focus management and visible focus indicators</li>
            <li>Logical tab order throughout all filters</li>
            <li>Clear button with aria-label for screen readers</li>
          </ul>
        </div>
      </div>
    )
  }
}

// Performance showcase
export const PerformanceShowcase = {
  render: () => {
    const [filters, setFilters] = useState(defaultFilters)
    const [changeCount, setChangeCount] = useState(0)

    const handleFilterChange = (newFilters) => {
      setChangeCount(prev => prev + 1)
      setFilters(prev => ({ ...prev, ...newFilters }))
    }

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={() => {
            setFilters(defaultFilters)
            setChangeCount(0)
          }}
          activeFilterCount={countActiveFilters(filters)}
        />

        <div className="mt-4 p-3 bg-white rounded-lg text-sm">
          <h4 className="font-medium mb-2">Performance Metrics:</h4>
          <p className="text-gray-600">Filter changes: {changeCount}</p>
          <p className="text-xs text-gray-500 mt-2">
            All animations use Framer Motion with optimized transitions.
            Form state updates are efficient with minimal re-renders.
          </p>
        </div>
      </div>
    )
  }
}

// Error handling
export const ErrorHandling = {
  render: () => {
    const [filters, setFilters] = useState({
      rating: null, // Invalid value
      tier: undefined, // Invalid value
      specialties: ['InvalidSpecialty'], // Invalid option
      languages: null, // Invalid value
      photographyStyle: 'invalid', // Invalid option
      femaleOnly: 'true' // Invalid type
    })

    return (
      <div className="max-w-sm mx-auto bg-gray-50 p-4">
        <FiltersPanel
          filters={filters}
          onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
          onClearFilters={() => setFilters(defaultFilters)}
          activeFilterCount={0}
        />

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
          <h4 className="font-medium text-yellow-800 mb-2">Error Handling Demo:</h4>
          <p className="text-yellow-700 text-xs">
            Component gracefully handles invalid filter values and maintains functionality.
            Invalid values are normalized or ignored to prevent crashes.
          </p>
        </div>
      </div>
    )
  }
}

// Dark mode (if supported)
export const DarkMode = Template.bind({})
DarkMode.args = {
  filters: activeFilters,
  activeFilterCount: countActiveFilters(activeFilters),
  isLoading: false,
  isMobile: false
}
DarkMode.decorators = [
  (Story) => (
    <div className="dark bg-gray-900 p-4">
      <div className="max-w-sm mx-auto">
        <Story />
      </div>
    </div>
  )
]