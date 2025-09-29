/**
 * Storybook Stories for SortViewToggle Component
 * Visual documentation and testing for sort dropdown and view mode toggle
 */

import { useState } from 'react'
import SortViewToggle from './SortViewToggle'

// Sort options for reference
const sortOptions = [
  'rating',
  'reviews',
  'experience',
  'response_time',
  'recent',
  'price_low',
  'price_high',
  'closest'
]

// Default export for Storybook
export default {
  title: 'Photographers/SortViewToggle',
  component: SortViewToggle,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Combined sort dropdown and view mode toggle with result count display for photographer browsing.'
      }
    }
  },
  argTypes: {
    sortBy: {
      description: 'Current sort option',
      control: 'select',
      options: sortOptions
    },
    viewMode: {
      description: 'Current view mode',
      control: 'radio',
      options: ['grid', 'list']
    },
    onSortChange: {
      description: 'Handler for sort option changes',
      action: 'sort-changed'
    },
    onViewChange: {
      description: 'Handler for view mode changes',
      action: 'view-changed'
    },
    resultCount: {
      description: 'Number of results to display',
      control: 'number'
    },
    isLoading: {
      description: 'Loading state for sort operations',
      control: 'boolean'
    }
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <Story />
      </div>
    )
  ]
}

// Template for static stories
const Template = (args) => <SortViewToggle {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  sortBy: 'rating',
  viewMode: 'grid',
  resultCount: 0,
  isLoading: false
}

// With results
export const WithResults = Template.bind({})
WithResults.args = {
  sortBy: 'rating',
  viewMode: 'grid',
  resultCount: 247,
  isLoading: false
}
WithResults.parameters = {
  docs: {
    description: {
      story: 'Sort and view toggle with result count displayed on desktop screens.'
    }
  }
}

// List view mode
export const ListView = Template.bind({})
ListView.args = {
  sortBy: 'reviews',
  viewMode: 'list',
  resultCount: 156,
  isLoading: false
}

// Different sort options
export const PriceSorting = Template.bind({})
PriceSorting.args = {
  sortBy: 'price_low',
  viewMode: 'grid',
  resultCount: 89,
  isLoading: false
}

export const ExperienceSorting = Template.bind({})
ExperienceSorting.args = {
  sortBy: 'experience',
  viewMode: 'list',
  resultCount: 342,
  isLoading: false
}

export const LocationSorting = Template.bind({})
LocationSorting.args = {
  sortBy: 'closest',
  viewMode: 'grid',
  resultCount: 78,
  isLoading: false
}

// Loading state
export const Loading = Template.bind({})
Loading.args = {
  sortBy: 'rating',
  viewMode: 'grid',
  resultCount: 125,
  isLoading: true
}

// Large result count
export const LargeResultCount = Template.bind({})
LargeResultCount.args = {
  sortBy: 'recent',
  viewMode: 'grid',
  resultCount: 1247,
  isLoading: false
}

// Single result
export const SingleResult = Template.bind({})
SingleResult.args = {
  sortBy: 'rating',
  viewMode: 'grid',
  resultCount: 1,
  isLoading: false
}

// Interactive demo with state management
export const Interactive = {
  render: () => {
    const [sortBy, setSortBy] = useState('rating')
    const [viewMode, setViewMode] = useState('grid')
    const [isLoading, setIsLoading] = useState(false)
    const [resultCount, setResultCount] = useState(156)

    const handleSortChange = (newSort) => {
      setIsLoading(true)
      setSortBy(newSort)

      // Simulate different result counts based on sort
      const resultCounts = {
        rating: 156,
        reviews: 89,
        experience: 234,
        response_time: 67,
        recent: 45,
        price_low: 198,
        price_high: 123,
        closest: 78
      }

      setTimeout(() => {
        setResultCount(resultCounts[newSort] || 100)
        setIsLoading(false)
      }, 800)
    }

    const handleViewChange = (newView) => {
      setViewMode(newView)
    }

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <SortViewToggle
          sortBy={sortBy}
          viewMode={viewMode}
          onSortChange={handleSortChange}
          onViewChange={handleViewChange}
          resultCount={resultCount}
          isLoading={isLoading}
        />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Current State:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Sort By:</strong> {sortBy}</p>
              <p><strong>View Mode:</strong> {viewMode}</p>
            </div>
            <div>
              <p><strong>Results:</strong> {resultCount.toLocaleString()}</p>
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Try:</strong> Change sort options to see different result counts.
            Toggle between grid and list view modes. Loading state shows during sort changes.</p>
          </div>
        </div>
      </div>
    )
  }
}

// Sort dropdown focus demo
export const SortDropdownDemo = {
  render: () => {
    const [sortBy, setSortBy] = useState('rating')

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <SortViewToggle
          sortBy={sortBy}
          viewMode="grid"
          onSortChange={setSortBy}
          onViewChange={() => {}}
          resultCount={156}
          isLoading={false}
        />

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Sort Dropdown Demo</h4>
          <p className="text-blue-700 text-sm mb-3">
            Click the sort dropdown to see all available options with descriptions:
          </p>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• <strong>Top Rated</strong> - Highest rated photographers</li>
            <li>• <strong>Most Reviewed</strong> - Most customer reviews</li>
            <li>• <strong>Most Experienced</strong> - Years of experience</li>
            <li>• <strong>Fastest Response</strong> - Quick to respond</li>
            <li>• <strong>Recently Joined</strong> - Newest photographers</li>
            <li>• <strong>Price: Low to High</strong> - Lowest prices first</li>
            <li>• <strong>Price: High to Low</strong> - Highest prices first</li>
            <li>• <strong>Closest to You</strong> - Based on location</li>
          </ul>
        </div>
      </div>
    )
  }
}

// View toggle demo
export const ViewToggleDemo = {
  render: () => {
    const [viewMode, setViewMode] = useState('grid')

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <SortViewToggle
          sortBy="rating"
          viewMode={viewMode}
          onSortChange={() => {}}
          onViewChange={setViewMode}
          resultCount={89}
          isLoading={false}
        />

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">View Toggle Demo</h4>
          <p className="text-green-700 text-sm">
            <strong>Current view:</strong> {viewMode} •
            Click the {viewMode === 'grid' ? 'list' : 'grid'} icon to switch views.
            The active view is highlighted with the brand color.
          </p>
        </div>
      </div>
    )
  }
}

// Responsive behavior
export const ResponsiveBehavior = {
  render: () => {
    const [sortBy, setSortBy] = useState('rating')
    const [viewMode, setViewMode] = useState('grid')

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Mobile (375px)</h3>
          <div className="w-[375px] mx-auto bg-gray-50 p-4">
            <SortViewToggle
              sortBy={sortBy}
              viewMode={viewMode}
              onSortChange={setSortBy}
              onViewChange={setViewMode}
              resultCount={156}
              isLoading={false}
            />
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            "Sort by" label hidden, no result count
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Tablet (768px)</h3>
          <div className="w-[768px] mx-auto bg-gray-50 p-4">
            <SortViewToggle
              sortBy={sortBy}
              viewMode={viewMode}
              onSortChange={setSortBy}
              onViewChange={setViewMode}
              resultCount={156}
              isLoading={false}
            />
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            "Sort by" label visible, result count hidden
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Desktop (1200px)</h3>
          <div className="w-[1200px] mx-auto bg-gray-50 p-4">
            <SortViewToggle
              sortBy={sortBy}
              viewMode={viewMode}
              onSortChange={setSortBy}
              onViewChange={setViewMode}
              resultCount={156}
              isLoading={false}
            />
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            Full layout with label and result count
          </p>
        </div>
      </div>
    )
  }
}

// Accessibility demonstration
export const AccessibilityDemo = {
  render: () => {
    const [sortBy, setSortBy] = useState('rating')
    const [viewMode, setViewMode] = useState('grid')

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <SortViewToggle
          sortBy={sortBy}
          viewMode={viewMode}
          onSortChange={setSortBy}
          onViewChange={setViewMode}
          resultCount={156}
          isLoading={false}
        />

        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Accessibility features:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Keyboard navigation through all controls</li>
            <li>ARIA expanded states for dropdown (aria-expanded)</li>
            <li>ARIA popup indicator (aria-haspopup="listbox")</li>
            <li>Screen reader labels for view toggle buttons</li>
            <li>Button pressed states (aria-pressed)</li>
            <li>Proper focus management with click outside detection</li>
            <li>Semantic HTML with proper roles (listbox, option)</li>
            <li>Selected states for dropdown options (aria-selected)</li>
          </ul>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs">
              <strong>Keyboard test:</strong> Tab to sort dropdown, use Enter/Space to open,
              arrow keys to navigate options, Enter to select. Tab to view toggle,
              use arrow keys or Enter/Space to switch views.
            </p>
          </div>
        </div>
      </div>
    )
  }
}

// Performance showcase
export const PerformanceShowcase = {
  render: () => {
    const [sortBy, setSortBy] = useState('rating')
    const [viewMode, setViewMode] = useState('grid')
    const [changeCount, setChangeCount] = useState(0)

    const handleSortChange = (newSort) => {
      setSortBy(newSort)
      setChangeCount(prev => prev + 1)
    }

    const handleViewChange = (newView) => {
      setViewMode(newView)
      setChangeCount(prev => prev + 1)
    }

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <SortViewToggle
          sortBy={sortBy}
          viewMode={viewMode}
          onSortChange={handleSortChange}
          onViewChange={handleViewChange}
          resultCount={156}
          isLoading={false}
        />

        <div className="mt-6 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Performance Metrics:</h4>
          <div className="space-y-2 text-sm">
            <p><strong>State changes:</strong> {changeCount}</p>
            <p><strong>Current sort:</strong> {sortBy}</p>
            <p><strong>Current view:</strong> {viewMode}</p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <p><strong>Optimizations:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Minimal re-renders with React.useState</li>
              <li>Efficient dropdown with click outside detection</li>
              <li>Smooth animations with Framer Motion</li>
              <li>Event cleanup to prevent memory leaks</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

// Error handling
export const ErrorHandling = {
  render: () => {
    const [sortBy, setSortBy] = useState('invalid_sort')
    const [viewMode, setViewMode] = useState('invalid_view')

    return (
      <div className="max-w-4xl mx-auto bg-gray-50 p-6">
        <SortViewToggle
          sortBy={sortBy}
          viewMode={viewMode}
          onSortChange={setSortBy}
          onViewChange={setViewMode}
          resultCount={null}
          isLoading={false}
        />

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Error Handling Demo</h4>
          <p className="text-yellow-700 text-sm mb-3">
            Component gracefully handles invalid values:
          </p>
          <ul className="text-sm text-yellow-600 space-y-1">
            <li>• Invalid sort option falls back to "Sort by" label</li>
            <li>• Invalid view mode defaults appropriately</li>
            <li>• Null result count is handled without display</li>
            <li>• Component remains functional despite invalid props</li>
          </ul>
        </div>
      </div>
    )
  }
}

// Dark mode (if supported)
export const DarkMode = Template.bind({})
DarkMode.args = {
  sortBy: 'rating',
  viewMode: 'grid',
  resultCount: 156,
  isLoading: false
}
DarkMode.decorators = [
  (Story) => (
    <div className="dark bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Story />
      </div>
    </div>
  )
]